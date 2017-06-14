var MIPRenderer = (function() {
'use strict';

Util.inherit(MIPRenderer, AbstractRenderer);
function MIPRenderer(gl, volumeTexture) {
    this.sup.constructor.call(this, gl, volumeTexture);

    this._programs = WebGLUtils.compileShaders(gl, {
        mip: SHADERS.mip
    }, MIXINS);
    this._program = this._programs.mip;
}

var _ = MIPRenderer.prototype;

_.destroy = function() {
    this.sup.destroy.call(this);
    var gl = this._gl;
    gl.deleteProgram(this._program);
};

_.reset = function() {
};

_.generateFrame = function() {
};

_.integrateFrame = function() {
};

_.render = function() {
    var gl = this._gl;

    // use shader
    var program = this._program;
    gl.useProgram(program.program);

    // set volume
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_3D, this._volume);

    // set vbo
    gl.bindBuffer(gl.ARRAY_BUFFER, this._vbo);
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

return MIPRenderer;

})();
