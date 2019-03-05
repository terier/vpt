//@@../utils/Utils.js
//@@AbstractReader.js

(function(global) {
'use strict';

var Class = global.ZIPReader = ZIPReader;
CommonUtils.inherit(Class, AbstractReader);
var _ = Class.prototype;

// ========================== CLASS DECLARATION ============================ //

function ZIPReader(loader, options) {
    _.sup.constructor.call(this, loader, options);
    CommonUtils.extend(this, Class.defaults, options);

    _._init.call(this);
};

Class.defaults = {
};

// ======================= CONSTRUCTOR & DESTRUCTOR ======================== //

_._nullify = function() {
    this._length = null;
    this._eocd = null;
    this._cd = null;
};

_._init = function() {
    _._nullify.call(this);
};

_.destroy = function() {
    _._nullify.call(this);
    _.sup.destroy.call(this);
};

// =========================== INSTANCE METHODS ============================ //

_.readMetadata = function(handlers) {
    throw CommonUtils.noimpl;
};

_.readBlock = function(block, handlers) {
    throw CommonUtils.noimpl;
};

_.getFiles = function(handlers) {
    function getFiles() {
        handlers.onData && handlers.onData(this._cd.map(function(e) {
            return e.name;
        }));
    }

    if (!this._cd) {
        this._readCD({
            onData: function() {
                getFiles();
            }.bind(this)
        });
    } else {
        getFiles();
    }
};

_.readFile = function(fileName, handlers) {
    var readFile = function() {
        var entry = this._cd.find(function(entry) {
            return entry.name === fileName;
        });

        if (entry) {
            this._loader.readData(entry.headerOffset, entry.headerOffset + 30, {
                onData: function(header) {
                    header = new Uint8Array(header);
                    var fileNameLength = this._readShort(header, 26);
                    var extraFieldLength = this._readShort(header, 28);
                    var dataOffset = entry.headerOffset + 30 + fileNameLength + extraFieldLength;
                    this._loader.readData(dataOffset, dataOffset + entry.compressedSize, {
                        onData: function(data) {
                            handlers.onData && handlers.onData(data);
                        }.bind(this)
                    });
                }.bind(this)
            });
        }
    }.bind(this);

    if (!this._cd) {
        this._readCD({
            onData: function() {
                readFile();
            }.bind(this)
        });
    } else {
        readFile();
    }
};

_._readByte = function(data, index) {
    return data[index];
};

_._readShort = function(data, index) {
    return data[index]
        | (data[index + 1] << 8);
};

_._readInt = function(data, index) {
    return data[index]
        | (data[index + 1] << 8)
        | (data[index + 2] << 16)
        | (data[index + 3] << 24);
};

_._readString = function(data, index, length) {
    var decoder = new TextDecoder('utf-8');
    var encoded = data.slice(index, index + length);
    return decoder.decode(encoded);
};

_._readEOCD = function(handlers) {
    if (this._eocd) {
        return;
    }

    var readEOCD = function() {
        var EOCD_SIGNATURE = new Uint8Array([0x50, 0x4b, 0x05, 0x06]);
        var MIN_EOCD_SIZE = 22;
        var offset = Math.max(this._length - MIN_EOCD_SIZE, 0);
        var length = Math.min(this._length, MIN_EOCD_SIZE);

        this._loader.readData(offset, offset + length, {
            onData: function(data) {
                data = new Uint8Array(data);
                this._eocd = {
                    entries: this._readShort(data, 10),
                    size   : this._readInt(data, 12),
                    offset : this._readInt(data, 16)
                };
                handlers.onData && handlers.onData();
            }.bind(this)
        });
    }.bind(this);

    if (!this._length) {
        this._loader.readLength({
            onData: function(length) {
                this._length = length;
                readEOCD();
            }.bind(this)
        });
    } else {
        readEOCD();
    }
};

_._readCD = function(handlers) {
    if (this._cd) {
        return;
    }

    var readCD = function() {
        this._loader.readData(this._eocd.offset, this._eocd.offset + this._eocd.size, {
            onData: function(data) {
                data = new Uint8Array(data);
                var offset = 0;
                var entries = [];
                for (var i = 0; i < this._eocd.entries; i++) {
                    var gpflag = this._readShort(data, offset + 8);
                    var method = this._readShort(data, offset + 10);
                    var compressedSize = this._readInt(data, offset + 20);
                    var uncompressedSize = this._readInt(data, offset + 24);
                    var fileNameLength = this._readShort(data, offset + 28);
                    var extraFieldLength = this._readShort(data, offset + 30);
                    var fileCommentLength = this._readShort(data, offset + 32);
                    var cdEntrySize = 46 + fileNameLength + extraFieldLength + fileCommentLength;
                    var name = this._readString(data, offset + 46, fileNameLength);
                    var headerOffset = this._readInt(data, offset + 42);
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
            }.bind(this)
        });
    }.bind(this);

    if (!this._eocd) {
        this._readEOCD({
            onData: function() {
                readCD();
            }.bind(this)
        });
    } else {
        readCD();
    }
};

// ============================ STATIC METHODS ============================= //

})(this);
