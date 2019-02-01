//@@WebGL.js

(function(global) {
'use strict';

var Class = global.DoubleBuffer = DoubleBuffer;
var _ = Class.prototype;

// ========================== CLASS DECLARATION ============================ //

function DoubleBuffer(gl, bufferOptions, options) {
    CommonUtils.extend(this, Class.defaults, options);

    this._gl = gl;
    this._bufferOptions = bufferOptions;

    _._init.call(this);
};

Class.defaults = {
};

// ======================= CONSTRUCTOR & DESTRUCTOR ======================== //

_._nullify = function() {
    this._readBuffer = null;
    this._writeBuffer = null;
}

_._init = function() {
    _._nullify.call(this);

    this._readBuffer = WebGL.createFramebuffer(this._gl, this._bufferOptions);
    this._writeBuffer = WebGL.createFramebuffer(this._gl, this._bufferOptions);
};

_.destroy = function() {
    var gl = this._gl;
    gl.deleteTexture(this._readBuffer.texture);
    gl.deleteFramebuffer(this._readBuffer.framebuffer);
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

_.swap = function() {
    var tmp = this._readBuffer;
    this._readBuffer = this._writeBuffer;
    this._writeBuffer = tmp;
};

_.getTexture = function() {
    return this._readBuffer.texture;
};

_.getReadTexture = function() {
    return this._readBuffer.texture;
};

_.getWriteTexture = function() {
    return this._writeBuffer.texture;
};

// ============================ STATIC METHODS ============================= //

})(this);
