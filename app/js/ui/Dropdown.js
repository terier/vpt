//@@../utils
//@@UIObject.js

(function(global) {
'use strict';

var Class = global.Dropdown = Dropdown;
CommonUtils.inherit(Class, UIObject);
var _ = Class.prototype;

// ========================== CLASS DECLARATION ============================ //

function Dropdown(options) {
    _.sup.constructor.call(this, TEMPLATES.Dropdown, options);
    CommonUtils.extend(this, Class.defaults, options);

    _._init.call(this);
};

Class.defaults = {
    options: null
};

// ======================= CONSTRUCTOR & DESTRUCTOR ======================== //

_._nullify = function() {
};

_._init = function() {
    _._nullify.call(this);

    if (this.options) {
        this.options.forEach(function(option) {
            this.addOption(option.value, option.label);
        }, this);
    }
};

_.destroy = function() {
    _._nullify.call(this);
    _.sup.destroy.call(this);
};

// =========================== INSTANCE METHODS ============================ //

_.addOption = function(value, label) {
    var option = document.createElement('option');
    option.value = value;
    option.text = label;
    this._binds.input.add(option);
};

_.setValue = function(value) {
    this._binds.input.value = value;
};

_.getValue = function() {
    return this._binds.input.value;
};

// ============================ STATIC METHODS ============================= //

})(this);
