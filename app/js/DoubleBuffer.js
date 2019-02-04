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
    this._readFramebuffer = null;
    this._readTexture = null;
    this._writeFramebuffer = null;
    this._writeTexture = null;
}

_._init = function() {
    _._nullify.call(this);

    var gl = this._gl;
    this._readTexture = WebGL.createTexture(gl, this._bufferOptions);
    this._readFramebuffer = WebGL.createFramebuffer(gl, { color: [ this._readTexture ] });
    this._writeTexture = WebGL.createTexture(gl, this._bufferOptions);
    this._writeFramebuffer = WebGL.createFramebuffer(gl, { color: [ this._writeTexture ] });

    this._width = this._bufferOptions.width;
    this._height = this._bufferOptions.height;
};

_.destroy = function() {
    var gl = this._gl;
    gl.deleteTexture(this._readTexture);
    gl.deleteFramebuffer(this._readFramebuffer);
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

_.swap = function() {
    var tmp = this._readFramebuffer;
    this._readFramebuffer = this._writeFramebuffer;
    this._writeFramebuffer = tmp;

    tmp = this._readTexture;
    this._readTexture = this._writeTexture;
    this._writeTexture = tmp;
};

_.getTexture = function() {
    return this._readTexture;
};

_.getReadTexture = function() {
    return this._readTexture;
};

_.getWriteTexture = function() {
    return this._writeTexture;
};

// ============================ STATIC METHODS ============================= //

})(this);
