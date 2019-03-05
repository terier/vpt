//@@../utils/Utils.js

(function(global) {
'use strict';

var Class = global.AbstractLoader = AbstractLoader;
var _ = Class.prototype;

// ========================== CLASS DECLARATION ============================ //

function AbstractLoader(options) {
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
};

// =========================== INSTANCE METHODS ============================ //

_.readLength = function(handlers) {
    throw CommonUtils.noimpl;
};


_.readData = function(start, end, handlers) {
    throw CommonUtils.noimpl;
};

// ============================ STATIC METHODS ============================= //

})(this);
