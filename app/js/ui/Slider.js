//@@../utils
//@@UIObject.js

(function(global) {
'use strict';

var Class = global.Slider = Slider;
CommonUtils.inherit(Class, UIObject);
var _ = Class.prototype;

// ========================== CLASS DECLARATION ============================ //

function Slider(options) {
    _.sup.constructor.call(this, TEMPLATES.Slider, options);
    CommonUtils.extend(this, Class.defaults, options);

    this._handleMouseDown = this._handleMouseDown.bind(this);
    this._handleMouseUp   = this._handleMouseUp.bind(this);
    this._handleMouseMove = this._handleMouseMove.bind(this);
    this._handleWheel     = this._handleWheel.bind(this);

    _._init.call(this);
};

Class.defaults = {
    value       : 0,
    min         : 0,
    max         : 100,
    step        : 1,
    logarithmic : false
};

// ======================= CONSTRUCTOR & DESTRUCTOR ======================== //

_._nullify = function() {
};

_._init = function() {
    _._nullify.call(this);

    this._updateUI();
    this._element.addEventListener('mousedown', this._handleMouseDown);
    this._element.addEventListener('wheel', this._handleWheel);
};

_.destroy = function() {
    document.removeEventListener('mouseup', this._handleMouseUp);
    document.removeEventListener('mousemove', this._handleMouseMove);

    _._nullify.call(this);
    _.sup.destroy.call(this);
};

// =========================== INSTANCE METHODS ============================ //

_.setValue = function(value) {
    this.value = CommonUtils.clamp(value, this.min, this.max);
    this._updateUI();
    this.trigger('change');
};

_._updateUI = function() {
    if (this.logarithmic) {
        var logmin = Math.log(this.min);
        var logmax = Math.log(this.max);
        var ratio = (Math.log(this.value) - logmin) / (logmax - logmin) * 100;
    } else {
        var ratio = (this.value - this.min) / (this.max - this.min) * 100;
    }
    this._binds.button.style.marginLeft = ratio + '%';
};

_.getValue = function() {
    return this.value;
};

_._setValueByEvent = function(e) {
    var rect = this._binds.container.getBoundingClientRect();
    var ratio = (e.pageX - rect.left) / (rect.right - rect.left);
    if (this.logarithmic) {
        var logmin = Math.log(this.min);
        var logmax = Math.log(this.max);
        var value = Math.exp(logmin + ratio * (logmax - logmin));
    } else {
        var value = this.min + ratio * (this.max - this.min);
    }
    this.setValue(value);
};

_._handleMouseDown = function(e) {
    document.addEventListener('mouseup', this._handleMouseUp);
    document.addEventListener('mousemove', this._handleMouseMove);
    this._setValueByEvent(e);
};

_._handleMouseUp = function(e) {
    document.removeEventListener('mouseup', this._handleMouseUp);
    document.removeEventListener('mousemove', this._handleMouseMove);
    this._setValueByEvent(e);
};

_._handleMouseMove = function(e) {
    this._setValueByEvent(e);
};

_._handleWheel = function(e) {
    var wheel = e.deltaY;
    if (wheel < 0) {
        wheel = 1;
    } else if (wheel > 0) {
        wheel = -1;
    } else {
        wheel = 0;
    }

    if (this.logarithmic) {
        var delta = this.value * this.step * wheel;
    } else {
        var delta = this.step * wheel;
    }

    this.setValue(this.value + delta);
};

// ============================ STATIC METHODS ============================= //

})(this);
