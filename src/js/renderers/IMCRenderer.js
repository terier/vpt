// #package js/main

// #include ../WebGL.js
// #include AbstractRenderer.js

class IMCRenderer extends AbstractRenderer {

constructor(gl, volume, environmentTexture, options) {
    super(gl, volume, environmentTexture, options);

    Object.assign(this, {
        // ISO
        _stepSize : 0.05,
        _isovalue : 0.5,
        _light    : [1, 1, 1],
        _diffuse  : [0.86, 0.93, 1],

        // BRDF
        // f0    : [0.04, 0.04, 0.04],
        // f90   : [1.00, 1.00, 1.00],
        f0       : 0.5,
        f90      : 1,
        specularWeight : 1,
        alphaRoughness : 1,

        // MCM
        absorptionCoefficient : 1,
        scatteringCoefficient : 1,
        scatteringBias        : 0,
        majorant              : 2,
        maxBounces            : 8,
        steps                 : 1
    }, options);

    this._programs = WebGL.buildPrograms(this._gl, {
        generate        : SHADERS.IMCGenerate,
        integrateISO    : SHADERS.IMCIntegrateISO,
        integrateMCM    : SHADERS.IMCIntegrateMCM,
        render          : SHADERS.IMCRender,
        resetISO        : SHADERS.IMCResetISO,
        resetMCM        : SHADERS.IMCResetMCM
    }, MIXINS);
}

destroy() {
    const gl = this._gl;
    Object.keys(this._programs).forEach(programName => {
        gl.deleteProgram(this._programs[programName].program);
    });

    super.destroy();
}

reset() {
    // TODO: put the following logic in VAO
    const gl = this._gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, this._clipQuad);
    gl.enableVertexAttribArray(0); // position always bound to attribute 0
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    this._resetFrame();
}

_resetFrame() {
    const gl = this._gl;

    // ISO
    this._accumulationBufferISO.use();
    let { program, uniforms } = this._programs.resetISO;
    gl.useProgram(program);

    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
    this._accumulationBufferISO.swap();

    // MCM
    program = this._programs.resetMCM.program
    uniforms = this._programs.resetMCM.uniforms
    this._accumulationBufferMCM.use();
    gl.useProgram(program);

    gl.uniformMatrix4fv(uniforms.uMvpInverseMatrix, false, this._mvpInverseMatrix.m);
    gl.uniform2f(uniforms.uInverseResolution, 1 / this._bufferSize, 1 / this._bufferSize);
    gl.uniform1f(uniforms.uRandSeed, Math.random());
    gl.uniform1f(uniforms.uBlur, 0);

    gl.drawBuffers([
        gl.COLOR_ATTACHMENT0,
        gl.COLOR_ATTACHMENT1,
        gl.COLOR_ATTACHMENT2,
        gl.COLOR_ATTACHMENT3
    ]);

    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);

    this._accumulationBufferMCM.swap();
}

_generateFrame() {
    const gl = this._gl;

    const { program, uniforms } = this._programs.generate;
    gl.useProgram(program);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this._accumulationBufferISO.getAttachments().color[0]);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_3D, this._volume.getTexture());

    gl.uniform1i(uniforms.uClosest, 0);
    gl.uniform1i(uniforms.uVolume, 1);
    gl.uniform1f(uniforms.uStepSize, this._stepSize);
    gl.uniform1f(uniforms.uOffset, Math.random());
    gl.uniform1f(uniforms.uIsovalue, this._isovalue);
    gl.uniformMatrix4fv(uniforms.uMvpInverseMatrix, false, this._mvpInverseMatrix.m);

    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
}

_integrateFrame() {
    const gl = this._gl;
    // ISO
    this._accumulationBufferISO.use();

    let { program, uniforms } = this._programs.integrateISO;
    gl.useProgram(program);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this._accumulationBufferISO.getAttachments().color[0]);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this._frameBuffer.getAttachments().color[0]);

    gl.uniform1i(uniforms.uAccumulator, 0);
    gl.uniform1i(uniforms.uFrame, 1);

    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);

    this._accumulationBufferISO.swap();

    // PT
    program = this._programs.integrateMCM.program
    uniforms = this._programs.integrateMCM.uniforms
    this._accumulationBufferMCM.use();

    gl.useProgram(program);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this._accumulationBufferMCM.getAttachments().color[0]);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this._accumulationBufferMCM.getAttachments().color[1]);
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, this._accumulationBufferMCM.getAttachments().color[2]);
    gl.activeTexture(gl.TEXTURE3);
    gl.bindTexture(gl.TEXTURE_2D, this._accumulationBufferMCM.getAttachments().color[3]);

    gl.activeTexture(gl.TEXTURE4);
    gl.bindTexture(gl.TEXTURE_3D, this._volume.getTexture());
    gl.activeTexture(gl.TEXTURE5);
    gl.bindTexture(gl.TEXTURE_2D, this._environmentTexture);
    gl.activeTexture(gl.TEXTURE6);
    gl.bindTexture(gl.TEXTURE_2D, this._transferFunction);

    gl.activeTexture(gl.TEXTURE7);
    gl.bindTexture(gl.TEXTURE_2D, this._accumulationBufferISO.getAttachments().color[0]);

    gl.uniform1i(uniforms.uPosition, 0);
    gl.uniform1i(uniforms.uDirection, 1);
    gl.uniform1i(uniforms.uTransmittance, 2);
    gl.uniform1i(uniforms.uRadiance, 3);

    gl.uniform1i(uniforms.uVolume, 4);
    gl.uniform1i(uniforms.uEnvironment, 5);
    gl.uniform1i(uniforms.uTransferFunction, 6);

    gl.uniform1i(uniforms.uClosest, 7);

    gl.uniformMatrix4fv(uniforms.uMvpInverseMatrix, false, this._mvpInverseMatrix.m);
    gl.uniform2f(uniforms.uInverseResolution, 1 / this._bufferSize, 1 / this._bufferSize);
    gl.uniform1f(uniforms.uRandSeed, Math.random());
    gl.uniform1f(uniforms.uBlur, 0);

    gl.uniform1f(uniforms.uAbsorptionCoefficient, this.absorptionCoefficient);
    gl.uniform1f(uniforms.uScatteringCoefficient, this.scatteringCoefficient);
    gl.uniform1f(uniforms.uScatteringBias, this.scatteringBias);
    gl.uniform1f(uniforms.uMajorant, this.majorant);
    gl.uniform1ui(uniforms.uMaxBounces, this.maxBounces);
    gl.uniform1ui(uniforms.uSteps, this.steps);
    gl.uniform3fv(uniforms.uLight, this._light);
    gl.uniform3fv(uniforms.uDiffuse, this._diffuse);

    gl.uniform1f(uniforms.uSpecularWeight, this.specularWeight);
    gl.uniform1f(uniforms.uAlphaRoughness, this.alphaRoughness);
    gl.uniform1f(uniforms.uF0, this.f0);
    gl.uniform1f(uniforms.uF90, this.f90);

    gl.drawBuffers([
        gl.COLOR_ATTACHMENT0,
        gl.COLOR_ATTACHMENT1,
        gl.COLOR_ATTACHMENT2,
        gl.COLOR_ATTACHMENT3
    ]);

    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);

    this._accumulationBufferMCM.swap();
}

_renderFrame() {
    const gl = this._gl;

    const { program, uniforms } = this._programs.render;
    gl.useProgram(program);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this._accumulationBufferMCM.getAttachments().color[3]);

    gl.uniform1i(uniforms.uColor, 0);

    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
}

render() {
    const gl = this._gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, this._clipQuad);
    gl.enableVertexAttribArray(0); // position always bound to attribute 0
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    this._frameBuffer.use();
    this._generateFrame();

    // Buffers are handled in _integrateFrame()
    this._integrateFrame();

    this._renderBuffer.use();
    this._renderFrame();
}

destroy() {
    const gl = this._gl;
    this._frameBuffer.destroy();
    this._accumulationBufferISO.destroy();
    this._accumulationBufferMCM.destroy();
    this._renderBuffer.destroy();
    gl.deleteTexture(this._transferFunction);
    gl.deleteBuffer(this._clipQuad);
    gl.deleteProgram(this._clipQuadProgram.program);
}

_rebuildBuffers() {
    if (this._frameBuffer) {
        this._frameBuffer.destroy();
    }
    if (this._accumulationBufferISO) {
        this._accumulationBufferISO.destroy();
    }
    if (this._accumulationBufferMCM) {
        this._accumulationBufferMCM.destroy();
    }
    if (this._renderBuffer) {
        this._renderBuffer.destroy();
    }
    const gl = this._gl;
    this._frameBuffer = new SingleBuffer(gl, this._getFrameBufferSpec());
    this._accumulationBufferISO = new DoubleBuffer(gl, this._getAccumulationBufferSpec());
    this._accumulationBufferMCM = new DoubleBuffer(gl, this._getAccumulationBufferSpec_MCM());
    this._renderBuffer = new SingleBuffer(gl, this._getRenderBufferSpec());
}

_getFrameBufferSpec() {
    const gl = this._gl;
    return [{
        width          : this._bufferSize,
        height         : this._bufferSize,
        min            : gl.NEAREST,
        mag            : gl.NEAREST,
        format         : gl.RGBA,
        internalFormat : gl.RGBA16F,
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
        internalFormat : gl.RGBA16F,
        type           : gl.FLOAT
    }];
}

_getAccumulationBufferSpec_MCM() {
    const gl = this._gl;

    const positionBufferSpec = {
        width          : this._bufferSize,
        height         : this._bufferSize,
        min            : gl.NEAREST,
        mag            : gl.NEAREST,
        format         : gl.RGBA,
        internalFormat : gl.RGBA32F,
        type           : gl.FLOAT
    };

    const directionBufferSpec = {
        width          : this._bufferSize,
        height         : this._bufferSize,
        min            : gl.NEAREST,
        mag            : gl.NEAREST,
        format         : gl.RGBA,
        internalFormat : gl.RGBA32F,
        type           : gl.FLOAT
    };

    const transmittanceBufferSpec = {
        width          : this._bufferSize,
        height         : this._bufferSize,
        min            : gl.NEAREST,
        mag            : gl.NEAREST,
        format         : gl.RGBA,
        internalFormat : gl.RGBA32F,
        type           : gl.FLOAT
    };

    const radianceBufferSpec = {
        width          : this._bufferSize,
        height         : this._bufferSize,
        min            : gl.NEAREST,
        mag            : gl.NEAREST,
        format         : gl.RGBA,
        internalFormat : gl.RGBA32F,
        type           : gl.FLOAT
    };

    return [
        positionBufferSpec,
        directionBufferSpec,
        transmittanceBufferSpec,
        radianceBufferSpec
    ];
}

}
