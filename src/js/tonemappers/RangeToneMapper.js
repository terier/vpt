import { WebGL } from '../WebGL.js';
import { AbstractToneMapper } from './AbstractToneMapper.js';

const [
    vertex,
    fragment,
] = await Promise.all([
    './glsl/shaders/tonemappers/RangeToneMapper/vertex',
    './glsl/shaders/tonemappers/RangeToneMapper/fragment',
]
.map(url => fetch(url).then(response => response.text())));

export class RangeToneMapper extends AbstractToneMapper {

constructor(gl, texture, options) {
    super(gl, texture, options);

    this.registerProperties([
        {
            name: 'min',
            label: 'Min',
            type: 'spinner',
            value: 0,
        },
        {
            name: 'max',
            label: 'Max',
            type: 'spinner',
            value: 1,
        },
    ]);

    this._program = WebGL.buildPrograms(this._gl, {
        RangeToneMapper: { vertex, fragment }
    }).RangeToneMapper;
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
    gl.uniform1f(uniforms.uMin, this.min);
    gl.uniform1f(uniforms.uMax, this.max);

    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
}

}
