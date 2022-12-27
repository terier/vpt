import { PropertyBag } from '../PropertyBag.js';
import { WebGL } from '../WebGL.js';
import { SingleBuffer } from '../SingleBuffer.js';

const [ SHADERS, MIXINS ] = await Promise.all([
    'shaders.json',
    'mixins.json',
].map(url => fetch(url).then(response => response.json())));

export class AbstractToneMapper extends PropertyBag {

constructor(gl, texture, options = {}) {
    super();

    this._resolution = options.resolution ?? 512;

    this._gl = gl;
    this._texture = texture;

    this._rebuildBuffers();

    this._clipQuadProgram = WebGL.buildPrograms(gl, {
        quad: SHADERS.quad
    }, MIXINS).quad;
}

destroy() {
    const gl = this._gl;

    this._renderBuffer.destroy();
    gl.deleteProgram(this._clipQuadProgram.program);
}

render() {
    this._renderBuffer.use();
    this._renderFrame();
}

setTexture(texture) {
    this._texture = texture;
}

getTexture() {
    return this._renderBuffer.getAttachments().color[0];
}

_rebuildBuffers() {
    if (this._renderBuffer) {
        this._renderBuffer.destroy();
    }
    const gl = this._gl;
    this._renderBuffer = new SingleBuffer(gl, this._getRenderBufferSpec());
}

setResolution(resolution) {
    if (resolution !== this._resolution) {
        this._resolution = resolution;
        this._rebuildBuffers();
    }
}

_renderFrame() {
    // IMPLEMENT
}

_getRenderBufferSpec() {
    const gl = this._gl;
    return [{
        width   : this._resolution,
        height  : this._resolution,
        min     : gl.LINEAR,
        mag     : gl.LINEAR,
        wrapS   : gl.CLAMP_TO_EDGE,
        wrapT   : gl.CLAMP_TO_EDGE,
        format  : gl.RGBA,
        iformat : gl.RGBA,
        type    : gl.UNSIGNED_BYTE,
    }];
}

}
