import { quat, vec3, mat4 } from '../../lib/gl-matrix-module.js';

import { AbstractRenderer } from './AbstractRenderer.js';
import { CommonUtils } from '../utils/CommonUtils.js';

import { Camera } from '../Camera.js';
import { Volume } from '../Volume.js';

import {
    getGlobalModelMatrix,
    getGlobalViewMatrix,
    getProjectionMatrix,
} from '../SceneUtils.js';

import { buildPrograms } from '../WebGL.js';
import { SHADERS, MIXINS } from '../shaders.js';

export class ISORenderer extends AbstractRenderer {

constructor(gl) {
    super(gl);

    this.registerProperties([
        {
            name: 'steps',
            label: 'Steps',
            type: 'spinner',
            value: 50,
            min: 1,
        },
        {
            name: 'isovalue',
            label: 'Isovalue',
            type: 'slider',
            value: 0.5,
            min: 0,
            max: 1,
        },
        {
            name: 'light',
            label: 'Light direction',
            type: 'vector-spinner',
            value: [ 2, -3, -5 ],
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
            'isovalue',
            'transferFunction',
        ].includes(name)) {
            this.needsReset = true;
        }
    });

    this._programs = buildPrograms(this._gl, SHADERS.renderers.ISO, MIXINS);
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

    gl.uniform1ui(uniforms.uSteps, this.steps);
    gl.uniform1f(uniforms.uOffset, Math.random());
    gl.uniform1f(uniforms.uIsovalue, this.isovalue);

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
    gl.uniform1i(uniforms.uAccumulator, 0);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, frameBuffer.getAttachments().color[0]);
    gl.uniform1i(uniforms.uFrame, 1);

    accumulationBuffer.use();
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    accumulationBuffer.swap();
}

render(accumulationBuffer, renderBuffer, scene) {
    const gl = this._gl;

    const volume = scene.find(node => node.getComponentOfType(Volume));
    const camera = scene.find(node => node.getComponentOfType(Camera));

    if (!volume || !camera) {
        return;
    }

    const volumeTexture = volume.getComponentOfType(Volume).texture;

    const { program, uniforms } = this._programs.render;
    gl.useProgram(program);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, accumulationBuffer.getAttachments().color[0]);
    gl.uniform1i(uniforms.uClosest, 0);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_3D, volumeTexture);
    gl.uniform1i(uniforms.uVolume, 1);

    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, this._transferFunction);
    gl.uniform1i(uniforms.uTransferFunction, 2);

    // Light direction is defined in view space, so transform it to model space.
    const centerMatrix = mat4.fromTranslation(mat4.create(), [-0.5, -0.5, -0.5]);
    const modelMatrix = getGlobalModelMatrix(volume);
    const viewMatrix = getGlobalViewMatrix(camera);
    const matrix = mat4.create();
    mat4.multiply(matrix, centerMatrix, matrix);
    mat4.multiply(matrix, modelMatrix, matrix);
    mat4.multiply(matrix, viewMatrix, matrix);
    mat4.invert(matrix, matrix);

    const light = vec3.transformMat4(vec3.create(), this.light, matrix);
    vec3.normalize(light, light);

    gl.uniform3fv(uniforms.uLight, light);

    gl.uniform1f(uniforms.uGradientStep, 0.005);

    renderBuffer.use();
    gl.drawArrays(gl.TRIANGLES, 0, 3);
}

get frameBufferFormat() {
    return ['rgba16float'];
}

get accumulationBufferFormat() {
    return ['rgba16float'];
}

}
