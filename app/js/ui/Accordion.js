//@@../utils
//@@UIObject.js

(function(global) {
'use strict';

var Class = global.Accordion = Accordion;
CommonUtils.inherit(Class, UIObject);
var _ = Class.prototype;

// ========================== CLASS DECLARATION ============================ //

function Accordion(options) {
    _.sup.constructor.call(this, TEMPLATES.Accordion, options);
    CommonUtils.extend(this, Class.defaults, options);

    this._handleClick = this._handleClick.bind(this);

    _._init.call(this);
};

Class.defaults = {
    label      : '',
    contracted : false
};

// ======================= CONSTRUCTOR & DESTRUCTOR ======================== //

_._nullify = function() {
};

_._init = function() {
    _._nullify.call(this);

    this._binds.handle.textContent = this.label;
    this._binds.handle.addEventListener('click', this._handleClick);
    this.setContracted(this.contracted);
};

_.destroy = function() {
    _._nullify.call(this);
    _.sup.destroy.call(this);
};

// =========================== INSTANCE METHODS ============================ //

_.add = function(object) {
    object.appendTo(this._binds.container);
};

_.setContracted = function(contracted) {
    this.contracted = contracted;
    this._element.classList.toggle('contracted', contracted);
};

_.expand = function() {
    if (!this.contracted) {
        return;
    }

    this.setContracted(false);
};

_.contract = function() {
    if (this.contracted) {
        return;
    }

    this.setContracted(true);
};

_.toggleContracted = function() {
    this.setContracted(!this.contracted);
};

_._handleClick = function() {
    if (this.enabled) {
        this.toggleContracted();
    }
};

// ============================ STATIC METHODS ============================= //

})(this);
