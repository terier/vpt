var DoubleBuffer = (function() {
'use strict';

function DoubleBuffer(gl, options) {
    this._gl = gl;
    this._readTarget = WebGLUtils.createSimpleRenderTarget(gl, options);
    this._writeTarget = WebGLUtils.createSimpleRenderTarget(gl, options);
}

var _ = DoubleBuffer.prototype;

_.destroy = function() {
    var gl = this._gl;
    gl.deleteTexture(this._readTarget.texture);
    gl.deleteFramebuffer(this._readTarget.framebuffer);
    gl.deleteTexture(this._writeTarget.texture);
    gl.deleteFramebuffer(this._writeTarget.framebuffer);
};

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

return DoubleBuffer;

})();
