// #package js/main

// #include ../WebGL.js
// #include AbstractRenderer.js

class MCSRenderer extends AbstractRenderer {

constructor(gl, volume, environmentTexture, options) {
    super(gl, volume, environmentTexture, options);

    Object.assign(this, {
        _sigmaMax        : 1,
        _alphaCorrection : 1,
    }, options);

    this._programs = WebGL.buildPrograms(gl, {
        generate  : SHADERS.MCSGenerate,
        integrate : SHADERS.MCSIntegrate,
        render    : SHADERS.MCSRender,
        reset     : SHADERS.MCSReset
    }, MIXINS);

    this._frameNumber = 1;
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

    const program = this._programs.reset;
    gl.useProgram(program.program);

    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);

    this._frameNumber = 1;
}

_generateFrame() {
    const gl = this._gl;

    const program = this._programs.generate;
    gl.useProgram(program.program);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_3D, this._volume.getTexture());
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this._environmentTexture);
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, this._transferFunction);

    gl.uniform1i(program.uniforms.uVolume, 0);
    gl.uniform1i(program.uniforms.uEnvironment, 1);
    gl.uniform1i(program.uniforms.uTransferFunction, 2);
    gl.uniformMatrix4fv(program.uniforms.uMvpInverseMatrix, false, this._mvpInverseMatrix.m);
    gl.uniform1f(program.uniforms.uOffset, Math.random());
    gl.uniform1f(program.uniforms.uSigmaMax, this._sigmaMax);
    gl.uniform1f(program.uniforms.uAlphaCorrection, this._alphaCorrection);

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
    gl.uniform3f(program.uniforms.uScatteringDirection, x, y, z);

    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
}

_integrateFrame() {
    const gl = this._gl;

    const program = this._programs.integrate;
    gl.useProgram(program.program);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this._accumulationBuffer.getAttachments().color[0]);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this._frameBuffer.getAttachments().color[0]);

    gl.uniform1i(program.uniforms.uAccumulator, 0);
    gl.uniform1i(program.uniforms.uFrame, 1);
    gl.uniform1f(program.uniforms.uInvFrameNumber, 1 / this._frameNumber);

    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);

    this._frameNumber += 1;
}

_renderFrame() {
    const gl = this._gl;

    const program = this._programs.render;
    gl.useProgram(program.program);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this._accumulationBuffer.getAttachments().color[0]);

    gl.uniform1i(program.uniforms.uAccumulator, 0);

    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
}

_getFrameBufferSpec() {
    const gl = this._gl;
    return [{
        width          : this._bufferSize,
        height         : this._bufferSize,
        min            : gl.NEAREST,
        mag            : gl.NEAREST,
        format         : gl.RGBA,
        internalFormat : gl.RGBA32F,
        type           : gl.FLOAT
    }];
}

_getAccumulationBufferSpec() {
    const gl = this._gl;
    return [{
        width          : this._bufferSize,
        height         : this._bufferSize,
        min            : gl.NEAREST,
        mag            : gl.NEAREST,
        format         : gl.RGBA,
        internalFormat : gl.RGBA32F,
        type           : gl.FLOAT
    }];
}

}
