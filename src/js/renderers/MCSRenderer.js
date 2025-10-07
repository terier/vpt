import { mat4 } from '../../lib/gl-matrix-module.js';

import { AbstractRenderer } from './AbstractRenderer.js';

import { Volume } from '../Volume.js';
import { EnvironmentMap } from '../EnvironmentMap.js';

import { buildPrograms } from '../WebGL.js';
import { SHADERS, MIXINS } from '../shaders.js';

export class MCSRenderer extends AbstractRenderer {

constructor(gl) {
    super(gl);

    this.registerProperties([
        {
            name: 'extinction',
            label: 'Extinction',
            type: 'spinner',
            value: 1,
            min: 0,
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
            'extinction',
            'transferFunction',
        ].includes(name)) {
            this.needsReset = true;
        }
    });

    this._programs = buildPrograms(gl, SHADERS.renderers.MCS, MIXINS);

    this._frameNumber = 1;
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

    this._frameNumber = 1;
    this.needsReset = false;
}

generate(frameBuffer, scene) {
    const gl = this._gl;

    const volume = scene.find(node => node.getComponentOfType(Volume));
    const environment = scene.find(node => node.getComponentOfType(EnvironmentMap));

    if (!volume || !environment) {
        return;
    }

    const volumeTexture = volume.getComponentOfType(Volume).texture;
    const environmentTexture = environment.getComponentOfType(EnvironmentMap).texture;

    const { program, uniforms } = this._programs.generate;
    gl.useProgram(program);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_3D, volumeTexture);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, environmentTexture);
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, this._transferFunction);

    gl.uniform1i(uniforms.uVolume, 0);
    gl.uniform1i(uniforms.uEnvironment, 1);
    gl.uniform1i(uniforms.uTransferFunction, 2);
    gl.uniform1f(uniforms.uRandSeed, Math.random());
    gl.uniform1f(uniforms.uExtinction, this.extinction);

    const matrix = this.calculatePVMMatrix(scene);
    mat4.invert(matrix, matrix);
    gl.uniformMatrix4fv(uniforms.uMvpInverseMatrix, false, matrix);

    // scattering direction
    let x, y, z, length;
    do {
        x = Math.random() * 2 - 1;
        y = Math.random() * 2 - 1;
        z = Math.random() * 2 - 1;
        length = Math.sqrt(x * x + y * y + z * z);
    } while (length > 1);
    x /= length;
    y /= length;
    z /= length;
    gl.uniform3f(uniforms.uScatteringDirection, x, y, z);

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
    gl.uniform1f(uniforms.uInvFrameNumber, 1 / this._frameNumber);

    accumulationBuffer.use();
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    accumulationBuffer.swap();

    this._frameNumber += 1;
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
    return ['rgba32float'];
}

get accumulationBufferFormat() {
    return ['rgba32float'];
}

}
