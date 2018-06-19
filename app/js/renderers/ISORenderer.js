//@@../utils/Utils.js
//@@../WebGLUtils.js
//@@AbstractRenderer.js

(function(global) {
'use strict';

var Class = global.ISORenderer = ISORenderer;
CommonUtils.inherit(Class, AbstractRenderer);
var _ = Class.prototype;

// ========================== CLASS DECLARATION ============================ //

function ISORenderer(gl, volumeTexture, environmentTexture, options) {
    _.sup.constructor.call(this, gl, volumeTexture, environmentTexture, options);
    CommonUtils.extend(this, Class.defaults, options);

    _._init.call(this);
};

Class.defaults = {
    _stepSize : 0.05,
    _isovalue : 0.4,
    _light    : [0.5, 0.5, 0.5],
    _diffuse  : [0.7, 0.8, 0.9]
};

// ======================= CONSTRUCTOR & DESTRUCTOR ======================== //

_._nullify = function() {
    this._programs = null;
};

_._init = function() {
    _._nullify.call(this);

    this._programs = WebGLUtils.compileShaders(this._gl, {
        generate  : SHADERS.ISOGenerate,
        integrate : SHADERS.ISOIntegrate,
        render    : SHADERS.ISORender,
        reset     : SHADERS.ISOReset
    }, MIXINS);
};

_.destroy = function() {
    _.sup.destroy.call(this);

    var gl = this._gl;
    this._programs.forEach(function(program) {
        gl.deleteProgram(program.program);
    });

    _._nullify.call(this);
};

// =========================== INSTANCE METHODS ============================ //

_._resetFrame = function() {
    var gl = this._gl;

    var program = this._programs.reset;
    gl.useProgram(program.program);

    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
};

_._generateFrame = function() {
    var gl = this._gl;

    var program = this._programs.generate;
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

    var program = this._programs.integrate;
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

    var program = this._programs.render;
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
