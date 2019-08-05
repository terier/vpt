//@@../utils
//@@AbstractDialog.js

(function(global) {
'use strict';

var Class = global.MainDialog = MainDialog;
CommonUtils.inherit(Class, AbstractDialog);
var _ = Class.prototype;

// ========================== CLASS DECLARATION ============================ //

function MainDialog(options) {
    _.sup.constructor.call(this, UISPECS.MainDialog, options);
    CommonUtils.extend(this, Class.defaults, options);

    this._handleRendererChange = this._handleRendererChange.bind(this);
    this._handleToneMapperChange = this._handleToneMapperChange.bind(this);

    _._init.call(this);
};

Class.defaults = {
};

// ======================= CONSTRUCTOR & DESTRUCTOR ======================== //

_._nullify = function() {
};

_._init = function() {
    _._nullify.call(this);

    this._binds.sidebar.appendTo(document.body);
    this._binds.rendererSelect.addEventListener('change', this._handleRendererChange);
    this._binds.toneMapperSelect.addEventListener('change', this._handleToneMapperChange);
};

_.destroy = function() {
    _._nullify.call(this);
    _.sup.destroy.call(this);
};

// =========================== INSTANCE METHODS ============================ //

_.getVolumeLoadContainer = function() {
    return this._binds.volumeLoadContainer;
};

_.getEnvmapLoadContainer = function() {
    return this._binds.envmapLoadContainer;
};

_.getRendererSettingsContainer = function() {
    return this._binds.rendererSettingsContainer;
};

_.getToneMapperSettingsContainer = function() {
    return this._binds.toneMapperSettingsContainer;
};

_.getRenderingContextSettingsContainer = function() {
    return this._binds.renderingContextSettingsContainer;
};

_._handleRendererChange = function() {
    var renderer = this._binds.rendererSelect.getValue();
    this.trigger('rendererchange', renderer);
};

_._handleToneMapperChange = function() {
    var toneMapper = this._binds.toneMapperSelect.getValue();
    this.trigger('tonemapperchange', toneMapper);
};

// ============================ STATIC METHODS ============================= //

})(this);
