(function(global) {
'use strict';

var Class = global.EAMRenderer = EAMRenderer;
Util.inherit(Class, AbstractRenderer);
var _ = Class.prototype;

// ========================== CLASS DECLARATION ============================ //

function EAMRenderer(gl, volumeTexture, options) {
    _.sup.constructor.call(this, gl, volumeTexture, options);
    this._opts = $.extend(this._opts || {}, Class.defaults, options);

    // option variables
    this._stepSize = this._opts.stepSize;

    // instance variables
    this._programs = null;

    // function binds

    _._init.call(this);
};

Class.defaults = {
    stepSize: 0.05
};

// ======================= CONSTRUCTOR & DESTRUCTOR ======================== //

_._init = function() {
    this._programs = WebGLUtils.compileShaders(this._gl, {
        EAMGenerate:  SHADERS.EAMGenerate,
        EAMIntegrate: SHADERS.EAMIntegrate,
        EAMRender:    SHADERS.EAMRender,
        EAMReset:     SHADERS.EAMReset
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

    var program = this._programs.EAMReset;
    gl.useProgram(program.program);

    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
};

_._generateFrame = function() {
    var gl = this._gl;

    var program = this._programs.EAMGenerate;
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

    var program = this._programs.EAMIntegrate;
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

    var program = this._programs.EAMRender;
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
        min:            gl.NEAREST,
        mag:            gl.NEAREST,
        format:         gl.RED,
        internalFormat: gl.R8,
        type:           gl.UNSIGNED_BYTE
    };
};

_._getAccumulationBufferOptions = function() {
    var gl = this._gl;
    return {
        width:          this._bufferSize,
        height:         this._bufferSize,
        min:            gl.NEAREST,
        mag:            gl.NEAREST,
        format:         gl.RED,
        internalFormat: gl.R8,
        type:           gl.UNSIGNED_BYTE
    };
};

// ============================ STATIC METHODS ============================= //

})(this);
