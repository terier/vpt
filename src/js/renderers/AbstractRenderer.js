import { mat4 } from '../../lib/gl-matrix-module.js';

import { PropertyBag } from '../PropertyBag.js';
import { WebGL } from '../WebGL.js';
import { SingleBuffer } from '../SingleBuffer.js';
import { DoubleBuffer } from '../DoubleBuffer.js';

import { Transform } from '../Transform.js';

import {
    getGlobalModelMatrix,
    getGlobalViewMatrix,
    getProjectionMatrix,
} from '../SceneUtils.js';

import { SHADERS, MIXINS } from '../shaders.js';

export class AbstractRenderer extends PropertyBag {

constructor(gl, volume, camera, environmentTexture, {
    resolution = [512, 512],
} = {}) {
    super();

    this._resolution = resolution;

    this._gl = gl;
    this._volume = volume;
    this._camera = camera;
    this._environmentTexture = environmentTexture;

    this._rebuildBuffers();

    this._transferFunction = WebGL.createTexture(gl, {
        width   : 2,
        height  : 1,
        data    : new Uint8Array([255, 0, 0, 0, 255, 0, 0, 255]),

        iformat : gl.SRGB8_ALPHA8,
        format  : gl.RGBA,
        type    : gl.UNSIGNED_BYTE,

        wrapS   : gl.CLAMP_TO_EDGE,
        wrapT   : gl.CLAMP_TO_EDGE,
        min     : gl.LINEAR,
        mag     : gl.LINEAR,
    });

    this._clipQuadProgram = WebGL.buildPrograms(gl, {
        quad: SHADERS.quad
    }, MIXINS).quad;

    this.lastMatrix = mat4.create();
}

calculatePVMMatrix() {
    const centerMatrix = mat4.fromTranslation(mat4.create(), [-0.5, -0.5, -0.5]);
    const modelMatrix = getGlobalModelMatrix(this._volume);
    const viewMatrix = getGlobalViewMatrix(this._camera);
    const projectionMatrix = getProjectionMatrix(this._camera);

    const matrix = mat4.create();
    mat4.multiply(matrix, centerMatrix, matrix);
    mat4.multiply(matrix, modelMatrix, matrix);
    mat4.multiply(matrix, viewMatrix, matrix);
    mat4.multiply(matrix, projectionMatrix, matrix);

    return matrix;
}

destroy() {
    const gl = this._gl;
    this._frameBuffer.destroy();
    this._accumulationBuffer.destroy();
    this._renderBuffer.destroy();
    gl.deleteTexture(this._transferFunction);
    gl.deleteProgram(this._clipQuadProgram.program);
}

render() {
    const matrix = this.calculatePVMMatrix();
    if (!mat4.equals(matrix, this.lastMatrix)) {
        this.reset();
        this.lastMatrix = matrix;
    }

    this._frameBuffer.use();
    this._generateFrame();

    this._accumulationBuffer.use();
    this._integrateFrame();
    this._accumulationBuffer.swap();

    this._renderBuffer.use();
    this._renderFrame();
}

reset() {
    this._accumulationBuffer.use();
    this._resetFrame();
    this._accumulationBuffer.swap();
}

_rebuildBuffers() {
    if (this._frameBuffer) {
        this._frameBuffer.destroy();
    }
    if (this._accumulationBuffer) {
        this._accumulationBuffer.destroy();
    }
    if (this._renderBuffer) {
        this._renderBuffer.destroy();
    }
    const gl = this._gl;
    this._frameBuffer = new SingleBuffer(gl, this._getFrameBufferSpec());
    this._accumulationBuffer = new DoubleBuffer(gl, this._getAccumulationBufferSpec());
    this._renderBuffer = new SingleBuffer(gl, this._getRenderBufferSpec());
}

setVolume(volume) {
    this._volume = volume;
    this.reset();
}

setTransferFunction(transferFunction) {
    const gl = this._gl;
    gl.bindTexture(gl.TEXTURE_2D, this._transferFunction);
    gl.texImage2D(gl.TEXTURE_2D, 0,
        gl.SRGB8_ALPHA8, gl.RGBA, gl.UNSIGNED_BYTE, transferFunction);
}

setResolution(width, height) {
    const [previousWidth, previousHeight] = this._resolution;
    if (width !== previousWidth || height !== previousHeight) {
        this._resolution = [width, height];
        this._rebuildBuffers();
        this.reset();
    }
}

getTexture() {
    return this._renderBuffer.getAttachments().color[0];
}

_resetFrame() {
    // IMPLEMENT
}

_generateFrame() {
    // IMPLEMENT
}

_integrateFrame() {
    // IMPLEMENT
}

_renderFrame() {
    // IMPLEMENT
}

_getFrameBufferSpec() {
    // IMPLEMENT
}

_getAccumulationBufferSpec() {
    // IMPLEMENT
}

_getRenderBufferSpec() {
    const gl = this._gl;
    return [{
        width   : this._resolution[0],
        height  : this._resolution[1],
        min     : gl.NEAREST,
        mag     : gl.NEAREST,
        wrapS   : gl.CLAMP_TO_EDGE,
        wrapT   : gl.CLAMP_TO_EDGE,
        format  : gl.RGBA,
        iformat : gl.RGBA16F,
        type    : gl.FLOAT,
    }];
}

}
