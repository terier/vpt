(function(global) {
'use strict';

var Class = global.SingleBuffer = SingleBuffer;
var _ = Class.prototype;

// ========================== CLASS DECLARATION ============================ //

function SingleBuffer(gl, bufferOptions, options) {
    this._opts = $.extend(this._opts || {}, Class.defaults, options);

    // option variables

    // instance variables
    this._gl = gl;
    this._bufferOptions = bufferOptions;
    this._target = null;

    // function binds

    this._init();
};

Class.defaults = {
};

// ======================= CONSTRUCTOR & DESTRUCTOR ======================== //

_._init = function() {
    this._target = WebGLUtils.createSimpleRenderTarget(this._gl, this._bufferOptions);
};

_.destroy = function() {
    var gl = this._gl;
    gl.deleteTexture(this._target.texture);
    gl.deleteFramebuffer(this._target.framebuffer);
};

// =========================== INSTANCE METHODS ============================ //

_.use = function() {
    var gl = this._gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, this._target.framebuffer);
    gl.viewport(0, 0, this._target.width, this._target.height);
};

_.getTexture = function() {
    return this._target.texture;
};

// ============================ STATIC METHODS ============================= //

})(this);
