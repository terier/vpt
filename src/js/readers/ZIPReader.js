const EOCD_SIGNATURE = [0x50, 0x4b, 0x05, 0x06];
const MIN_EOCD_SIZE = 22;

export class ZIPReader {

    constructor(file) {
        this.file = file;
        this.centralDirectory = null;
    }

    async readFile(fileName) {
        if (!this.centralDirectory) {
            await this.readCentralDirectory();
        }

        const entry = this.centralDirectory.find(entry => entry.name === fileName);
        if (!entry) {
            throw new Error(`ZIPReader: file ${fileName} not found`);
        }

        return entry.file;
    }

    async readCentralDirectory() {
        // assume EOCD is minimal
        const eocdOffset = Math.max(this.file.size - MIN_EOCD_SIZE, 0);

        const eocdBuffer = await this.file.slice(eocdOffset).arrayBuffer();
        const signature = new Uint8Array(eocdBuffer);
        for (let i = 0; i < EOCD_SIGNATURE.length; i++) {
            if (signature[i] !== EOCD_SIGNATURE[i]) {
                throw new Error(`ZIPReader: EOCD not found`);
            }
        }

        const eocd = new DataView(eocdBuffer);
        const entryCount = eocd.getUint16(10, true);
        const cdSize = eocd.getUint32(12, true);
        const cdOffset = eocd.getUint32(16, true);

        // read central directory
        const cdBuffer = await this.file.slice(cdOffset, cdOffset + cdSize).arrayBuffer();
        const cd = new DataView(cdBuffer);

        this.centralDirectory = [];

        let offset = 0;
        for (let i = 0; i < entryCount; i++) {
            // read central directory entry
            const gpflag = cd.getUint16(offset + 8, true);
            const method = cd.getUint16(offset + 10, true);
            const compressedSize = cd.getUint32(offset + 20, true);
            const uncompressedSize = cd.getUint32(offset + 24, true);
            const fileNameLength = cd.getUint16(offset + 28, true);
            const extraFieldLength = cd.getUint16(offset + 30, true);
            const fileCommentLength = cd.getUint16(offset + 32, true);
            const cdEntrySize = 46 + fileNameLength + extraFieldLength + fileCommentLength;
            const name = this.readString(cd, offset + 46, fileNameLength);
            const headerOffset = cd.getUint32(offset + 42, true);

            // read file header
            const headerBuffer = await this.file.slice(headerOffset, headerOffset + 30).arrayBuffer();
            const header = new DataView(headerBuffer);
            const fileName2Length = header.getUint16(26, true);
            const extraField2Length = header.getUint16(28, true);
            const dataStart = headerEnd + fileName2Length + extraField2Length;
            const dataEnd = dataStart + compressedSize;
            const file = this.file.slice(dataStart, dataEnd);

            this.centralDirectory.push({
                gpflag,
                method,
                compressedSize,
                uncompressedSize,
                name,
                file,
            });

            offset += cdEntrySize;
        }
    }

    readString(data, index, length) {
        const decoder = new TextDecoder('utf-8');
        const encoded = data.buffer.slice(index, index + length);
        return decoder.decode(encoded);
    }

}
