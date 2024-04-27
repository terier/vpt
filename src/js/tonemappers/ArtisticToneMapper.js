import { AbstractToneMapper } from './AbstractToneMapper.js';

import { buildPrograms } from '../WebGL.js';
import { SHADERS, MIXINS } from '../shaders.js';

export class ArtisticToneMapper extends AbstractToneMapper {

constructor(gl, texture, options = {}) {
    super(gl, texture, options);

    this.registerProperties([
        {
            name: 'low',
            label: 'Low',
            type: 'spinner',
            value: 0,
        },
        {
            name: 'high',
            label: 'High',
            type: 'spinner',
            value: 1,
        },
        {
            name: 'mid',
            label: 'Midtones',
            type: 'slider',
            value: 0.5,
            min: 0.00001,
            max: 0.99999,
        },
        {
            name: 'saturation',
            label: 'Saturation',
            type: 'spinner',
            value: 1,
        },
        {
            name: 'gamma',
            label: 'Gamma',
            type: 'spinner',
            value: 2.2,
            min: 0,
        },
    ]);

    this._program = buildPrograms(gl, {
        ArtisticToneMapper: SHADERS.tonemappers.ArtisticToneMapper
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
    gl.uniform1f(uniforms.uGamma, this.gamma);

    gl.drawArrays(gl.TRIANGLES, 0, 3);
}

}
