//@@../utils
//@@../AbstractDialog.js

(function(global) {
'use strict';

var Class = global.MCSRendererDialog = MCSRendererDialog;
CommonUtils.inherit(Class, AbstractDialog);
var _ = Class.prototype;

// ========================== CLASS DECLARATION ============================ //

function MCSRendererDialog(renderer, options) {
    _.sup.constructor.call(this, UISPECS.MCSRendererDialog, options);
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

    this._binds.extinction.addEventListener('input', this._handleChange);
};

_.destroy = function() {
    this._renderer = null;

    _._nullify.call(this);
    _.sup.destroy.call(this);
};

// =========================== INSTANCE METHODS ============================ //

_._handleChange = function() {
    this._renderer._sigmaMax = this._binds.extinction.getValue();
    this._renderer._alphaCorrection = this._binds.extinction.getValue();

    this._renderer.reset();
};

// ============================ STATIC METHODS ============================= //

})(this);
