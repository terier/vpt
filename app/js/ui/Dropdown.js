//@@../utils
//@@UIObject.js

(function(global) {
'use strict';

var Class = global.Dropdown = Dropdown;
CommonUtils.inherit(Class, UIObject);
var _ = Class.prototype;

// ========================== CLASS DECLARATION ============================ //

function Dropdown(_options, options) {
    _.sup.constructor.call(this, TEMPLATES['Dropdown.html'], options);
    CommonUtils.extend(this, Class.defaults, options);

    this._options = _options;

    _._init.call(this);
};

Class.defaults = {
};

// ======================= CONSTRUCTOR & DESTRUCTOR ======================== //

_._nullify = function() {
};

_._init = function() {
    _._nullify.call(this);

    this._options.forEach(function(option) {
        this.addOption(option.value, option.label);
    }, this);
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
