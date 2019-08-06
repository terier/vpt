//@@../utils

(function(global) {
'use strict';

var Class = global.AbstractReader = AbstractReader;
var _ = Class.prototype;

// ========================== CLASS DECLARATION ============================ //

function AbstractReader(loader, options) {
    CommonUtils.extend(this, Class.defaults, options);

    this._loader = loader;

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
};

// =========================== INSTANCE METHODS ============================ //

_.readMetadata = function(handlers) {
    throw CommonUtils.noimpl;
};

_.readBlock = function(block, handlers) {
    throw CommonUtils.noimpl;
};

// ============================ STATIC METHODS ============================= //

})(this);
