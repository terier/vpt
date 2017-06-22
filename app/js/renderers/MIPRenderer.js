(function(global) {
'use strict';

var Class = global.MIPRenderer = MIPRenderer;
Util.inherit(Class, AbstractRenderer);
var _ = Class.prototype;

// ========================== CLASS DECLARATION ============================ //

function MIPRenderer(gl, volumeTexture, options) {
    _.sup.constructor.call(this, gl, volumeTexture, options);
    this._opts = $.extend(this._opts || {}, Class.defaults, options);

    // option variables
    this._stepSize = this._opts.stepSize;

    // instance variables
    this._programs = null;

    // function binds

    this._init();
};

Class.defaults = {
    stepSize: 0.05
};

// ======================= CONSTRUCTOR & DESTRUCTOR ======================== //

_._init = function() {
    _.sup._init.call(this);
    this._programs = WebGLUtils.compileShaders(this._gl, {
        MIPGenerate:  SHADERS.MIPGenerate,
        MIPIntegrate: SHADERS.MIPIntegrate,
        MIPRender:    SHADERS.MIPRender,
        MIPReset:     SHADERS.MIPReset
    }, MIXINS);
};

_.destroy = function() {
    _.sup.destroy.call(this);
    var gl = this._gl;
    this._programs.forEach(function(program) {
        gl.deleteProgram(program.program);
    });
};

// =========================== INSTANCE METHODS ============================ //

_._resetFrame = function() {
    var gl = this._gl;

    var program = this._programs.MIPReset;
    gl.useProgram(program.program);

    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
};

_._generateFrame = function() {
    var gl = this._gl;

    var program = this._programs.MIPGenerate;
    gl.useProgram(program.program);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_3D, this._volumeTexture);

    gl.uniform1i(program.uniforms.uVolume, 0);
    gl.uniform1f(program.uniforms.uStepSize, this._stepSize);
    gl.uniform1f(program.uniforms.uOffset, Math.random());
    gl.uniformMatrix4fv(program.uniforms.uMvpInverseMatrix, false, this._mvpInverseMatrix.m);

    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
};

_._integrateFrame = function() {
    var gl = this._gl;

    var program = this._programs.MIPIntegrate;
    gl.useProgram(program.program);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this._accumulationBuffer.getTexture());
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this._frameBuffer.getTexture());

    gl.uniform1i(program.uniforms.uAccumulator, 0);
    gl.uniform1i(program.uniforms.uFrame, 1);

    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
};

_._renderFrame = function() {
    var gl = this._gl;

    var program = this._programs.MIPRender;
    gl.useProgram(program.program);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this._accumulationBuffer.getTexture());

    gl.uniform1i(program.uniforms.uAccumulator, 0);

    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
};

_._getFrameBufferOptions = function() {
    var gl = this._gl;
    return {
        width:          this._bufferSize,
        height:         this._bufferSize,
        min:            gl.LINEAR,
        mag:            gl.LINEAR,
        format:         gl.RGBA,
        internalFormat: gl.RGBA,
        type:           gl.UNSIGNED_BYTE
    };
};

_._getAccumulationBufferOptions = function() {
    var gl = this._gl;
    return {
        width:          this._bufferSize,
        height:         this._bufferSize,
        min:            gl.LINEAR,
        mag:            gl.LINEAR,
        format:         gl.RGBA,
        internalFormat: gl.RGBA,
        type:           gl.UNSIGNED_BYTE
    };
};

// ============================ STATIC METHODS ============================= //

})(this);
