//@@../../utils
//@@../AbstractDialog.js

(function(global) {
'use strict';

var Class = global.ArtisticToneMapperDialog = ArtisticToneMapperDialog;
CommonUtils.inherit(Class, AbstractDialog);
var _ = Class.prototype;

// ========================== CLASS DECLARATION ============================ //

function ArtisticToneMapperDialog(toneMapper, options) {
    _.sup.constructor.call(this, UISPECS.ArtisticToneMapperDialog, options);
    CommonUtils.extend(this, Class.defaults, options);

    this._toneMapper = toneMapper;

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

    this._binds.low.addEventListener('input', this._handleChange);
    this._binds.high.addEventListener('input', this._handleChange);
    this._binds.saturation.addEventListener('input', this._handleChange);
    this._binds.midtones.addEventListener('change', this._handleChange);
};

_.destroy = function() {
    this._toneMapper = null;

    _._nullify.call(this);
    _.sup.destroy.call(this);
};

// =========================== INSTANCE METHODS ============================ //

_._handleChange = function() {
    var low = this._binds.low.getValue();
    var high = this._binds.high.getValue();
    var midtones = this._binds.midtones.getValue();
    var saturation = this._binds.saturation.getValue();

    this._toneMapper.low = low;
    this._toneMapper.mid = low + (1 - midtones) * (high - low);
    this._toneMapper.high = high;
    this._toneMapper.saturation = saturation;
};

// ============================ STATIC METHODS ============================= //

})(this);
