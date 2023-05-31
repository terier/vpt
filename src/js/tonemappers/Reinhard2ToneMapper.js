import { WebGL } from '../WebGL.js';
import { AbstractToneMapper } from './AbstractToneMapper.js';

const [ SHADERS, MIXINS ] = await Promise.all([
    'shaders.json',
    'mixins.json',
].map(url => fetch(url).then(response => response.json())));

export class Reinhard2ToneMapper extends AbstractToneMapper {

constructor(gl, texture, options = {}) {
    super(gl, texture, options);

    this.registerProperties([
        {
            name: 'exposure',
            label: 'Exposure',
            type: 'spinner',
            value: 1,
            min: 0,
        },
        {
            name: 'gamma',
            label: 'Gamma',
            type: 'spinner',
            value: 2.2,
            min: 0,
        },
    ]);

    this._program = WebGL.buildPrograms(gl, {
        Reinhard2ToneMapper: SHADERS.tonemappers.Reinhard2ToneMapper
    }, MIXINS).Reinhard2ToneMapper;
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
    gl.uniform1f(uniforms.uExposure, this.exposure);
    gl.uniform1f(uniforms.uGamma, this.gamma);

    gl.drawArrays(gl.TRIANGLES, 0, 3);
}

}
