(function(global) {
'use strict';

var Class = global.SingleBuffer = SingleBuffer;
var _ = Class.prototype;

// ========================== CLASS DECLARATION ============================ //

function SingleBuffer(gl, bufferOptions, options) {
    $.extend(this, Class.defaults, options);

    this._gl = gl;
    this._bufferOptions = bufferOptions;

    _._init.call(this);
};

Class.defaults = {
};

// ======================= CONSTRUCTOR & DESTRUCTOR ======================== //

_._nullify = function() {
    this._target = null;
};

_._init = function() {
    _._nullify.call(this);

    this._target = WebGLUtils.createSimpleRenderTarget(this._gl, this._bufferOptions);
};

_.destroy = function() {
    var gl = this._gl;
    gl.deleteTexture(this._target.texture);
    gl.deleteFramebuffer(this._target.framebuffer);

    _._nullify.call(this);
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
