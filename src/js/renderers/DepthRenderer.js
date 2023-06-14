import { mat4 } from '../../lib/gl-matrix-module.js';

import { WebGL } from '../WebGL.js';
import { AbstractRenderer } from './AbstractRenderer.js';

const [ SHADERS, MIXINS ] = await Promise.all([
    'shaders.json',
    'mixins.json',
].map(url => fetch(url).then(response => response.json())));

export class DepthRenderer extends AbstractRenderer {

constructor(gl, volume, volumeTransform, camera, environmentTexture, options = {}) {
    super(gl, volume, volumeTransform, camera, environmentTexture, options);

    this.registerProperties([
        {
            name: 'extinction',
            label: 'Extinction',
            type: 'spinner',
            value: 100,
            min: 0,
        },
        {
            name: 'slices',
            label: 'Slices',
            type: 'spinner',
            value: 64,
            min: 1,
        },
        {
            name: 'threshold',
            label: 'Threshold',
            type: 'slider',
            value: 0.5,
            min: 0,
            max: 1,
        },
        {
            name: 'random',
            label: 'Random',
            type: 'checkbox',
            value: false,
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
            'slices',
            'threshold',
            'random',
            'transferFunction',
        ].includes(name)) {
            this.reset();
        }
    });

    this._programs = WebGL.buildPrograms(this._gl, SHADERS.renderers.DepthRenderer, MIXINS);
    this._frameNumber = 0;
}

destroy() {
    const gl = this._gl;
    Object.keys(this._programs).forEach(programName => {
        gl.deleteProgram(this._programs[programName].program);
    });

    super.destroy();
}

_resetFrame() {
    const gl = this._gl;

    const { program, uniforms } = this._programs.reset;
    gl.useProgram(program);

    gl.drawArrays(gl.TRIANGLES, 0, 3);

    this._frameNumber = 0;
}

_generateFrame() {
    const gl = this._gl;

    const { program, uniforms } = this._programs.generate;
    gl.useProgram(program);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_3D, this._volume.getTexture());
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this._transferFunction);

    gl.uniform1i(uniforms.uVolume, 0);
    gl.uniform1i(uniforms.uTransferFunction, 1);
    gl.uniform1f(uniforms.uStepSize, 1 / this.slices);
    gl.uniform1f(uniforms.uExtinction, this.extinction);
    gl.uniform1f(uniforms.uThreshold, this.threshold);
    gl.uniform1f(uniforms.uOffset, this.random ? Math.random() : 0);

    gl.uniformMatrix4fv(uniforms.uMvpInverseMatrix, false, this.getMVPInverseMatrix());

    gl.drawArrays(gl.TRIANGLES, 0, 3);

    this._frameNumber++;
}

_integrateFrame() {
    const gl = this._gl;

    const { program, uniforms } = this._programs.integrate;
    gl.useProgram(program);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this._accumulationBuffer.getAttachments().color[0]);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this._frameBuffer.getAttachments().color[0]);

    gl.uniform1i(uniforms.uAccumulator, 0);
    gl.uniform1i(uniforms.uFrame, 1);
    gl.uniform1f(uniforms.uMix, 1 / this._frameNumber);

    gl.drawArrays(gl.TRIANGLES, 0, 3);
}

_renderFrame() {
    const gl = this._gl;

    const { program, uniforms } = this._programs.render;
    gl.useProgram(program);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this._accumulationBuffer.getAttachments().color[0]);

    gl.uniform1i(uniforms.uAccumulator, 0);

    gl.drawArrays(gl.TRIANGLES, 0, 3);
}

samplePoint(tolerance = 0.01) {
    // Samples a point on the depth image, where depth is uniformly distributed in [0, 1].
    // Since we have to randomly choose a pixel from those whose depths fall into certain range,
    // it is easier to transfer the depth image to CPU and do the sampling there.

    const gl = this._gl;

    const pixels = new Float32Array(this._bufferSize * this._bufferSize);

    this._accumulationBuffer.swap();
    this._accumulationBuffer.use();
    gl.readPixels(0, 0, this._bufferSize, this._bufferSize, gl.RED, gl.FLOAT, pixels);
    this._accumulationBuffer.swap();

    const depths = [...pixels].map((depth, i) => ({
        x: i % this._bufferSize,
        y: this._bufferSize - 1 - Math.floor(i / this._bufferSize),
        depth,
    }));

    let chosen;
    while (true) {
        const depth = Math.random();
        const candidates = depths.filter(x => Math.abs(x.depth - depth) <= tolerance);
        if (candidates.length > 0) {
            const index = Math.floor(Math.random() * candidates.length);
            chosen = candidates[index];
            break;
        }
    }
    return chosen;
}

_getFrameBufferSpec() {
    const gl = this._gl;
    return [{
        width   : this._resolution,
        height  : this._resolution,
        min     : gl.NEAREST,
        mag     : gl.NEAREST,
        format  : gl.RED,
        iformat : gl.R32F,
        type    : gl.FLOAT,
    }];
}

_getAccumulationBufferSpec() {
    const gl = this._gl;
    return [{
        width   : this._resolution,
        height  : this._resolution,
        min     : gl.NEAREST,
        mag     : gl.NEAREST,
        format  : gl.RED,
        iformat : gl.R32F,
        type    : gl.FLOAT,
    }];
}

}
