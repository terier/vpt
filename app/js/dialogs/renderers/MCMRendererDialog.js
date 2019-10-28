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

    this._tfwidget = new TransferFunctionWidget();
    this._binds.tfcontainer.add(this._tfwidget);

    this._fromLocalStorage();
    this._attachHandlers();
};

_.destroy = function() {
    this._detachHandlers();
    this._toLocalStorage();

    this._renderer = null;
    this._tfwidget.destroy();

    _._nullify.call(this);
    _.sup.destroy.call(this);
};

// =========================== INSTANCE METHODS ============================ //

_._attachHandlers = function() {
    if (this._handlersAttached) {
        return;
    }

    this._binds.extinction.addEventListener('input', this._handleChange);
    this._binds.albedo.addEventListener('change', this._handleChange);
    this._binds.bias.addEventListener('change', this._handleChange);
    this._binds.ratio.addEventListener('change', this._handleChange);
    this._binds.bounces.addEventListener('input', this._handleChange);
    this._binds.steps.addEventListener('input', this._handleChange);
    this._tfwidget.addEventListener('change', this._handleTFChange);

    this._handlersAttached = true;
};

_._detachHandlers = function() {
    if (!this._handlersAttached) {
        return;
    }

    this._binds.extinction.removeEventListener('input', this._handleChange);
    this._binds.albedo.removeEventListener('change', this._handleChange);
    this._binds.bias.removeEventListener('change', this._handleChange);
    this._binds.ratio.removeEventListener('change', this._handleChange);
    this._binds.bounces.removeEventListener('input', this._handleChange);
    this._binds.steps.removeEventListener('input', this._handleChange);
    this._tfwidget.removeEventListener('change', this._handleTFChange);

    this._handlersAttached = false;
};

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

// TODO: maybe automate serialization?
_._toLocalStorage = function() {
    localStorage.setItem('MCMRendererDialog', JSON.stringify({
        extinction : this._binds.extinction.getValue(),
        albedo     : this._binds.albedo.getValue(),
        bias       : this._binds.bias.getValue(),
        ratio      : this._binds.ratio.getValue(),
        bounces    : this._binds.bounces.getValue(),
        steps      : this._binds.steps.getValue(),
    }));
};

_._fromLocalStorage = function() {
    var data = localStorage.getItem('MCMRendererDialog');
    if (!data) {
        return;
    }

    data = JSON.parse(data);

    this._detachHandlers();
    this._binds.extinction.setValue(data.extinction);
    this._binds.albedo.setValue(data.albedo);
    this._binds.bias.setValue(data.bias);
    this._binds.ratio.setValue(data.ratio);
    this._binds.bounces.setValue(data.bounces);
    this._binds.steps.setValue(data.steps);
    this._attachHandlers();

    this._handleChange();
    this._handleTFChange();
};

// ============================ STATIC METHODS ============================= //

})(this);
