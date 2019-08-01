//@@../utils
//@@UIObject.js
//@@Spinner.js

(function(global) {
'use strict';

var Class = global.VectorSpinner = VectorSpinner;
CommonUtils.inherit(Class, UIObject);
var _ = Class.prototype;

// ========================== CLASS DECLARATION ============================ //

function VectorSpinner(options) {
    _.sup.constructor.call(this, TEMPLATES.VectorSpinner, options);
    CommonUtils.extend(this, Class.defaults, options);

    _._init.call(this);
};

Class.defaults = {
    value : 10,
    min   : 0,
    max   : 100,
    step  : 1
};

// ======================= CONSTRUCTOR & DESTRUCTOR ======================== //

_._nullify = function() {
    this._spinnerX = null;
    this._spinnerY = null;
    this._spinnerZ = null;
};

_._init = function() {
    _._nullify.call(this);

    var options = {
        value : this.value,
        min   : this.min,
        max   : this.max,
        step  : this.step
    };

    this._spinnerX = new Spinner(options);
    this._spinnerY = new Spinner(options);
    this._spinnerZ = new Spinner(options);

    this._spinnerX.appendTo(this._binds.vectorX);
    this._spinnerY.appendTo(this._binds.vectorY);
    this._spinnerZ.appendTo(this._binds.vectorZ);
};

_.destroy = function() {
    this._spinnerX.destroy();
    this._spinnerY.destroy();
    this._spinnerZ.destroy();

    _._nullify.call(this);
    _.sup.destroy.call(this);
};

// =========================== INSTANCE METHODS ============================ //

_.setEnabled = function(enabled) {
    this._spinnerX.setEnabled(enabled);
    this._spinnerY.setEnabled(enabled);
    this._spinnerZ.setEnabled(enabled);
    _.sup.setEnabled.call(this, enabled);
};

_.setVisible = function(visible) {
    this._spinnerX.setVisible(visible);
    this._spinnerY.setVisible(visible);
    this._spinnerZ.setVisible(visible);
    _.sup.setVisible.call(this, visible);
};

_.setValue = function(value) {
    this._spinnerX.setValue(value.x);
    this._spinnerY.setValue(value.y);
    this._spinnerZ.setValue(value.z);
};

_.getValue = function() {
    return {
        x: this._spinnerX.getValue(),
        y: this._spinnerY.getValue(),
        z: this._spinnerZ.getValue(),
    };
};

// ============================ STATIC METHODS ============================= //

})(this);
