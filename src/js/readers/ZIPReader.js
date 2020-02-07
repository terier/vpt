// #package js/main

// #include AbstractReader.js

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
                    header = new Uint8Array(header);
                    const fileNameLength = this._readShort(header, 26);
                    const extraFieldLength = this._readShort(header, 28);
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

_readByte(data, index) {
    return data[index];
}

_readShort(data, index) {
    return data[index]
        | (data[index + 1] << 8);
}

_readInt(data, index) {
    return data[index]
        | (data[index + 1] << 8)
        | (data[index + 2] << 16)
        | (data[index + 3] << 24);
}

_readString(data, index, length) {
    const decoder = new TextDecoder('utf-8');
    const encoded = data.slice(index, index + length);
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
                data = new Uint8Array(data);
                this._eocd = {
                    entries: this._readShort(data, 10),
                    size   : this._readInt(data, 12),
                    offset : this._readInt(data, 16)
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
                data = new Uint8Array(data);
                let offset = 0;
                let entries = [];
                for (let i = 0; i < this._eocd.entries; i++) {
                    const gpflag = this._readShort(data, offset + 8);
                    const method = this._readShort(data, offset + 10);
                    const compressedSize = this._readInt(data, offset + 20);
                    const uncompressedSize = this._readInt(data, offset + 24);
                    const fileNameLength = this._readShort(data, offset + 28);
                    const extraFieldLength = this._readShort(data, offset + 30);
                    const fileCommentLength = this._readShort(data, offset + 32);
                    const cdEntrySize = 46 + fileNameLength + extraFieldLength + fileCommentLength;
                    const name = this._readString(data, offset + 46, fileNameLength);
                    const headerOffset = this._readInt(data, offset + 42);
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
