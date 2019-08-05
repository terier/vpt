//@@../utils
//@@../AbstractDialog.js

(function(global) {
'use strict';

var Class = global.ISORendererDialog = ISORendererDialog;
CommonUtils.inherit(Class, AbstractDialog);
var _ = Class.prototype;

// ========================== CLASS DECLARATION ============================ //

function ISORendererDialog(renderer, options) {
    _.sup.constructor.call(this, UISPECS.ISORendererDialog, options);
    CommonUtils.extend(this, Class.defaults, options);

    this._renderer = renderer;

    this._handleChange = this._handleChange.bind(this);

    _._init.call(this);
};

Class.defaults = {
};

// ======================= CONSTRUCTOR & DESTRUCTOR ======================== //

_._nullify = function() {
};

_._init = function() {
    _._nullify.call(this);

    this._binds.steps.addEventListener('input', this._handleChange);
    this._binds.isovalue.addEventListener('change', this._handleChange);
    this._binds.color.addEventListener('change', this._handleChange);
    this._binds.direction.addEventListener('input', this._handleChange);
};

_.destroy = function() {
    this._renderer = null;

    _._nullify.call(this);
    _.sup.destroy.call(this);
};

// =========================== INSTANCE METHODS ============================ //

_._handleChange = function() {
    this._renderer._stepSize = 1 / this._binds.steps.getValue();
    this._renderer._isovalue = this._binds.isovalue.getValue();

    var color = CommonUtils.hex2rgb(this._binds.color.getValue());
    this._renderer._diffuse[0] = color.r;
    this._renderer._diffuse[1] = color.g;
    this._renderer._diffuse[2] = color.b;

    var direction = this._binds.direction.getValue();
    this._renderer._light[0] = direction.x;
    this._renderer._light[1] = direction.y;
    this._renderer._light[2] = direction.z;

    this._renderer.reset();
};

// ============================ STATIC METHODS ============================= //

})(this);
