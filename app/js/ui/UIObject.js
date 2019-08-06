//@@../utils

(function(global) {
'use strict';

var Class = global.UIObject = UIObject;
var _ = Class.prototype;

// ========================== CLASS DECLARATION ============================ //

function UIObject(template, options) {
    CommonUtils.extend(this, Class.defaults, options);

    this._template = template;

    _._init.call(this);
};

Class.defaults = {
    enabled: true,
    visible: true
};

// ======================= CONSTRUCTOR & DESTRUCTOR ======================== //

_._nullify = function() {
    this._binds = null;
    this._element = null;
};

_._init = function() {
    _._nullify.call(this);

    this._element = DOMUtils.instantiate(this._template);
    this._binds = DOMUtils.bind(this._element);

    this._element.classList.toggle('disabled', !this.enabled);
    this._element.classList.toggle('invisible', !this.visible);
};

_.destroy = function() {
    this._template = null;

    DOMUtils.remove(this._element);

    _._nullify.call(this);
};

// =========================== INSTANCE METHODS ============================ //

_.isEnabled = function() {
    return this.enabled;
};

_.setEnabled = function(enabled) {
    if (this.enabled !== enabled) {
        this.enabled = enabled;
        this._element.classList.toggle('disabled', !enabled);
        this.trigger('enabledchange');
        this.trigger(enabled ? 'enable' : 'disable');
    }
};

_.enable = function() {
    this.setEnabled(true);
};

_.disable = function() {
    this.setEnabled(false);
};

_.isVisible = function() {
    return this.visible;
};

_.setVisible = function(visible) {
    if (this.visible !== visible) {
        this.visible = visible;
        this._element.classList.toggle('invisible', !visible);
        this.trigger('visiblechange');
        this.trigger(visible ? 'show' : 'hide');
    }
};

_.show = function() {
    this.setVisible(true);
};

_.hide = function() {
    this.setVisible(false);
};

_.appendTo = function(container) {
    container.appendChild(this._element);
};

_.detach = function() {
    DOMUtils.remove(this._element);
};

_.addEventListener = function(event, listener, options) {
    this._element.addEventListener(event, listener, options);
};

_.removeEventListener = function(event, listener, options) {
    this._element.removeEventListener(event, listener, options);
};

_.trigger = function(name, detail) {
    if (!detail) {
        detail = this;
    }
    var event = new CustomEvent(name, {
        detail: detail
    });
    this._element.dispatchEvent(event);
};

// ============================ STATIC METHODS ============================= //

})(this);
