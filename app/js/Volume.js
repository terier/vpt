(function(global) {
'use strict';

var Class = global.Volume = Volume;
var _ = Class.prototype;

// ========================== CLASS DECLARATION ============================ //

function Volume(reader, options) {
    CommonUtils.extend(this, Class.defaults, options);

    this._reader = reader;

    _._init.call(this);
};

Class.defaults = {
};

// ======================= CONSTRUCTOR & DESTRUCTOR ======================== //

_._nullify = function() {
    this.meta       = null;
    this.modalities = null;
    this.blocks     = null;
};

_._init = function() {
    _._nullify.call(this);
};

_.destroy = function() {
    _._nullify.call(this);
};

// =========================== INSTANCE METHODS ============================ //

_.readMetadata = function(handlers) {
    this._reader.readMetadata({
        onData: function(data) {
            this.meta = data.meta;
            this.modalities = data.modalities;
            this.blocks = data.blocks;
            handlers.onData && handlers.onData();
        }.bind(this)
    });
};

_.readBlock = function(block, handlers) {
    this._reader.readBlock(block, handlers);
};

// ============================ STATIC METHODS ============================= //

})(this);
