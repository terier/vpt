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

// ============================ STATIC METHODS ============================= //

})(this);
