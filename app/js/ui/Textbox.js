//@@../utils
//@@UIObject.js

(function(global) {
'use strict';

var Class = global.Textbox = Textbox;
CommonUtils.inherit(Class, UIObject);
var _ = Class.prototype;

// ========================== CLASS DECLARATION ============================ //

function Textbox(options) {
    _.sup.constructor.call(this, TEMPLATES.Textbox, options);
    CommonUtils.extend(this, Class.defaults, options);

    _._init.call(this);
};

Class.defaults = {
    value       : '',
    pattern     : '',
    placeholder : ''
};

// ======================= CONSTRUCTOR & DESTRUCTOR ======================== //

_._nullify = function() {
    this._regex = null;
};

_._init = function() {
    _._nullify.call(this);

    this._binds.input.value = this.value;
    this._binds.input.pattern = this.pattern;
    this._binds.input.placeholder = this.placeholder;

    this._regex = new RegExp(this.pattern);
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

_.isValid = function() {
    return this._regex.test(this._binds.input.value);
};

_.getText = function() {
    return this._binds.input.value;
};

_.getMatchedText = function() {
    return this._binds.input.value.match(this._regex);
};

// ============================ STATIC METHODS ============================= //

})(this);
