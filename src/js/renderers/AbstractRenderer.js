import { mat4 } from '../../lib/gl-matrix-module.js';

import { PropertyBag } from '../PropertyBag.js';
import { WebGL } from '../WebGL.js';
import { SingleBuffer } from '../SingleBuffer.js';
import { DoubleBuffer } from '../DoubleBuffer.js';

import { Transform } from '../Transform.js';

import { SHADERS, MIXINS } from '../shaders.js';

export class AbstractRenderer extends PropertyBag {

constructor(gl, volume, camera, environmentTexture, options = {}) {
    super();

    this._resolution = options.resolution ?? 512;

    this._gl = gl;
    this._volume = volume;
    this._camera = camera;
    this._environmentTexture = environmentTexture;

    this._volumeTransform = options.transform ?? new Transform();

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

setResolution(resolution) {
    if (resolution !== this._resolution) {
        this._resolution = resolution;
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
        width   : this._resolution,
        height  : this._resolution,
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
