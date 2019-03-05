//@@../utils/Utils.js
//@@AbstractReader.js
//@@ZIPReader.js

(function(global) {
'use strict';

var Class = global.BVPReader = BVPReader;
CommonUtils.inherit(Class, AbstractReader);
var _ = Class.prototype;

// ========================== CLASS DECLARATION ============================ //

function BVPReader(loader, options) {
    _.sup.constructor.call(this, loader, options);
    CommonUtils.extend(this, Class.defaults, options);

    _._init.call(this);
};

Class.defaults = {
};

// ======================= CONSTRUCTOR & DESTRUCTOR ======================== //

_._nullify = function() {
    this._metadata  = null;
    this._zipReader = null;
};

_._init = function() {
    _._nullify.call(this);

    this._zipReader = new ZIPReader(this._loader);
};

_.destroy = function() {
    _._nullify.call(this);
    _.sup.destroy.call(this);
};

// =========================== INSTANCE METHODS ============================ //

_.readMetadata = function(handlers) {
    this._zipReader.readFile('manifest.json', {
        onData: function(data) {
            var decoder = new TextDecoder('utf-8');
            var jsonString = decoder.decode(data);
            var json = JSON.parse(jsonString);
            this._metadata = json;
            handlers.onData && handlers.onData(json);
        }.bind(this)
    });
};

_.readBlock = function(block, handlers) {
    if (!this._metadata) {
        return;
    }

    var block = this._metadata.blocks[block];
    this._zipReader.readFile(block.url, {
        onData: function(data) {
            handlers.onData && handlers.onData(data);
        }.bind(this)
    });
};

// ============================ STATIC METHODS ============================= //

})(this);
