import { mat4 } from '../../lib/gl-matrix-module.js';

import { AbstractRenderer } from './AbstractRenderer.js';

import { Volume } from '../Volume.js';
import { EnvironmentMap } from '../EnvironmentMap.js';

import { buildPrograms } from '../WebGL.js';
import { SHADERS, MIXINS } from '../shaders.js';

export class MCMRenderer extends AbstractRenderer {

constructor(gl) {
    super(gl);

    this.registerProperties([
        {
            name: 'extinction',
            label: 'Extinction',
            type: 'spinner',
            value: 100,
            min: 0,
        },
        {
            name: 'anisotropy',
            label: 'Anisotropy',
            type: 'slider',
            value: 0,
            min: -1,
            max: 1,
        },
        {
            name: 'bounces',
            label: 'Max bounces',
            type: 'spinner',
            value: 8,
            min: 0,
        },
        {
            name: 'steps',
            label: 'Steps',
            type: 'spinner',
            value: 8,
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
            'anisotropy',
            'bounces',
            'transferFunction',
        ].includes(name)) {
            this.needsReset = true;
        }
    });

    this._programs = buildPrograms(gl, SHADERS.renderers.MCM, MIXINS);
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

    gl.uniform2f(uniforms.uInverseResolution, 1 / accumulationBuffer._width, 1 / accumulationBuffer._height);
    gl.uniform1f(uniforms.uRandSeed, Math.random());
    gl.uniform1f(uniforms.uBlur, 0);

    const matrix = this.calculatePVMMatrix(scene);
    mat4.invert(matrix, matrix);
    gl.uniformMatrix4fv(uniforms.uMvpInverseMatrix, false, matrix);

    accumulationBuffer.use();
    gl.drawBuffers([
        gl.COLOR_ATTACHMENT0,
        gl.COLOR_ATTACHMENT1,
        gl.COLOR_ATTACHMENT2,
        gl.COLOR_ATTACHMENT3,
    ]);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    accumulationBuffer.swap();

    this.needsReset = false;
}

generate(frameBuffer, scene) {
}

integrate(frameBuffer, accumulationBuffer, scene) {
    const gl = this._gl;

    if (this.needsReset) {
        this.reset(accumulationBuffer, scene);
    }

    const volume = scene.find(node => node.getComponentOfType(Volume));
    const environment = scene.find(node => node.getComponentOfType(EnvironmentMap));

    if (!volume || !environment) {
        return;
    }

    const volumeTexture = volume.getComponentOfType(Volume).texture;
    const environmentTexture = environment.getComponentOfType(EnvironmentMap).texture;

    const { program, uniforms } = this._programs.integrate;
    gl.useProgram(program);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, accumulationBuffer.getAttachments().color[0]);
    gl.uniform1i(uniforms.uPosition, 0);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, accumulationBuffer.getAttachments().color[1]);
    gl.uniform1i(uniforms.uDirection, 1);

    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, accumulationBuffer.getAttachments().color[2]);
    gl.uniform1i(uniforms.uTransmittance, 2);

    gl.activeTexture(gl.TEXTURE3);
    gl.bindTexture(gl.TEXTURE_2D, accumulationBuffer.getAttachments().color[3]);
    gl.uniform1i(uniforms.uRadiance, 3);

    gl.activeTexture(gl.TEXTURE4);
    gl.bindTexture(gl.TEXTURE_3D, volumeTexture);
    gl.uniform1i(uniforms.uVolume, 4);

    gl.activeTexture(gl.TEXTURE5);
    gl.bindTexture(gl.TEXTURE_2D, environmentTexture);
    gl.uniform1i(uniforms.uEnvironment, 5);

    gl.activeTexture(gl.TEXTURE6);
    gl.bindTexture(gl.TEXTURE_2D, this._transferFunction);
    gl.uniform1i(uniforms.uTransferFunction, 6);

    gl.uniform2f(uniforms.uInverseResolution, 1 / accumulationBuffer._width, 1 / accumulationBuffer._height);
    gl.uniform1f(uniforms.uRandSeed, Math.random());
    gl.uniform1f(uniforms.uBlur, 0);

    gl.uniform1f(uniforms.uExtinction, this.extinction);
    gl.uniform1f(uniforms.uAnisotropy, this.anisotropy);
    gl.uniform1ui(uniforms.uMaxBounces, this.bounces);
    gl.uniform1ui(uniforms.uSteps, this.steps);

    const matrix = this.calculatePVMMatrix(scene);
    mat4.invert(matrix, matrix);
    gl.uniformMatrix4fv(uniforms.uMvpInverseMatrix, false, matrix);

    accumulationBuffer.use();
    gl.drawBuffers([
        gl.COLOR_ATTACHMENT0,
        gl.COLOR_ATTACHMENT1,
        gl.COLOR_ATTACHMENT2,
        gl.COLOR_ATTACHMENT3,
    ]);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    accumulationBuffer.swap();
}

render(accumulationBuffer, renderBuffer, scene) {
    const gl = this._gl;

    const { program, uniforms } = this._programs.render;
    gl.useProgram(program);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, accumulationBuffer.getAttachments().color[3]);

    gl.uniform1i(uniforms.uColor, 0);

    renderBuffer.use();
    gl.drawArrays(gl.TRIANGLES, 0, 3);
}

get frameBufferFormat() {
    return ['rgba32float'];
}

get accumulationBufferFormat() {
    return [
        'rgba32float', // position
        'rgba32float', // direction
        'rgba32float', // transmittance
        'rgba32float', // radiance
    ];
}

}
