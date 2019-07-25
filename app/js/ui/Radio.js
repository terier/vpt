//@@../utils
//@@UIObject.js

(function(global) {
'use strict';

var Class = global.Radio = Radio;
CommonUtils.inherit(Class, UIObject);
var _ = Class.prototype;

// ========================== CLASS DECLARATION ============================ //

function Radio(_options, options) {
    _.sup.constructor.call(this, TEMPLATES['Radio.html'], options);
    CommonUtils.extend(this, Class.defaults, options);

    this._options = _options;
    this._radioName = 'radio' + Radio._nextId++;

    this._handleClick = this._handleClick.bind(this);

    _._init.call(this);
};

Class.defaults = {
    vertical: false
};

// ======================= CONSTRUCTOR & DESTRUCTOR ======================== //

_._nullify = function() {
};

_._init = function() {
    _._nullify.call(this);

    this._element.classList.toggle('vertical', this.vertical);
    this._options.forEach(function(option) {
        this.addOption(option.value, option.label, option.selected);
    }, this);
};

_.destroy = function() {
    _._nullify.call(this);
    _.sup.destroy.call(this);
};

// =========================== INSTANCE METHODS ============================ //

_.addOption = function(value, label, selected) {
    var option = DOMUtils.instantiate(TEMPLATES['RadioOption.html']);
    var binds = DOMUtils.bind(option);
    binds.input.name = this._radioName;
    binds.input.value = value;
    if (selected) {
        binds.input.checked = true;
    }
    binds.label.textContent = label;
    binds.label.addEventListener('click', this._handleClick);
    this._element.appendChild(option);
};

_.getValue = function() {
    var selector = '.radio-option > input:checked';
    var input = this._element.querySelector(selector);
    return input ? input.value : null;
};

_.setValue = function(value) {
    var selector = '.radio-option > input[value="' + value + '"]';
    var input = this._element.querySelector(selector);
    if (input) {
        input.select();
    }
};

_._handleClick = function(e) {
    e.currentTarget.parentNode.querySelector('input').checked = true;
};

// ============================ STATIC METHODS ============================= //

Radio._nextId = 0;

})(this);
