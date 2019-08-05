//@@../../utils
//@@../AbstractDialog.js

(function(global) {
'use strict';

var Class = global.RangeToneMapperDialog = RangeToneMapperDialog;
CommonUtils.inherit(Class, AbstractDialog);
var _ = Class.prototype;

// ========================== CLASS DECLARATION ============================ //

function RangeToneMapperDialog(toneMapper, options) {
    _.sup.constructor.call(this, UISPECS.RangeToneMapperDialog, options);
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
};

_.destroy = function() {
    this._toneMapper = null;

    _._nullify.call(this);
    _.sup.destroy.call(this);
};

// =========================== INSTANCE METHODS ============================ //

_._handleChange = function() {
    this._toneMapper._min = this._binds.low.getValue();
    this._toneMapper._max = this._binds.high.getValue();
};

// ============================ STATIC METHODS ============================= //

})(this);
