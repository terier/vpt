import { AbstractToneMapper } from './AbstractToneMapper.js';

import { buildPrograms } from '../WebGL.js';
import { SHADERS, MIXINS } from '../shaders.js';

export class ReinhardToneMapper extends AbstractToneMapper {

constructor(gl) {
    super(gl);

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

    this._program = buildPrograms(gl, {
        ReinhardToneMapper: SHADERS.tonemappers.ReinhardToneMapper
    }, MIXINS).ReinhardToneMapper;
}

destroy() {
    const gl = this._gl;
    gl.deleteProgram(this._program.program);

    super.destroy();
}

render(renderBuffer) {
    const gl = this._gl;

    const { program, uniforms } = this._program;
    gl.useProgram(program);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, renderBuffer.getAttachments().color[0]);

    gl.uniform1i(uniforms.uTexture, 0);
    gl.uniform1f(uniforms.uExposure, this.exposure);
    gl.uniform1f(uniforms.uGamma, this.gamma);

    gl.drawArrays(gl.TRIANGLES, 0, 3);
}

}
