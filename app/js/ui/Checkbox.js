//@@../utils
//@@UIObject.js

(function(global) {
'use strict';

var Class = global.Checkbox = Checkbox;
CommonUtils.inherit(Class, UIObject);
var _ = Class.prototype;

// ========================== CLASS DECLARATION ============================ //

function Checkbox(options) {
    _.sup.constructor.call(this, TEMPLATES['Checkbox.html'], options);
    CommonUtils.extend(this, Class.defaults, options);

    this._handleClick = this._handleClick.bind(this);

    _._init.call(this);
};

Class.defaults = {
    checked : true
};

// ======================= CONSTRUCTOR & DESTRUCTOR ======================== //

_._nullify = function() {
};

_._init = function() {
    _._nullify.call(this);

    this._element.addEventListener('click', this._handleClick);
    this._element.classList.toggle('checked', this.checked);
};

_.destroy = function() {
    _._nullify.call(this);
    _.sup.destroy.call(this);
};

// =========================== INSTANCE METHODS ============================ //

_.isChecked = function() {
    return this.checked;
};

_.setChecked = function(checked) {
    if (this.checked !== checked) {
        this.checked = checked;
        this._element.classList.toggle('checked', checked);
        this.trigger('change');
    }
};

_.toggleChecked = function() {
    this.setChecked(!this.checked);
};

_._handleClick = function() {
    if (this.enabled) {
        this.toggleChecked();
    }
};

// ============================ STATIC METHODS ============================= //

})(this);
