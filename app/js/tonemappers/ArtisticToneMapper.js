//@@../utils/Utils.js
//@@../WebGL.js
//@@AbstractToneMapper.js

(function(global) {
'use strict';

var Class = global.ArtisticToneMapper = ArtisticToneMapper;
CommonUtils.inherit(Class, AbstractToneMapper);
var _ = Class.prototype;

// ========================== CLASS DECLARATION ============================ //

function ArtisticToneMapper(gl, texture, options) {
    _.sup.constructor.call(this, gl, texture, options);
    CommonUtils.extend(this, Class.defaults, options);

    _._init.call(this);
};

Class.defaults = {
    low        : 0,
    mid        : 0.5,
    high       : 1,
    saturation : 1
};

// ======================= CONSTRUCTOR & DESTRUCTOR ======================== //

_._nullify = function() {
    this._program = null;
};

_._init = function() {
    _._nullify.call(this);

    this._program = WebGL.buildPrograms(this._gl, {
        ArtisticToneMapper : SHADERS.ArtisticToneMapper
    }, MIXINS).ArtisticToneMapper;
};

_.destroy = function() {
    var gl = this._gl;
    gl.deleteProgram(this._program.program);

    _._nullify.call(this);
    _.sup.destroy.call(this);
};

// =========================== INSTANCE METHODS ============================ //

_._renderFrame = function() {
    var gl = this._gl;

    var program = this._program;
    gl.useProgram(program.program);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this._texture);

    gl.uniform1i(program.uniforms.uTexture, 0);
    gl.uniform1f(program.uniforms.uLow, this.low);
    gl.uniform1f(program.uniforms.uMid, this.mid);
    gl.uniform1f(program.uniforms.uHigh, this.high);
    gl.uniform1f(program.uniforms.uSaturation, this.saturation);

    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
};

// ============================ STATIC METHODS ============================= //

})(this);
