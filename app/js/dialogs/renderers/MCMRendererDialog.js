//@@../../utils
//@@../AbstractDialog.js
//@@../../TransferFunctionWidget.js

(function(global) {
'use strict';

var Class = global.MCMRendererDialog = MCMRendererDialog;
CommonUtils.inherit(Class, AbstractDialog);
var _ = Class.prototype;

// ========================== CLASS DECLARATION ============================ //

function MCMRendererDialog(renderer, options) {
    _.sup.constructor.call(this, UISPECS.MCMRendererDialog, options);
    CommonUtils.extend(this, Class.defaults, options);

    this._renderer = renderer;

    this._handleChange = this._handleChange.bind(this);
    this._handleTFChange = this._handleTFChange.bind(this);

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
    this._binds.albedo.addEventListener('change', this._handleChange);
    this._binds.bias.addEventListener('change', this._handleChange);
    this._binds.ratio.addEventListener('change', this._handleChange);
    this._binds.bounces.addEventListener('input', this._handleChange);
    this._binds.steps.addEventListener('input', this._handleChange);

    this._tfwidget = new TransferFunctionWidget();
    this._binds.tfcontainer.add(this._tfwidget);
    this._tfwidget.addEventListener('change', this._handleTFChange);
};

_.destroy = function() {
    this._renderer = null;
    this._tfwidget.destroy();

    _._nullify.call(this);
    _.sup.destroy.call(this);
};

// =========================== INSTANCE METHODS ============================ //

_._handleChange = function() {
    var extinction = this._binds.extinction.getValue();
    var albedo     = this._binds.albedo.getValue();
    var bias       = this._binds.bias.getValue();
    var ratio      = this._binds.ratio.getValue();
    var bounces    = this._binds.bounces.getValue();
    var steps      = this._binds.steps.getValue();

    this._renderer.absorptionCoefficient = extinction * (1 - albedo);
    this._renderer.scatteringCoefficient = extinction * albedo;
    this._renderer.scatteringBias = bias;
    this._renderer.majorant = extinction * ratio;
    this._renderer.maxBounces = bounces;
    this._renderer.steps = steps;

    this._renderer.reset();
};

_._handleTFChange = function() {
    this._renderer.setTransferFunction(this._tfwidget.getTransferFunction());
    this._renderer.reset();
};

// ============================ STATIC METHODS ============================= //

})(this);
