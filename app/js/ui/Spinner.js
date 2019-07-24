//@@../utils/Utils.js
//@@UIObject.js

(function(global) {
'use strict';

var Class = global.Spinner = Spinner;
CommonUtils.inherit(Class, UIObject);
var _ = Class.prototype;

// ========================== CLASS DECLARATION ============================ //

function Spinner(container, options) {
    _.sup.constructor.call(this, container, TEMPLATES['Spinner.html'], options);
    CommonUtils.extend(this, Class.defaults, options);

    this._handleInput = this._handleInput.bind(this);
    this._handleChange = this._handleChange.bind(this);

    _._init.call(this);
};

Class.defaults = {
    value : 10,
    min   : 0,
    max   : 100,
    step  : 1,
    unit  : null // TODO: add a label with units at the end of input
};

// ======================= CONSTRUCTOR & DESTRUCTOR ======================== //

_._nullify = function() {
};

_._init = function() {
    _._nullify.call(this);

    var input = this._binds.input;
    input.value = this.value;
    input.min = this.min;
    input.max = this.max;
    input.step = this.step;

    input.addEventListener('input', this._handleInput);
    input.addEventListener('change', this._handleChange);
};

_.destroy = function() {
    _._nullify.call(this);
};

// =========================== INSTANCE METHODS ============================ //

_._setValue = function(value) {
    this.value = Math.min(Math.max(value, this.min), this.max);
};

_.setValue = function(value) {
    this._setValue(value);
};

_.getValue = function() {
    return this.value;
};

_._handleInput = function(e) {
    e.stopPropagation();

    if (this._binds.input.value === '') {
        return;
    }

    var parsedValue = parseInt(this._binds.input.value, 10);
    if (!isNaN(parsedValue)) {
        this._setValue(parsedValue);
        this.trigger('changeall');
    } else {
        this._binds.input.value = parsedValue;
    }
};

_._handleChange = function(e) {
    e.stopPropagation();

    var parsedValue = parseInt(this._binds.input.value, 10);
    if (!isNaN(parsedValue)) {
        this._setValue(parsedValue, 'change');
        if (this._binds.input.value !== this.value) {
            this._binds.input.value = this.value;
            this.trigger('change');
        }
    } else {
        this._binds.input.value = this.value;
    }
};

// ============================ STATIC METHODS ============================= //

})(this);
