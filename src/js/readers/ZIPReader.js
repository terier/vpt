// #part /js/readers/ZIPReader

// #link AbstractReader

class ZIPReader extends AbstractReader {

constructor(loader) {
    super(loader);

    this._length = null;
    this._eocd = null;
    this._cd = null;
}

getFiles(handlers) {
    function getFiles() {
        handlers.onData && handlers.onData(this._cd.map(e => e.name));
    }

    if (!this._cd) {
        this._readCD({
            onData: () => {
                getFiles();
            }
        });
    } else {
        getFiles();
    }
}

readFile(fileName, handlers) {
    const readFile = function() {
        const entry = this._cd.find(entry => entry.name === fileName);
        if (entry) {
            this._loader.readData(entry.headerOffset, entry.headerOffset + 30, {
                onData: header => {
                    header = new DataView(header);
                    const fileNameLength = header.getUint16(26, true);
                    const extraFieldLength = header.getUint16(28, true);
                    const dataOffset = entry.headerOffset + 30 + fileNameLength + extraFieldLength;
                    this._loader.readData(dataOffset, dataOffset + entry.compressedSize, {
                        onData: data => {
                            handlers.onData && handlers.onData(data);
                        }
                    });
                }
            });
        }
    }.bind(this);

    if (!this._cd) {
        this._readCD({
            onData: () => {
                readFile();
            }
        });
    } else {
        readFile();
    }
}

_readString(data, index, length) {
    const decoder = new TextDecoder('utf-8');
    const encoded = data.buffer.slice(index, index + length);
    return decoder.decode(encoded);
}

_readEOCD(handlers) {
    if (this._eocd) {
        return;
    }

    const readEOCD = function() {
        var EOCD_SIGNATURE = new Uint8Array([0x50, 0x4b, 0x05, 0x06]);
        var MIN_EOCD_SIZE = 22;
        var offset = Math.max(this._length - MIN_EOCD_SIZE, 0);
        var length = Math.min(this._length, MIN_EOCD_SIZE);

        this._loader.readData(offset, offset + length, {
            onData: data => {
                data = new DataView(data);
                this._eocd = {
                    entries: data.getUint16(10, true),
                    size   : data.getUint32(12, true),
                    offset : data.getUint32(16, true),
                };
                handlers.onData && handlers.onData();
            }
        });
    }.bind(this);

    if (!this._length) {
        this._loader.readLength({
            onData: length => {
                this._length = length;
                readEOCD();
            }
        });
    } else {
        readEOCD();
    }
}

_readCD(handlers) {
    if (this._cd) {
        return;
    }

    const readCD = function() {
        this._loader.readData(this._eocd.offset, this._eocd.offset + this._eocd.size, {
            onData: data => {
                data = new DataView(data);
                let offset = 0;
                let entries = [];
                for (let i = 0; i < this._eocd.entries; i++) {
                    const gpflag = data.getUint16(offset + 8, true);
                    const method = data.getUint16(offset + 10, true);
                    const compressedSize = data.getUint32(offset + 20, true);
                    const uncompressedSize = data.getUint32(offset + 24, true);
                    const fileNameLength = data.getUint16(offset + 28, true);
                    const extraFieldLength = data.getUint16(offset + 30, true);
                    const fileCommentLength = data.getUint16(offset + 32, true);
                    const cdEntrySize = 46 + fileNameLength + extraFieldLength + fileCommentLength;
                    const name = this._readString(data, offset + 46, fileNameLength);
                    const headerOffset = data.getUint32(offset + 42, true);
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
                handlers.onData && handlers.onData();
            }
        });
    }.bind(this);

    if (!this._eocd) {
        this._readEOCD({
            onData: () => {
                readCD();
            }
        });
    } else {
        readCD();
    }
}

}
