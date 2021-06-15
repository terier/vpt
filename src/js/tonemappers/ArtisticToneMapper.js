// #part /js/tonemappers/ArtisticToneMapper

// #link ../WebGL
// #link AbstractToneMapper

class ArtisticToneMapper extends AbstractToneMapper {

constructor(gl, texture, options) {
    super(gl, texture, options);

    Object.assign(this, {
        low        : 0,
        mid        : 0.5,
        high       : 1,
        saturation : 1
    }, options);

    this._program = WebGL.buildPrograms(this._gl, {
        ArtisticToneMapper : SHADERS.ArtisticToneMapper
    }, MIXINS).ArtisticToneMapper;
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
    gl.uniform1f(uniforms.uLow, this.low);
    gl.uniform1f(uniforms.uMid, this.mid);
    gl.uniform1f(uniforms.uHigh, this.high);
    gl.uniform1f(uniforms.uSaturation, this.saturation);

    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
}

}
