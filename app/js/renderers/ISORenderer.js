(function(global) {
'use strict';

var Class = global.ISORenderer = ISORenderer;
Util.inherit(Class, AbstractRenderer);
var _ = Class.prototype;

// ========================== CLASS DECLARATION ============================ //

function ISORenderer(gl, volumeTexture, options) {
    _.sup.constructor.call(this, gl, volumeTexture, options);
    this._opts = $.extend(this._opts || {}, Class.defaults, options);

    // option variables
    this._stepSize = this._opts.stepSize;
    this._isovalue = this._opts.isovalue;
    this._light = this._opts.light;
    this._diffuse = this._opts.diffuse;

    // instance variables
    this._programs = null;

    // function binds

    _._init.call(this);
};

Class.defaults = {
    stepSize: 0.05,
    isovalue: 0.4,
    light: [0.5, 0.5, 0.5],
    diffuse: [0.7, 0.8, 0.9]
};

// ======================= CONSTRUCTOR & DESTRUCTOR ======================== //

_._init = function() {
    this._programs = WebGLUtils.compileShaders(this._gl, {
        ISOGenerate  : SHADERS.ISOGenerate,
        ISOIntegrate : SHADERS.ISOIntegrate,
        ISORender    : SHADERS.ISORender,
        ISOReset     : SHADERS.ISOReset
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

    var program = this._programs.ISOReset;
    gl.useProgram(program.program);

    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
};

_._generateFrame = function() {
    var gl = this._gl;

    var program = this._programs.ISOGenerate;
    gl.useProgram(program.program);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_3D, this._volumeTexture);

    gl.uniform1i(program.uniforms.uVolume, 0);
    gl.uniform1f(program.uniforms.uStepSize, this._stepSize);
    gl.uniform1f(program.uniforms.uOffset, Math.random());
    gl.uniform1f(program.uniforms.uIsovalue, this._isovalue);
    gl.uniformMatrix4fv(program.uniforms.uMvpInverseMatrix, false, this._mvpInverseMatrix.m);

    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
};

_._integrateFrame = function() {
    var gl = this._gl;

    var program = this._programs.ISOIntegrate;
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

    var program = this._programs.ISORender;
    gl.useProgram(program.program);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this._accumulationBuffer.getTexture());

    gl.uniform1i(program.uniforms.uAccumulator, 0);
    gl.uniform3fv(program.uniforms.uLight, this._light);
    gl.uniform3fv(program.uniforms.uDiffuse, this._diffuse);

    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
};

_._getFrameBufferOptions = function() {
    var gl = this._gl;
    return {
        width          : this._bufferSize,
        height         : this._bufferSize,
        min            : gl.NEAREST,
        mag            : gl.NEAREST,
        format         : gl.RGBA,
        internalFormat : gl.RGBA,
        type           : gl.UNSIGNED_BYTE
    };
};

_._getAccumulationBufferOptions = function() {
    var gl = this._gl;
    return {
        width          : this._bufferSize,
        height         : this._bufferSize,
        min            : gl.NEAREST,
        mag            : gl.NEAREST,
        format         : gl.RGBA,
        internalFormat : gl.RGBA,
        type           : gl.UNSIGNED_BYTE
    };
};

// ============================ STATIC METHODS ============================= //

})(this);
