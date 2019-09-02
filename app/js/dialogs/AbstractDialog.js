//@@../utils
//@@../ui
//@@../EventEmitter.js

(function(global) {
'use strict';

var Class = global.AbstractDialog = AbstractDialog;
var _ = Class.prototype;
CommonUtils.extend(_, EventEmitter);

// ========================== CLASS DECLARATION ============================ //

function AbstractDialog(spec, options) {
    CommonUtils.extend(this, Class.defaults, options);

    this._spec = spec;

    _._init.call(this);
};

Class.defaults = {
    visible: true
};

// ======================= CONSTRUCTOR & DESTRUCTOR ======================== //

_._nullify = function() {
    this._binds = null;
    this._object = null;
};

_._init = function() {
    _._nullify.call(this);

    var creation = UI.create(this._spec);
    this._object = creation.object;
    this._binds = creation.binds;
};

_.destroy = function() {
    this._object.destroy();

    _._nullify.call(this);
};

// =========================== INSTANCE METHODS ============================ //

_.isVisible = function() {
    return this._object.isVisible();
};

_.setVisible = function(visible) {
    this._object.setVisible(visible);
};

_.show = function() {
    this._object.show();
};

_.hide = function() {
    this._object.hide();
};

_.appendTo = function(object) {
    object.add(this._object);
};

_.detach = function() {
    this._object.detach();
};

// ============================ STATIC METHODS ============================= //

})(this);
