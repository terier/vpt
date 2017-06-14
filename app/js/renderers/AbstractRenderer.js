var AbstractRenderer = (function() {
'use strict';

function AbstractRenderer(gl, volumeTexture) {
    this._gl = gl;
    this._volumeTexture = volumeTexture;

    this._bufferSize = 256;
    var framebufferOptions = {
        width:          this._bufferSize,
        height:         this._bufferSize,
        min:            gl.LINEAR,
        mag:            gl.LINEAR,
        format:         gl.RED,
        type:           gl.FLOAT,
        internalFormat: gl.R16F
    };
    this._frameBuffer = WebGLUtils.createSimpleRenderTarget(gl, framebufferOptions);
    this._accBufferRead = WebGLUtils.createSimpleRenderTarget(gl, framebufferOptions);
    this._accBufferWrite = WebGLUtils.createSimpleRenderTarget(gl, framebufferOptions);

    this._mvpInverseMatrix = new Matrix();

    this._clipQuad = WebGLUtils.createClipQuad(gl);
}

var _ = AbstractRenderer.prototype;

_.destroy = function() {
    var gl = this._gl;
    gl.deleteTexture(this._frameBuffer.texture);
    gl.deleteFramebuffer(this._frameBuffer.framebuffer);
    gl.deleteTexture(this._accBufferRead.texture);
    gl.deleteFramebuffer(this._accBufferRead.framebuffer);
    gl.deleteTexture(this._accBufferWrite.texture);
    gl.deleteFramebuffer(this._accBufferWrite.framebuffer);
    gl.deleteBuffer(this._clipQuad);
};

_.reset = function() {
    throw noimpl;
};

_.generateFrame = function() {
    throw noimpl;
};

_.integrateFrame = function() {
    throw noimpl;
};

_.render = function() {
    throw noimpl;
};

_.setMvpInverseMatrix = function(matrix) {
    this._mvpInverseMatrix.copy(matrix);
};

return AbstractRenderer;

})();
