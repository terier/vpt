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
    this._writeBuffer = null;
};

_._init = function() {
    _._nullify.call(this);

    this._writeBuffer = WebGL.createFramebuffer(this._gl, this._bufferOptions);
};

_.destroy = function() {
    var gl = this._gl;
    gl.deleteTexture(this._writeBuffer.texture);
    gl.deleteFramebuffer(this._writeBuffer.framebuffer);

    _._nullify.call(this);
};

// =========================== INSTANCE METHODS ============================ //

_.use = function() {
    var gl = this._gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, this._writeBuffer.framebuffer);
    gl.viewport(0, 0, this._writeBuffer.width, this._writeBuffer.height);
};

_.getTexture = function() {
    return this._writeBuffer.texture;
};

// ============================ STATIC METHODS ============================= //

})(this);
