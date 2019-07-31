//@@../utils
//@@UIObject.js

(function(global) {
'use strict';

var Class = global.Panel = Panel;
CommonUtils.inherit(Class, UIObject);
var _ = Class.prototype;

// ========================== CLASS DECLARATION ============================ //

function Panel(options) {
    _.sup.constructor.call(this, TEMPLATES.Panel, options);
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

_.add = function(object) {
    object.appendTo(this._element);
};

// ============================ STATIC METHODS ============================= //

})(this);
