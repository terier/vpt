//@@../utils/Utils.js
//@@AbstractReader.js

(function(global) {
'use strict';

var Class = global.JSONReader = JSONReader;
CommonUtils.inherit(Class, AbstractLoader);
var _ = Class.prototype;

// ========================== CLASS DECLARATION ============================ //

function JSONReader(options) {
    _.sup.constructor.call(this, options);
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
    _.sup.destroy.call(this);
};

// =========================== INSTANCE METHODS ============================ //



// ============================ STATIC METHODS ============================= //

})(this);
