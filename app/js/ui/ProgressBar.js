//@@../utils
//@@UIObject.js

(function(global) {
'use strict';

var Class = global.ProgressBar = ProgressBar;
CommonUtils.inherit(Class, UIObject);
var _ = Class.prototype;

// ========================== CLASS DECLARATION ============================ //

function ProgressBar(options) {
    _.sup.constructor.call(this, TEMPLATES['ProgressBar.html'], options);
    CommonUtils.extend(this, Class.defaults, options);

    _._init.call(this);
};

Class.defaults = {
    progress: 10
};

// ======================= CONSTRUCTOR & DESTRUCTOR ======================== //

_._nullify = function() {
};

_._init = function() {
    _._nullify.call(this);

    this.setProgress(this.progress);
};

_.destroy = function() {
    _._nullify.call(this);
    _.sup.destroy.call(this);
};

// =========================== INSTANCE METHODS ============================ //

_.setProgress = function(progress) {
    this.progress = Math.round(CommonUtils.clamp(progress, 0, 100));
    this._binds.progress.style.width = this.progress + '%';
    this._binds.label.textContent = this.progress + '%';
};

_.getProgress = function() {
    return this.progress;
};

// ============================ STATIC METHODS ============================= //

})(this);
