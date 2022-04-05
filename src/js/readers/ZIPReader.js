import { AbstractReader } from './AbstractReader.js';

export class ZIPReader extends AbstractReader {

constructor(loader) {
    super(loader);

    this._eocd = null;
    this._cd = null;
}

async getFiles() {
    if (!this._cd) {
        await this._readCD();
    }

    return this._cd.map(entry => entry.name);
}

async readFile(fileName) {
    if (!this._cd) {
        await this._readCD();
    }

    const entry = this._cd.find(entry => entry.name === fileName);
    if (!entry) {
        throw new Error(`ZIPReader: file ${fileName} not in CD`);
    }

    const headerStart = entry.headerOffset;
    const headerEnd = entry.headerOffset + 30;
    const header = await this._loader.readData(headerStart, headerEnd);
    const view = new DataView(header);
    const fileNameLength = view.getUint16(26, true);
    const extraFieldLength = view.getUint16(28, true);
    const dataStart = headerEnd + fileNameLength + extraFieldLength;
    const dataEnd = dataStart + entry.compressedSize;
    return await this._loader.readData(dataStart, dataEnd);
}

async _readEOCD() {
    const EOCD_SIGNATURE = new Uint8Array([0x50, 0x4b, 0x05, 0x06]);
    const MIN_EOCD_SIZE = 22;

    const length = await this._loader.readLength();
    const offset = Math.max(length - MIN_EOCD_SIZE, 0);
    const size = Math.min(length, MIN_EOCD_SIZE);

    const data = await this._loader.readData(offset, offset + size);
    const view = new DataView(data);
    this._eocd = {
        entries : view.getUint16(10, true),
        size    : view.getUint32(12, true),
        offset  : view.getUint32(16, true),
    };
}

async _readCD() {
    if (!this._eocd) {
        await this._readEOCD();
    }

    const cdstart = this._eocd.offset;
    const cdend = this._eocd.offset + this._eocd.size;
    const data = await this._loader.readData(cdstart, cdend);
    const view = new DataView(data);
    let offset = 0;
    let entries = [];
    for (let i = 0; i < this._eocd.entries; i++) {
        const gpflag = view.getUint16(offset + 8, true);
        const method = view.getUint16(offset + 10, true);
        const compressedSize = view.getUint32(offset + 20, true);
        const uncompressedSize = view.getUint32(offset + 24, true);
        const fileNameLength = view.getUint16(offset + 28, true);
        const extraFieldLength = view.getUint16(offset + 30, true);
        const fileCommentLength = view.getUint16(offset + 32, true);
        const cdEntrySize = 46 + fileNameLength + extraFieldLength + fileCommentLength;
        const name = this._readString(view, offset + 46, fileNameLength);
        const headerOffset = view.getUint32(offset + 42, true);
        entries[i] = {
            gpflag           : gpflag,
            method           : method,
            compressedSize   : compressedSize,
            uncompressedSize : uncompressedSize,
            name             : name,
            headerOffset     : headerOffset
        };
        offset += cdEntrySize;
    }
    this._cd = entries;
}

_readString(data, index, length) {
    const decoder = new TextDecoder('utf-8');
    const encoded = data.buffer.slice(index, index + length);
    return decoder.decode(encoded);
}

}
