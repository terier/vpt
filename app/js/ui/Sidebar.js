//@@../utils/Utils.js
//@@UIObject.js

(function(global) {
'use strict';

var Class = global.Sidebar = Sidebar;
CommonUtils.inherit(Class, UIObject);
var _ = Class.prototype;

// ========================== CLASS DECLARATION ============================ //

function Sidebar(options) {
    _.sup.constructor.call(this, TEMPLATES['Sidebar.html'], options);
    CommonUtils.extend(this, Class.defaults, options);

    this._handleClick = this._handleClick.bind(this);

    _._init.call(this);
};

Class.defaults = {
    contracted: false
};

// ======================= CONSTRUCTOR & DESTRUCTOR ======================== //

_._nullify = function() {
};

_._init = function() {
    _._nullify.call(this);

    this._binds.handle.addEventListener('click', this._handleClick);
    this.setContracted(this.contracted);
};

_.destroy = function() {
    _._nullify.call(this);
};

// =========================== INSTANCE METHODS ============================ //

_.add = function(object) {
    object.appendTo(this.getContainer());
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

_.getContainer = function() {
    return this._binds.container;
};

_._handleClick = function() {
    if (this.enabled) {
        this.toggleContracted();
    }
};

// ============================ STATIC METHODS ============================= //

})(this);
