//@@../utils
//@@../AbstractDialog.js

(function(global) {
'use strict';

var Class = global.MIPRendererDialog = MIPRendererDialog;
CommonUtils.inherit(Class, AbstractDialog);
var _ = Class.prototype;

// ========================== CLASS DECLARATION ============================ //

function MIPRendererDialog(renderer, options) {
    _.sup.constructor.call(this, UISPECS.MIPRendererDialog, options);
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

    this._binds.steps.addEventListener('change', this._handleChange);
};

_.destroy = function() {
    this._renderer = null;

    _._nullify.call(this);
    _.sup.destroy.call(this);
};

// =========================== INSTANCE METHODS ============================ //

_._handleChange = function() {
    this._renderer._stepSize = 1 / this._binds.steps.getValue();
};

// ============================ STATIC METHODS ============================= //

})(this);
