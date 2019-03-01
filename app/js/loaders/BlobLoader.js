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

    // init here
};

_.destroy = function() {
    // destroy here

    _._nullify.call(this);
    _.sup.destroy.call(this);
};

// =========================== INSTANCE METHODS ============================ //

_.getLength = function(callback) {
    callback(this.blob.size);
};


_.read = function(start, end, callback) {
    callback(this.blob.slice(start, end));
};

// ============================ STATIC METHODS ============================= //

})(this);
