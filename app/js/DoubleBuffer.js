(function(global) {
'use strict';

var Class = global.DoubleBuffer = DoubleBuffer;
var _ = Class.prototype;

// ========================== CLASS DECLARATION ============================ //

function DoubleBuffer(gl, bufferOptions, options) {
    this._opts = $.extend(this._opts || {}, Class.defaults, options);

    // option variables

    // instance variables
    this._gl = gl;
    this._bufferOptions = bufferOptions;
    this._readTarget = null;
    this._writeTarget = null;

    // function binds

    _._init.call(this);
};

Class.defaults = {
};

// ======================= CONSTRUCTOR & DESTRUCTOR ======================== //

_._init = function() {
    this._readTarget = WebGLUtils.createSimpleRenderTarget(this._gl, this._bufferOptions);
    this._writeTarget = WebGLUtils.createSimpleRenderTarget(this._gl, this._bufferOptions);
};

_.destroy = function() {
    var gl = this._gl;
    gl.deleteTexture(this._readTarget.texture);
    gl.deleteFramebuffer(this._readTarget.framebuffer);
    gl.deleteTexture(this._writeTarget.texture);
    gl.deleteFramebuffer(this._writeTarget.framebuffer);
};

// =========================== INSTANCE METHODS ============================ //

_.use = function() {
    var gl = this._gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, this._writeTarget.framebuffer);
    gl.viewport(0, 0, this._writeTarget.width, this._writeTarget.height);
};

_.swap = function() {
    var tmp = this._readTarget;
    this._readTarget = this._writeTarget;
    this._writeTarget = tmp;
};

_.getTexture = function() {
    return this._readTarget.texture;
};

_.getReadTexture = function() {
    return this._readTarget.texture;
};

_.getWriteTexture = function() {
    return this._writeTarget.texture;
};

// ============================ STATIC METHODS ============================= //

})(this);
