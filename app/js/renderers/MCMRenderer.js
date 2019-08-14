//@@../utils
//@@../WebGL.js
//@@AbstractRenderer.js

(function(global) {
    'use strict';

    var Class = global.MCMRenderer = MCMRenderer;
    CommonUtils.inherit(Class, AbstractRenderer);
    var _ = Class.prototype;

// ========================== CLASS DECLARATION ============================ //

function MCMRenderer(gl, volume, environmentTexture, options) {
    _.sup.constructor.call(this, gl, volume, environmentTexture, options);
    CommonUtils.extend(this, Class.defaults, options);

    _._init.call(this);
};

Class.defaults = {
    absorptionCoefficient : 1,
    scatteringCoefficient : 1,
    scatteringBias        : 0,
    majorant              : 2,
    maxBounces            : 8,
    steps                 : 1
};

// ======================= CONSTRUCTOR & DESTRUCTOR ======================== //

_._nullify = function() {
    this._programs = null;
};

_._init = function() {
    _._nullify.call(this);

    var gl = this._gl;

    this._programs = WebGL.buildPrograms(gl, {
        generate  : SHADERS.MCMGenerate,
        integrate : SHADERS.MCMIntegrate,
        render    : SHADERS.MCMRender,
        reset     : SHADERS.MCMReset
    }, MIXINS);
};

_.destroy = function() {
    var gl = this._gl;
    Object.keys(this._programs).forEach(function(programName) {
        gl.deleteProgram(this._programs[programName].program);
    }.bind(this));

    _._nullify.call(this);
    _.sup.destroy.call(this);
};

// =========================== INSTANCE METHODS ============================ //

_._resetFrame = function() {
    var gl = this._gl;

    var program = this._programs.reset;
    gl.useProgram(program.program);

    gl.uniformMatrix4fv(program.uniforms.uMvpInverseMatrix, false, this._mvpInverseMatrix.m);
    gl.uniform2f(program.uniforms.uInverseResolution, 1 / this._bufferSize, 1 / this._bufferSize);
    gl.uniform1f(program.uniforms.uRandSeed, Math.random());
    gl.uniform1f(program.uniforms.uBlur, 0);

    gl.drawBuffers([
        gl.COLOR_ATTACHMENT0,
        gl.COLOR_ATTACHMENT1,
        gl.COLOR_ATTACHMENT2,
        gl.COLOR_ATTACHMENT3
    ]);

    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
};

_._generateFrame = function() {
};

_._integrateFrame = function() {
    var gl = this._gl;

    var program = this._programs.integrate;
    gl.useProgram(program.program);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this._accumulationBuffer.getAttachments().color[0]);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this._accumulationBuffer.getAttachments().color[1]);
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, this._accumulationBuffer.getAttachments().color[2]);
    gl.activeTexture(gl.TEXTURE3);
    gl.bindTexture(gl.TEXTURE_2D, this._accumulationBuffer.getAttachments().color[3]);

    gl.activeTexture(gl.TEXTURE4);
    gl.bindTexture(gl.TEXTURE_3D, this._volume.getTexture());
    gl.activeTexture(gl.TEXTURE5);
    gl.bindTexture(gl.TEXTURE_2D, this._environmentTexture);
    gl.activeTexture(gl.TEXTURE6);
    gl.bindTexture(gl.TEXTURE_2D, this._transferFunction);

    gl.uniform1i(program.uniforms.uPosition, 0);
    gl.uniform1i(program.uniforms.uDirection, 1);
    gl.uniform1i(program.uniforms.uTransmittance, 2);
    gl.uniform1i(program.uniforms.uRadiance, 3);

    gl.uniform1i(program.uniforms.uVolume, 4);
    gl.uniform1i(program.uniforms.uEnvironment, 5);
    gl.uniform1i(program.uniforms.uTransferFunction, 6);

    gl.uniformMatrix4fv(program.uniforms.uMvpInverseMatrix, false, this._mvpInverseMatrix.m);
    gl.uniform2f(program.uniforms.uInverseResolution, 1 / this._bufferSize, 1 / this._bufferSize);
    gl.uniform1f(program.uniforms.uRandSeed, Math.random());
    gl.uniform1f(program.uniforms.uBlur, 0);

    gl.uniform1f(program.uniforms.uAbsorptionCoefficient, this.absorptionCoefficient);
    gl.uniform1f(program.uniforms.uScatteringCoefficient, this.scatteringCoefficient);
    gl.uniform1f(program.uniforms.uScatteringBias, this.scatteringBias);
    gl.uniform1f(program.uniforms.uMajorant, this.majorant);
    gl.uniform1ui(program.uniforms.uMaxBounces, this.maxBounces);
    gl.uniform1ui(program.uniforms.uSteps, this.steps);

    gl.drawBuffers([
        gl.COLOR_ATTACHMENT0,
        gl.COLOR_ATTACHMENT1,
        gl.COLOR_ATTACHMENT2,
        gl.COLOR_ATTACHMENT3
    ]);

    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
};

_._renderFrame = function() {
    var gl = this._gl;

    var program = this._programs.render;
    gl.useProgram(program.program);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this._accumulationBuffer.getAttachments().color[3]);

    gl.uniform1i(program.uniforms.uColor, 0);

    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
};

_._getFrameBufferSpec = function() {
    var gl = this._gl;
    return [{
        width          : this._bufferSize,
        height         : this._bufferSize,
        min            : gl.NEAREST,
        mag            : gl.NEAREST,
        format         : gl.RGBA,
        internalFormat : gl.RGBA32F,
        type           : gl.FLOAT
    }];
};

_._getAccumulationBufferSpec = function() {
    var gl = this._gl;

    var positionBufferSpec = {
        width          : this._bufferSize,
        height         : this._bufferSize,
        min            : gl.NEAREST,
        mag            : gl.NEAREST,
        format         : gl.RGBA,
        internalFormat : gl.RGBA32F,
        type           : gl.FLOAT
    };

    var directionBufferSpec = {
        width          : this._bufferSize,
        height         : this._bufferSize,
        min            : gl.NEAREST,
        mag            : gl.NEAREST,
        format         : gl.RGBA,
        internalFormat : gl.RGBA32F,
        type           : gl.FLOAT
    };

    var transmittanceBufferSpec = {
        width          : this._bufferSize,
        height         : this._bufferSize,
        min            : gl.NEAREST,
        mag            : gl.NEAREST,
        format         : gl.RGBA,
        internalFormat : gl.RGBA32F,
        type           : gl.FLOAT
    };

    var radianceBufferSpec = {
        width          : this._bufferSize,
        height         : this._bufferSize,
        min            : gl.NEAREST,
        mag            : gl.NEAREST,
        format         : gl.RGBA,
        internalFormat : gl.RGBA32F,
        type           : gl.FLOAT
    };

    return [
        positionBufferSpec,
        directionBufferSpec,
        transmittanceBufferSpec,
        radianceBufferSpec
    ];
};

// ============================ STATIC METHODS ============================= //

})(this);
