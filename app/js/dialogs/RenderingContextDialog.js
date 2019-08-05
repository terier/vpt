//@@../utils
//@@AbstractDialog.js

(function(global) {
'use strict';

var Class = global.RenderingContextDialog = RenderingContextDialog;
CommonUtils.inherit(Class, AbstractDialog);
var _ = Class.prototype;

// ========================== CLASS DECLARATION ============================ //

function RenderingContextDialog(options) {
    _.sup.constructor.call(this, UISPECS.RenderingContextDialog, options);
    CommonUtils.extend(this, Class.defaults, options);

    this._handleResolutionChange = this._handleResolutionChange.bind(this);
    this._handleTransformationChange = this._handleTransformationChange.bind(this);

    _._init.call(this);
};

Class.defaults = {
};

// ======================= CONSTRUCTOR & DESTRUCTOR ======================== //

_._nullify = function() {
};

_._init = function() {
    _._nullify.call(this);

    this._binds.resolution.addEventListener('change', this._handleResolutionChange);
    this._binds.scale.addEventListener('input', this._handleTransformationChange);
    this._binds.translation.addEventListener('input', this._handleTransformationChange);
};

_.destroy = function() {
    _._nullify.call(this);
    _.sup.destroy.call(this);
};

// =========================== INSTANCE METHODS ============================ //

_._handleResolutionChange = function() {
    this.trigger('resolution', {
        resolution: this._binds.resolution.getValue()
    });
};

_._handleTransformationChange = function() {
    this.trigger('transformation', {
        scale       : this._binds.scale.getValue(),
        translation : this._binds.translation.getValue()
    });
};

// ============================ STATIC METHODS ============================= //

})(this);
