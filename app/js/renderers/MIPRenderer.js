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
        mipGenerate: SHADERS.MIPGenerate,
        mipIntegrate: SHADERS.MIPIntegrate,
        mipReset: SHADERS.MIPReset
    }, MIXINS);
};

_.destroy = function() {
    _.sup.destroy.call(this);
    var gl = this._gl;
    gl.deleteProgram(this._program);
};

// =========================== INSTANCE METHODS ============================ //

_._resetFrame = function() {
    var gl = this._gl;

    // use shader
    var program = this._programs.mipReset;
    gl.useProgram(program.program);

    // set vbo
    gl.bindBuffer(gl.ARRAY_BUFFER, this._clipQuad);
    var aPosition = program.attributes.aPosition;
    gl.enableVertexAttribArray(aPosition);
    gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);

    // render
    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);

    // clean up
    gl.disableVertexAttribArray(aPosition);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
};

_._generateFrame = function() {
    var gl = this._gl;

    // use shader
    var program = this._programs.mipGenerate;
    gl.useProgram(program.program);

    // set volume
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_3D, this._volumeTexture);

    // set vbo
    gl.bindBuffer(gl.ARRAY_BUFFER, this._clipQuad);
    var aPosition = program.attributes.aPosition;
    gl.enableVertexAttribArray(aPosition);
    gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);

    // set uniforms
    gl.uniform1i(program.uniforms.uVolume, 0);
    gl.uniform1f(program.uniforms.uStepSize, this._stepSize);
    gl.uniform1f(program.uniforms.uOffset, Math.random());
    gl.uniformMatrix4fv(program.uniforms.uMvpInverseMatrix, false, this._mvpInverseMatrix.m);

    // render
    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);

    // clean up
    gl.disableVertexAttribArray(aPosition);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindTexture(gl.TEXTURE_3D, null);
};

_._integrateFrame = function() {
    var gl = this._gl;

    // use shader
    var program = this._programs.mipIntegrate;
    gl.useProgram(program.program);

    // set texture
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this._accBuffer.getTexture());
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this._frameBuffer.getTexture());

    // set vbo
    gl.bindBuffer(gl.ARRAY_BUFFER, this._clipQuad);
    var aPosition = program.attributes.aPosition;
    gl.enableVertexAttribArray(aPosition);
    gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);

    // set uniforms
    gl.uniform1i(program.uniforms.uAccumulator, 0);
    gl.uniform1i(program.uniforms.uFrame, 1);

    // render
    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);

    // clean up
    gl.disableVertexAttribArray(aPosition);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindTexture(gl.TEXTURE_2D, null);
};

return MIPRenderer;

})();
