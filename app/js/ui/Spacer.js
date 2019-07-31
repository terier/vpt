//@@../utils
//@@UIObject.js

(function(global) {
'use strict';

var Class = global.Spacer = Spacer;
CommonUtils.inherit(Class, UIObject);
var _ = Class.prototype;

// ========================== CLASS DECLARATION ============================ //

function Spacer(options) {
    _.sup.constructor.call(this, TEMPLATES.Spacer, options);
    CommonUtils.extend(this, Class.defaults, options);

    _._init.call(this);
};

Class.defaults = {
    width  : null,
    height : null
};

// ======================= CONSTRUCTOR & DESTRUCTOR ======================== //

_._nullify = function() {
};

_._init = function() {
    _._nullify.call(this);

    if (this.width) {
        this._element.style.width = this.width;
    }
    if (this.height) {
        this._element.style.height = this.height;
    }
};

_.destroy = function() {
    _._nullify.call(this);
    _.sup.destroy.call(this);
};

// =========================== INSTANCE METHODS ============================ //



// ============================ STATIC METHODS ============================= //

})(this);
