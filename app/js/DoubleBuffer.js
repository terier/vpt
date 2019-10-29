//@@WebGL.js

class DoubleBuffer {

constructor(gl, spec) {
    this._gl = gl;
    this._spec = spec;

    this._readAttachments = this._createAttachmentsFromSpec(gl, this._spec);
    this._readFramebuffer = WebGL.createFramebuffer(gl, this._readAttachments);
    this._writeAttachments = this._createAttachmentsFromSpec(gl, this._spec);
    this._writeFramebuffer = WebGL.createFramebuffer(gl, this._writeAttachments);

    this._width = this._spec[0].width;
    this._height = this._spec[0].height;
}

_createAttachmentsFromSpec(gl, spec) {
    return { color: spec.map(s => WebGL.createTexture(gl, s)) };
}

use() {
    const gl = this._gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, this._writeFramebuffer);
    gl.viewport(0, 0, this._width, this._height);
}

swap() {
    let tmp = this._readFramebuffer;
    this._readFramebuffer = this._writeFramebuffer;
    this._writeFramebuffer = tmp;

    tmp = this._readAttachments;
    this._readAttachments = this._writeAttachments;
    this._writeAttachments = tmp;
}

getAttachments() {
    return this._readAttachments;
}

getReadAttachments() {
    return this._readAttachments;
}

getWriteAttachments() {
    return this._writeAttachments;
}

}
