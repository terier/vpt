//@@../utils
//@@AbstractLoader.js

(function(global) {
'use strict';

var Class = global.BlobLoader = BlobLoader;
CommonUtils.inherit(Class, AbstractLoader);
var _ = Class.prototype;

// ========================== CLASS DECLARATION ============================ //

function BlobLoader(blob, options) {
    _.sup.constructor.call(this, options);
    CommonUtils.extend(this, Class.defaults, options);

    this.blob = blob;

    _._init.call(this);
};

Class.defaults = {
};

// ======================= CONSTRUCTOR & DESTRUCTOR ======================== //

_._nullify = function() {
};

_._init = function() {
    _._nullify.call(this);
};

_.destroy = function() {
    _._nullify.call(this);
    _.sup.destroy.call(this);
};

// =========================== INSTANCE METHODS ============================ //

_.readLength = function(handlers) {
    handlers.onData && handlers.onData(this.blob.size);
};


_.readData = function(start, end, handlers) {
    var fileReader = new FileReader();
    fileReader.addEventListener('load', function(e) {
        handlers.onData && handlers.onData(e.target.result);
    });
    fileReader.readAsArrayBuffer(this.blob.slice(start, end));
};

// ============================ STATIC METHODS ============================= //

})(this);
