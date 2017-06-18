var AbstractRenderer = (function() {
'use strict';

function AbstractRenderer(gl, volumeTexture) {
    this._gl = gl;
    this._volumeTexture = volumeTexture;

    this._bufferSize = 512;
    var bufferOptions = {
        width:          this._bufferSize,
        height:         this._bufferSize,
        min:            gl.LINEAR,
        mag:            gl.LINEAR,
        format:         gl.RGBA,
        internalFormat: gl.RGBA,
        type:           gl.UNSIGNED_BYTE
    };
    this._frameBuffer = new SingleBuffer(gl, bufferOptions);
    this._accBuffer = new DoubleBuffer(gl, bufferOptions);

    this._mvpInverseMatrix = new Matrix();

    this._clipQuad = WebGLUtils.createClipQuad(gl);
    this._clipQuadProgram = WebGLUtils.compileShaders(gl, {
        quad: SHADERS.quad
    }).quad;
}

var _ = AbstractRenderer.prototype;

_.destroy = function() {
    var gl = this._gl;
    this._frameBuffer.destroy();
    this._accBuffer.destroy();
    gl.deleteBuffer(this._clipQuad);
    gl.deleteProgram(this._clipQuadProgram);
};

_.render = function() {
    this._frameBuffer.use();
    this._generateFrame();

    this._accBuffer.use();
    this._integrateFrame();

    this._accBuffer.swap();
};

_.reset = function() {
    this._accBuffer.use();
    this._resetFrame();
    this._accBuffer.swap();
};

_.getTexture = function() {
    return this._accBuffer.getTexture();
};

_.setMvpInverseMatrix = function(matrix) {
    this._mvpInverseMatrix.copy(matrix);
};

_._resetFrame = function() {
    throw Util.noimpl;
};

_._generateFrame = function() {
    throw Util.noimpl;
};

_._integrateFrame = function() {
    throw Util.noimpl;
};

return AbstractRenderer;

})();
