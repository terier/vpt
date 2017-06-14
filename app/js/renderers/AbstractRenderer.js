var AbstractRenderer = (function() {
'use strict';

function AbstractRenderer() {
    this._gl = null;
    this._clipQuad = null;
    this._volume = null;
    this._canvas = null;
    this._programs = null;
    this._program = null;

    this._frameBuffer = null;
    this._accBufferRead = null;
    this._accBufferWrite = null;
    this._bufferSize = 512;

    this._mvpInverseMatrix = new Matrix();

    this._init();
}

var _ = AbstractRenderer.prototype;

_._init = function() {
    try {
        this._canvas = document.createElement('canvas');
        var gl = this._gl = WebGLUtils.getContext(this._canvas, ['webgl2']);

        // create volume
        this._volume = gl.createTexture();
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_3D, this._volume);
        gl.texImage3D(gl.TEXTURE_3D, 0, gl.R16F,
            1, 1, 1,
            0, gl.RED, gl.FLOAT, new Float32Array([1]));
        gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);
        gl.bindTexture(gl.TEXTURE_3D, null);

        // create framebuffers
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

        // create quad
        this._clipQuad = WebGLUtils.createClipQuad(gl);

        // create shaders
        this._programs = WebGLUtils.compileShaders(gl, SHADERS, MIXINS);
        this._program = this._programs.mip;
    } catch(e) {
        gl = null;
        console.error(e);
    }
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
    var gl = this._gl;
    if (!gl) {
        return;
    }

    // use shader
    var program = this._program;
    gl.useProgram(program.program);

    // set volume
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_3D, this._volume);

    // set vbo
    gl.bindBuffer(gl.ARRAY_BUFFER, this._clipQuad);
    var aPosition = program.attributes.aPosition;
    gl.enableVertexAttribArray(aPosition);
    gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);

    // set uniforms
    gl.uniform1i(program.uniforms.uVolume, 0);
    gl.uniform1f(program.uniforms.uSamplingStep, 0.01);
    gl.uniform1f(program.uniforms.uIsovalue, 0.2);
    gl.uniformMatrix4fv(program.uniforms.uMvpInverseMatrix, false, this._mvpInverseMatrix.m);

    // render
    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);

    // clean up
    gl.disableVertexAttribArray(aPosition);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindTexture(gl.TEXTURE_3D, null);
};

_.resize = function(width, height) {
    this._canvas.width = width;
    this._canvas.height = height;
    if (this._gl) {
        this._gl.viewport(0, 0, width, height);
    }
};

_.setVolume = function(volume) {
    var gl = this._gl;
    if (!gl) {
        return;
    }

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_3D, this._volume);
    gl.texImage3D(gl.TEXTURE_3D, 0, gl.R16F,
        volume.width, volume.height, volume.depth,
        0, gl.RED, gl.FLOAT, volume.data);
    gl.bindTexture(gl.TEXTURE_3D, null);
};

_.setMvpInverseMatrix = function(matrix) {
    this._mvpInverseMatrix.copy(matrix);
};

_.getCanvas = function() {
    return this._canvas;
};

return AbstractRenderer;

})();
