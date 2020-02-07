// #package js/main

// #include ../WebGL.js
// #include AbstractToneMapper.js

class ReinhardToneMapper extends AbstractToneMapper {

constructor(gl, texture, options) {
    super(gl, texture, options);

    Object.assign(this, {
        _exposure : 1
    }, options);

    this._program = WebGL.buildPrograms(this._gl, {
        ReinhardToneMapper : SHADERS.ReinhardToneMapper
    }, MIXINS).ReinhardToneMapper;
}

destroy() {
    const gl = this._gl;
    gl.deleteProgram(this._program.program);

    super.destroy();
}

_renderFrame() {
    const gl = this._gl;

    const program = this._program;
    gl.useProgram(program.program);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this._texture);

    gl.uniform1i(program.uniforms.uTexture, 0);
    gl.uniform1f(program.uniforms.uExposure, this._exposure);

    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
}

}
