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
    this._handleClick = this._handleClick.bind(this);

    _._init.call(this);
};

Class.defaults = {
    value: null
};

// ======================= CONSTRUCTOR & DESTRUCTOR ======================== //

_._nullify = function() {
};

_._init = function() {
    _._nullify.call(this);

    var input = this._binds.input;
    input.addEventListener('input', this._handleInput);

    if (this.value !== null) {
        this._binds.input.value = this.value;
    }
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
    this._binds.color.style.backgroundColor = this._binds.input.value /* + alpha */;
};

_._handleClick = function() {
    this._binds.input.click();
};

_.getValue = function() {
    return this._binds.input.value;
};

_.setValue = function(value) {
    this._binds.input.value = value;
};

// ============================ STATIC METHODS ============================= //

})(this);
