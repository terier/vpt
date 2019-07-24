//@@../utils/Utils.js
//@@UIObject.js

(function(global) {
'use strict';

var Class = global.Field = Field;
CommonUtils.inherit(Class, UIObject);
var _ = Class.prototype;

// ========================== CLASS DECLARATION ============================ //

function Field(container, label, options) {
    _.sup.constructor.call(this, container, TEMPLATES['Field.html'], options);
    CommonUtils.extend(this, Class.defaults, options);

    this._label = label;

    _._init.call(this);
};

Class.defaults = {
};

// ======================= CONSTRUCTOR & DESTRUCTOR ======================== //

_._nullify = function() {
};

_._init = function() {
    _._nullify.call(this);

    this._binds.label.textContent = this._label;
};

_.destroy = function() {
    _._nullify.call(this);
};

// =========================== INSTANCE METHODS ============================ //

_.getContainer = function() {
    return this._binds.container;
};

// ============================ STATIC METHODS ============================= //

})(this);
