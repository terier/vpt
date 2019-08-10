//@@../utils
//@@../WebGL.js

(function(global) {
'use strict';

// MCC: Monte Carlo Compute renderer
var Class = global.MCCRenderer = MCCRenderer;
var _ = Class.prototype;

// ========================== CLASS DECLARATION ============================ //

function MCCRenderer(gl, volume, environmentTexture, options) {
    CommonUtils.extend(this, Class.defaults, options);

    this._gl = gl;
    this._volume = volume;
    this._envmap = environmentTexture;

    _._init.call(this);
};

Class.defaults = {
    absorptionCoefficient : 1,
    scatteringCoefficient : 1,
    scatteringBias        : 0,
    majorant              : 2,
    maxBounces            : 8,
    steps                 : 1,
    _resolution           : 512,
    _workgroup            : 8
};

// ======================= CONSTRUCTOR & DESTRUCTOR ======================== //

_._nullify = function() {
    this._programs = null;
    this._transferFunction = null;
    this._renderBuffer = null;
};

_._init = function() {
    _._nullify.call(this);

    var gl = this._gl;

    this._programs = WebGL.buildPrograms(gl, {
        render : SHADERS.MCCRender,
        reset  : SHADERS.MCCReset
    }, MIXINS);

    this._transferFunction = WebGL.createTexture(gl, {
        width  : 2,
        height : 1,
        data   : new Uint8Array([255, 0, 0, 0, 255, 0, 0, 255]),
        wrapS  : gl.CLAMP_TO_EDGE,
        wrapT  : gl.CLAMP_TO_EDGE,
        min    : gl.LINEAR,
        mag    : gl.LINEAR
    });

    this._renderBuffer = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this._renderBuffer);
    gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA32F, this._resolution, this._resolution);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    this._mvpInverseMatrix = new Matrix();

    // struct Photon {     //
    //     vec3 position;  // 4 * 4B
    //     vec3 direction; // 4 * 4B
    //     vec3 radiance;  // 4 * 4B
    //     vec3 color;     // 4 * 4B
    //     uint bounces;   // 4B
    //     uint samples;   // 4B
    //          padding    // ??
    // };                  //
    var bufferSize = 20 * 4 * this._resolution * this._resolution;
    this._photonBuffer = gl.createBuffer();
    gl.bindBuffer(gl.SHADER_STORAGE_BUFFER, this._photonBuffer);
    gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 0, this._photonBuffer);
    gl.bufferData(gl.SHADER_STORAGE_BUFFER, bufferSize, gl.STATIC_DRAW);
};

_.destroy = function() {
    var gl = this._gl;
    Object.keys(this._programs).forEach(function(programName) {
        gl.deleteProgram(this._programs[programName].program);
    }.bind(this));

    this._gl = null;
    this._volume = null;
    this._envmap = null;

    _._nullify.call(this);
};

// =========================== INSTANCE METHODS ============================ //

_.getTexture = function() {
    return this._renderBuffer;
};

_.setVolume = function(volume) {
    this._volume = volume;
    this.reset();
};

_.setTransferFunction = function(transferFunction) {
    var gl = this._gl;
    gl.bindTexture(gl.TEXTURE_2D, this._transferFunction);
    gl.texImage2D(gl.TEXTURE_2D, 0,
        gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, transferFunction);
    gl.bindTexture(gl.TEXTURE_2D, null);
};

_.setMvpInverseMatrix = function(matrix) {
    this._mvpInverseMatrix.copy(matrix);
};

_.setResolution = function(resolution) {
    var gl = this._gl;

    this._resolution = resolution;

    gl.deleteTexture(this._renderBuffer);
    this._renderBuffer = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this._renderBuffer);
    gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA32F, this._resolution, this._resolution);
};

_.reset = function() {
    var gl = this._gl;

    var program = this._programs.reset;
    gl.useProgram(program.program);

    gl.uniformMatrix4fv(program.uniforms.uMvpInverseMatrix, false, this._mvpInverseMatrix.m);
    gl.uniform2f(program.uniforms.uInverseResolution, 1 / this._resolution, 1 / this._resolution);
    gl.uniform1f(program.uniforms.uRandSeed, Math.random());
    gl.uniform1f(program.uniforms.uBlur, 0);

    gl.bindBuffer(gl.SHADER_STORAGE_BUFFER, this._photonBuffer);
    gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 0, this._photonBuffer);

    gl.bindImageTexture(0, this._renderBuffer, 0, false, 0, gl.WRITE_ONLY, gl.RGBA32F);

    var groups = this._resolution / this._workgroup;
    gl.dispatchCompute(groups, groups, 1);
};

_.render = function() {
    var gl = this._gl;

    var program = this._programs.render;
    gl.useProgram(program.program);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_3D, this._volume.getTexture());
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this._envmap);
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, this._transferFunction);

    gl.uniform1i(program.uniforms.uVolume, 0);
    gl.uniform1i(program.uniforms.uEnvironment, 1);
    gl.uniform1i(program.uniforms.uTransferFunction, 2);

    gl.uniformMatrix4fv(program.uniforms.uMvpInverseMatrix, false, this._mvpInverseMatrix.m);
    gl.uniform2f(program.uniforms.uInverseResolution, 1 / this._resolution, 1 / this._resolution);
    gl.uniform1f(program.uniforms.uRandSeed, Math.random());
    gl.uniform1f(program.uniforms.uBlur, 0);

    gl.uniform1f(program.uniforms.uAbsorptionCoefficient, this.absorptionCoefficient);
    gl.uniform1f(program.uniforms.uScatteringCoefficient, this.scatteringCoefficient);
    gl.uniform1f(program.uniforms.uScatteringBias, this.scatteringBias);
    gl.uniform1f(program.uniforms.uMajorant, this.majorant);
    gl.uniform1ui(program.uniforms.uMaxBounces, this.maxBounces);
    gl.uniform1ui(program.uniforms.uSteps, this.steps);

    gl.bindBuffer(gl.SHADER_STORAGE_BUFFER, this._photonBuffer);
    gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, 0, this._photonBuffer);

    gl.bindImageTexture(0, this._renderBuffer, 0, false, 0, gl.WRITE_ONLY, gl.RGBA32F);

    var groups = this._resolution / this._workgroup;
    gl.dispatchCompute(groups, groups, 1);
};

// ============================ STATIC METHODS ============================= //

})(this);
