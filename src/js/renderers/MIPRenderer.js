import { mat4 } from '../../lib/gl-matrix-module.js';

import { AbstractRenderer } from './AbstractRenderer.js';

import { Volume } from '../Volume.js';

import { buildPrograms } from '../WebGL.js';
import { SHADERS, MIXINS } from '../shaders.js';

export class MIPRenderer extends AbstractRenderer {

constructor(gl) {
    super(gl);

    this.registerProperties([
        {
            name: 'steps',
            label: 'Steps',
            type: 'spinner',
            value: 64,
            min: 1,
        },
        {
            name: 'transferFunction',
            label: 'Transfer function',
            type: 'transfer-function',
            value: new Uint8Array(256),
        },
    ]);

    this.addEventListener('change', e => {
        const { name, value } = e.detail;

        if (name === 'transferFunction') {
            this.setTransferFunction(this.transferFunction);
        }

        if ([
            'transferFunction',
        ].includes(name)) {
            this.needsReset = true;
        }
    });

    this._programs = buildPrograms(this._gl, SHADERS.renderers.MIP, MIXINS);
}

destroy() {
    const gl = this._gl;
    Object.keys(this._programs).forEach(programName => {
        gl.deleteProgram(this._programs[programName].program);
    });

    super.destroy();
}

reset(accumulationBuffer, scene) {
    const gl = this._gl;

    const { program, uniforms } = this._programs.reset;
    gl.useProgram(program);

    accumulationBuffer.use();
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    accumulationBuffer.swap();

    this.needsReset = false;
}

generate(frameBuffer, scene) {
    const gl = this._gl;

    const volume = scene.find(node => node.getComponentOfType(Volume));

    if (!volume) {
        return;
    }

    const volumeTexture = volume.getComponentOfType(Volume).texture;

    const { program, uniforms } = this._programs.generate;
    gl.useProgram(program);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_3D, volumeTexture);
    gl.uniform1i(uniforms.uVolume, 0);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this._transferFunction);
    gl.uniform1i(uniforms.uTransferFunction, 1);

    gl.uniform1f(uniforms.uStepSize, 1 / this.steps);
    gl.uniform1f(uniforms.uOffset, Math.random());

    const matrix = this.calculatePVMMatrix(scene);
    mat4.invert(matrix, matrix);
    gl.uniformMatrix4fv(uniforms.uMvpInverseMatrix, false, matrix);

    frameBuffer.use();
    gl.drawArrays(gl.TRIANGLES, 0, 3);
}

integrate(frameBuffer, accumulationBuffer, scene) {
    const gl = this._gl;

    if (this.needsReset) {
        this.reset(accumulationBuffer, scene);
    }

    const { program, uniforms } = this._programs.integrate;
    gl.useProgram(program);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, accumulationBuffer.getAttachments().color[0]);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, frameBuffer.getAttachments().color[0]);

    gl.uniform1i(uniforms.uAccumulator, 0);
    gl.uniform1i(uniforms.uFrame, 1);

    accumulationBuffer.use();
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    accumulationBuffer.swap();
}

render(accumulationBuffer, renderBuffer, scene) {
    const gl = this._gl;

    const { program, uniforms } = this._programs.render;
    gl.useProgram(program);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, accumulationBuffer.getAttachments().color[0]);

    gl.uniform1i(uniforms.uAccumulator, 0);

    renderBuffer.use();
    gl.drawArrays(gl.TRIANGLES, 0, 3);
}

get frameBufferFormat() {
    return ['r8unorm'];
}

get accumulationBufferFormat() {
    return ['r8unorm'];
}

}
