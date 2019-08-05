//@@../utils
//@@../AbstractDialog.js

(function(global) {
'use strict';

var Class = global.EAMRendererDialog = EAMRendererDialog;
CommonUtils.inherit(Class, AbstractDialog);
var _ = Class.prototype;

// ========================== CLASS DECLARATION ============================ //

function EAMRendererDialog(renderer, options) {
    _.sup.constructor.call(this, UISPECS.EAMRendererDialog, options);
    CommonUtils.extend(this, Class.defaults, options);

    this._renderer = renderer;

    this._handleChange = this._handleChange.bind(this);

    _._init.call(this);
};

Class.defaults = {
};

// ======================= CONSTRUCTOR & DESTRUCTOR ======================== //

_._nullify = function() {
    this._tfwidget = null;
};

_._init = function() {
    _._nullify.call(this);

    this._binds.steps.addEventListener('input', this._handleChange);
    this._binds.opacity.addEventListener('input', this._handleChange);
};

_.destroy = function() {
    this._renderer = null;

    _._nullify.call(this);
    _.sup.destroy.call(this);
};

// =========================== INSTANCE METHODS ============================ //

_._handleChange = function() {
    this._renderer._stepSize = 1 / this._binds.steps.getValue();
    this._renderer._alphaCorrection = this._binds.opacity.getValue();

    this._renderer.reset();
};

// ============================ STATIC METHODS ============================= //

})(this);
