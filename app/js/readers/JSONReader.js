//@@../utils
//@@AbstractReader.js

(function(global) {
'use strict';

var Class = global.JSONReader = JSONReader;
CommonUtils.inherit(Class, AbstractReader);
var _ = Class.prototype;

// ========================== CLASS DECLARATION ============================ //

function JSONReader(loader, options) {
    _.sup.constructor.call(this, loader, options);
    CommonUtils.extend(this, Class.defaults, options);

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

_.readMetadata = function(handlers) {
    throw CommonUtils.noimpl;
};

_.readBlock = function(block, handlers) {
    throw CommonUtils.noimpl;
};

// ============================ STATIC METHODS ============================= //

})(this);
