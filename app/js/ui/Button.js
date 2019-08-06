//@@../utils
//@@UIObject.js

(function(global) {
'use strict';

var Class = global.Button = Button;
CommonUtils.inherit(Class, UIObject);
var _ = Class.prototype;

// ========================== CLASS DECLARATION ============================ //

function Button(options) {
    _.sup.constructor.call(this, TEMPLATES.Button, options);
    CommonUtils.extend(this, Class.defaults, options);

    _._init.call(this);
};

Class.defaults = {
    label: ''
};

// ======================= CONSTRUCTOR & DESTRUCTOR ======================== //

_._nullify = function() {
};

_._init = function() {
    _._nullify.call(this);

    this._binds.input.value = this.label;
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
