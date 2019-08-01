//@@../utils
//@@UIObject.js

(function(global) {
'use strict';

var Class = global.FileChooser = FileChooser;
CommonUtils.inherit(Class, UIObject);
var _ = Class.prototype;

// ========================== CLASS DECLARATION ============================ //

function FileChooser(options) {
    _.sup.constructor.call(this, TEMPLATES.FileChooser, options);
    CommonUtils.extend(this, Class.defaults, options);

    this._handleChange = this._handleChange.bind(this);
    this._handleClick = this._handleClick.bind(this);

    _._init.call(this);
};

Class.defaults = {
};

// ======================= CONSTRUCTOR & DESTRUCTOR ======================== //

_._nullify = function() {
};

_._init = function() {
    _._nullify.call(this);

    this._element.addEventListener('click', this._handleClick);
    this._binds.input.addEventListener('change', this._handleChange);
};

_.destroy = function() {
    _._nullify.call(this);
    _.sup.destroy.call(this);
};

// =========================== INSTANCE METHODS ============================ //

_._handleChange = function() {
    if (this._binds.input.files.length > 0) {
        var fileName = this._binds.input.files[0].name;
        this._binds.label.textContent = fileName;
    } else {
        this._binds.label.textContent = '';
    }
};

_._handleClick = function() {
    this._binds.input.click();
};

_.getFiles = function() {
    return this._binds.input.files;
};

// ============================ STATIC METHODS ============================= //

})(this);
