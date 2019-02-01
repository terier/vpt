//@@../utils/Utils.js
//@@../WebGL.js
//@@AbstractToneMapper.js

(function(global) {
'use strict';

var Class = global.ReinhardToneMapper = ReinhardToneMapper;
CommonUtils.inherit(Class, AbstractToneMapper);
var _ = Class.prototype;

// ========================== CLASS DECLARATION ============================ //

function ReinhardToneMapper(gl, texture, options) {
    _.sup.constructor.call(this, gl, texture, options);
    CommonUtils.extend(this, Class.defaults, options);

    _._init.call(this);
};

Class.defaults = {
    _exposure : 1
};

// ======================= CONSTRUCTOR & DESTRUCTOR ======================== //

_._nullify = function() {
    this._program = null;
};

_._init = function() {
    _._nullify.call(this);

    this._program = WebGL.buildPrograms(this._gl, {
        ReinhardToneMapper : SHADERS.ReinhardToneMapper
    }, MIXINS).ReinhardToneMapper;
};

_.destroy = function() {
    _.sup.destroy.call(this);

    var gl = this._gl;
    gl.deleteProgram(this._program.program);

    _._nullify.call(this);
};

// =========================== INSTANCE METHODS ============================ //

_._renderFrame = function() {
    var gl = this._gl;

    var program = this._program;
    gl.useProgram(program.program);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this._texture);

    gl.uniform1i(program.uniforms.uTexture, 0);
    gl.uniform1f(program.uniforms.uExposure, this._exposure);

    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
};

// ============================ STATIC METHODS ============================= //

})(this);
