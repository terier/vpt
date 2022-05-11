import { WebGL } from './WebGL.js';

export class SingleBuffer3D {

constructor(gl, spec) {
    this._gl = gl;
    this._spec = spec;

    this._width = this._spec[0].width;
    this._height = this._spec[0].height;
    this._depth = this._spec[0].depth;


    this._attachments = this._createAttachmentsFromSpec(gl, this._spec);
    this._framebuffers = this._createFramebuffers(gl, this._attachments);
}

destroy() {
    const gl = this._gl;
    for (let framebuffer of this._framebuffers) {
        gl.deleteFramebuffer(framebuffer);
    }
    for (let texture of this._attachments.color) {
        gl.deleteTexture(texture);
    }
}

_createAttachmentsFromSpec(gl, spec) {
    return { color: spec.map(s => WebGL.createTexture(gl, s)) };
}

_createFramebuffers(gl, attachments) {
    let framebuffers = []
    for (let i = 0; i < this._depth; i++) {
        framebuffers[i] = WebGL.createFramebuffer3D(gl, attachments, i);
    }
    return framebuffers;
}

use(z = -1) {
    if (z < 0)
        return;

    const gl = this._gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, this._framebuffers[z]);
    gl.viewport(0, 0, this._width, this._height);
}

getAttachments() {
    return this._attachments;
}

}
