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

    var about = DOMUtils.instantiate(TEMPLATES.AboutText);
    this._binds.about._element.appendChild(about);
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

_.getSelectedRenderer = function() {
    return this._binds.rendererSelect.getValue();
};

_.getSelectedToneMapper = function() {
    return this._binds.toneMapperSelect.getValue();
};

_._handleRendererChange = function() {
    var renderer = this._binds.rendererSelect.getValue();
    this.trigger('rendererchange', renderer);
};

_._handleToneMapperChange = function() {
    var toneMapper = this._binds.toneMapperSelect.getValue();
    this.trigger('tonemapperchange', toneMapper);
};

_.disableMCC = function() {
    this._binds.rendererSelect.removeOption('mcc');
};

_.selectRenderer = function(renderer) {
    this._binds.rendererSelect.setValue(renderer);
    this._handleRendererChange();
};

// ============================ STATIC METHODS ============================= //

})(this);
