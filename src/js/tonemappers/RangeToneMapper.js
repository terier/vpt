// #part /js/tonemappers/RangeToneMapper

// #link ../WebGL
// #link AbstractToneMapper

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

    const { program, uniforms } = this._program;
    gl.useProgram(program);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this._texture);

    gl.uniform1i(uniforms.uTexture, 0);
    gl.uniform1f(uniforms.uMin, this._min);
    gl.uniform1f(uniforms.uMax, this._max);

    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
}

}
