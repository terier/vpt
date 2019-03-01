//@@../utils/Utils.js
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

_.createMetadataRequest = function(handlers) {
    handlers.loadstart && handlers.loadstart();
    handlers.progress && handlers.progress(0);
    handlers.load && (this.blob.size);
    handlers.progress && handlers.progress(0);
    handlers.loadend && handlers.loadend();
};


_.createDataRequest = function(start, end, handlers) {
    callback(this.blob.slice(start, end));
};

// ============================ STATIC METHODS ============================= //

})(this);
