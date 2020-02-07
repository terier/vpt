// #package js/main

// #include ../WebGL.js

class AbstractToneMapper {

constructor(gl, texture, options) {
    Object.assign(this, {
        _bufferSize : 512
    }, options);

    this._gl = gl;
    this._texture = texture;

    this._rebuildBuffers();

    this._clipQuad = WebGL.createClipQuad(gl);
    this._clipQuadProgram = WebGL.buildPrograms(gl, {
        quad: SHADERS.quad
    }).quad;
}

destroy() {
    const gl = this._gl;

    this._renderBuffer.destroy();
    gl.deleteBuffer(this._clipQuad);
    gl.deleteProgram(this._clipQuadProgram.program);
}

render() {
    // TODO: put the following logic in VAO
    const gl = this._gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, this._clipQuad);
    gl.enableVertexAttribArray(0); // position always bound to attribute 0
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

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
    if (resolution !== this._bufferSize) {
        this._bufferSize = resolution;
        this._rebuildBuffers();
    }
}

_renderFrame() {
    // IMPLEMENT
}

_getRenderBufferSpec() {
    const gl = this._gl;
    return [{
        width          : this._bufferSize,
        height         : this._bufferSize,
        min            : gl.LINEAR,
        mag            : gl.LINEAR,
        wrapS          : gl.CLAMP_TO_EDGE,
        wrapT          : gl.CLAMP_TO_EDGE,
        format         : gl.RGBA,
        internalFormat : gl.RGBA,
        type           : gl.UNSIGNED_BYTE
    }];
}

}
