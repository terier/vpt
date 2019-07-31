//@@../utils
//@@UIObject.js

(function(global) {
'use strict';

var Class = global.Field = Field;
CommonUtils.inherit(Class, UIObject);
var _ = Class.prototype;

// ========================== CLASS DECLARATION ============================ //

function Field(options) {
    _.sup.constructor.call(this, TEMPLATES['Field.html'], options);
    CommonUtils.extend(this, Class.defaults, options);

    _._init.call(this);
};

Class.defaults = {
    label: ''
};

// ======================= CONSTRUCTOR & DESTRUCTOR ======================== //

_._nullify = function() {
    this._content = null;
};

_._init = function() {
    _._nullify.call(this);

    this._binds.label.textContent = this.label;
};

_.destroy = function() {
    if (this._content) {
        this._content.detach();
    }

    _._nullify.call(this);
    _.sup.destroy.call(this);
};

// =========================== INSTANCE METHODS ============================ //

_.setEnabled = function(enabled) {
    if (this._content) {
        this._content.setEnabled(enabled);
    }

    _.sup.setEnabled.call(this, enabled);
};

_.add = function(object) {
    if (!this._content) {
        this._content = object;
        object.appendTo(this._binds.container);
        object.setEnabled(this.enabled);
    }
};

// ============================ STATIC METHODS ============================= //

})(this);
