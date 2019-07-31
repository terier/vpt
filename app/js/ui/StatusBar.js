//@@../utils
//@@UIObject.js

(function(global) {
'use strict';

var Class = global.StatusBar = StatusBar;
CommonUtils.inherit(Class, UIObject);
var _ = Class.prototype;

// ========================== CLASS DECLARATION ============================ //

function StatusBar(options) {
    _.sup.constructor.call(this, TEMPLATES['StatusBar.html'], options);
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
};

_.destroy = function() {
    _._nullify.call(this);
    _.sup.destroy.call(this);
};

// =========================== INSTANCE METHODS ============================ //

_._log = function(text, level) {
    var newLog = DOMUtils.instantiate(TEMPLATES['StatusBarLog.html']);
    var binds = DOMUtils.bind(newLog);
    binds.timestamp.textContent = new Date().toISOString();
    binds.content.textContent = text;
    if (level) {
        newLog.classList.add(level);
    }
    this._element.appendChild(newLog);
    this._element.scrollTop = this._element.scrollHeight;
};

_.log = function(text) {
    this._log(text);
};

_.info = function(text) {
    this._log(text, 'info');
};

_.warning = function(text) {
    this._log(text, 'warning');
};

_.error = function(text) {
    this._log(text, 'error');
};

// ============================ STATIC METHODS ============================= //

})(this);
