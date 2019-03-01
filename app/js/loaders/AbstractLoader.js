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

    // init here
};

_.destroy = function() {
    // destroy here

    _._nullify.call(this);
};

// =========================== INSTANCE METHODS ============================ //

_.getLength = function(callback) {
    throw CommonUtils.noimpl;
};


_.read = function(start, end, callback) {
    throw CommonUtils.noimpl;
};

// ============================ STATIC METHODS ============================= //

})(this);
