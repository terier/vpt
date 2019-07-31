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
};

_._init = function() {
    _._nullify.call(this);

    this._binds.input.value = this.value;
    this._binds.input.pattern = this.pattern;
    this._binds.input.placeholder = this.placeholder;
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

// ============================ STATIC METHODS ============================= //

})(this);
