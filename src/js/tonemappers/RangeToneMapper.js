// #package js/main

// #include ../WebGL.js
// #include AbstractToneMapper.js

class RangeToneMapper extends AbstractToneMapper {

constructor(gl, texture, options) {
    super(gl, texture, options);

    Object.assign(this, {
        _min : 0,
        _max : 1
    }, options);

    this._program = WebGL.buildPrograms(this._gl, {
        RangeToneMapper : SHADERS.RangeToneMapper
    }, MIXINS).RangeToneMapper;
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
    gl.uniform1f(program.uniforms.uMin, this._min);
    gl.uniform1f(program.uniforms.uMax, this._max);

    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
}

}
