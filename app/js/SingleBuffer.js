//@@WebGL.js

(function(global) {
'use strict';

var Class = global.SingleBuffer = SingleBuffer;
var _ = Class.prototype;

// ========================== CLASS DECLARATION ============================ //

function SingleBuffer(gl, bufferOptions, options) {
    CommonUtils.extend(this, Class.defaults, options);

    this._gl = gl;
    this._bufferOptions = bufferOptions;

    _._init.call(this);
};

Class.defaults = {
};

// ======================= CONSTRUCTOR & DESTRUCTOR ======================== //

_._nullify = function() {
    this._writeFramebuffer = null;
    this._writeTexture = null;
};

_._init = function() {
    _._nullify.call(this);

    var gl = this._gl;
    this._writeTexture = WebGL.createTexture(gl, this._bufferOptions);
    this._writeFramebuffer = WebGL.createFramebuffer(gl, { color: [ this._writeTexture ] });

    this._width = this._bufferOptions.width;
    this._height = this._bufferOptions.height;
};

_.destroy = function() {
    var gl = this._gl;
    gl.deleteTexture(this._writeTexture);
    gl.deleteFramebuffer(this._writeFramebuffer);

    _._nullify.call(this);
};

// =========================== INSTANCE METHODS ============================ //

_.use = function() {
    var gl = this._gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, this._writeFramebuffer);
    gl.viewport(0, 0, this._width, this._height);
};

_.getTexture = function() {
    return this._writeTexture;
};

// ============================ STATIC METHODS ============================= //

})(this);
