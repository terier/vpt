//@@../utils
//@@UIObject.js

(function(global) {
'use strict';

var Class = global.ColorChooser = ColorChooser;
CommonUtils.inherit(Class, UIObject);
var _ = Class.prototype;

// ========================== CLASS DECLARATION ============================ //

function ColorChooser(options) {
    _.sup.constructor.call(this, TEMPLATES.ColorChooser, options);
    CommonUtils.extend(this, Class.defaults, options);

    this._handleInput = this._handleInput.bind(this);
    this._handleChange = this._handleChange.bind(this);
    this._handleClick = this._handleClick.bind(this);

    _._init.call(this);
};

Class.defaults = {
};

// ======================= CONSTRUCTOR & DESTRUCTOR ======================== //

_._nullify = function() {
};

_._init = function() {
    _._nullify.call(this);

    var input = this._binds.input;
    input.addEventListener('input', this._handleInput);
    input.addEventListener('change', this._handleChange);

    this._binds.color.style.backgroundColor = this._binds.input.value /* + alpha */;
    this._element.addEventListener('click', this._handleClick);
};

_.destroy = function() {
    _._nullify.call(this);
    _.sup.destroy.call(this);
};

// =========================== INSTANCE METHODS ============================ //

_.setEnabled = function(enabled) {
    this._binds.input.disabled = !enabled;
    _.sup.setEnabled.call(this, enabled);
};

_._handleInput = function(e) {
    e.stopPropagation();

    this._binds.color.style.backgroundColor = this._binds.input.value /* + alpha */;
};

_._handleChange = function(e) {
    e.stopPropagation();
};

_._handleClick = function() {
    this._binds.input.click();
};

// ============================ STATIC METHODS ============================= //

})(this);
