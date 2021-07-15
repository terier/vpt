// #part /js/renderers/DOSRenderer

// #link ../math
// #link ../WebGL
// #link AbstractRenderer

class DOSRenderer extends AbstractRenderer {

constructor(gl, volume, environmentTexture, options) {
    super(gl, volume, environmentTexture, options);

    Object.assign(this, {
        steps      : 10,
        slices     : 200,
        extinction : 100,
        aperture   : 85,
        samples    : 10,
        _depth     : 1,
        _minDepth  : -1,
        _maxDepth  : 1,
    }, options);

    this._programs = WebGL.buildPrograms(this._gl, SHADERS.renderers.DOS, MIXINS);

    this.generateOcclusionSamples();
}

destroy() {
    const gl = this._gl;
    Object.keys(this._programs).forEach(programName => {
        gl.deleteProgram(this._programs[programName].program);
    });

    super.destroy();
}

generateOcclusionSamples() {
    const data = new Float32Array(this.samples * 2);
    let averagex = 0;
    let averagey = 0;
    for (let i = 0; i < this.samples; i++) {
        const r = Math.sqrt(Math.random());
        const phi = Math.random() * 2 * Math.PI;
        const x = r * Math.cos(phi);
        const y = r * Math.sin(phi);
        averagex += x / this.samples;
        averagey += y / this.samples;
        data[2 * i + 0] = x;
        data[2 * i + 1] = y;
    }
    for (let i = 0; i < this.samples; i++) {
        data[2 * i + 0] -= averagex;
        data[2 * i + 1] -= averagey;
    }

    const gl = this._gl;
    this._occlusionSamples = WebGL.createTexture(gl, {
        texture        : this._occlusionSamples,
        width          : this.samples,
        height         : 1,
        format         : gl.RG,
        internalFormat : gl.RG32F,
        type           : gl.FLOAT,
        min            : gl.NEAREST,
        mag            : gl.NEAREST,
        wrapS          : gl.CLAMP_TO_EDGE,
        wrapT          : gl.CLAMP_TO_EDGE,
        data           : data,
    });
}

calculateDepth() {
    const vertices = [
        new Vector(0, 0, 0),
        new Vector(0, 0, 1),
        new Vector(0, 1, 0),
        new Vector(0, 1, 1),
        new Vector(1, 0, 0),
        new Vector(1, 0, 1),
        new Vector(1, 1, 0),
        new Vector(1, 1, 1),
    ];

    let minDepth = 1;
    let maxDepth = -1;
    let mvp = this._mvpMatrix.clone().transpose();
    for (const v of vertices) {
        mvp.transform(v);
        const depth = Math.min(Math.max(v.z / v.w, -1), 1);
        minDepth = Math.min(minDepth, depth);
        maxDepth = Math.max(maxDepth, depth);
    }

    return [minDepth, maxDepth];
}

_resetFrame() {
    const gl = this._gl;

    const [minDepth, maxDepth] = this.calculateDepth();
    this._minDepth = minDepth;
    this._maxDepth = maxDepth;
    this._depth = minDepth;

    gl.drawBuffers([
        gl.COLOR_ATTACHMENT0,
        gl.COLOR_ATTACHMENT1
    ]);

    const { program, uniforms } = this._programs.reset;
    gl.useProgram(program);

    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
}

_integrateFrame() {
    const gl = this._gl;

    const { program, uniforms } = this._programs.integrate;
    gl.useProgram(program);

    gl.drawBuffers([
        gl.COLOR_ATTACHMENT0,
        gl.COLOR_ATTACHMENT1
    ]);

    gl.activeTexture(gl.TEXTURE2);
    gl.uniform1i(uniforms.uVolume, 2);
    gl.bindTexture(gl.TEXTURE_3D, this._volume.getTexture());

    gl.activeTexture(gl.TEXTURE3);
    gl.uniform1i(uniforms.uTransferFunction, 3);
    gl.bindTexture(gl.TEXTURE_2D, this._transferFunction);

    gl.activeTexture(gl.TEXTURE4);
    gl.uniform1i(uniforms.uOcclusionSamples, 4);
    gl.bindTexture(gl.TEXTURE_2D, this._occlusionSamples);

    const mvpit = this.calculateMVPInverseTranspose();
    gl.uniformMatrix4fv(uniforms.uMvpInverseMatrix, false, mvpit.m);
    // TODO: bias occlusion samples for "directional" light
    gl.uniform1ui(uniforms.uOcclusionSamplesCount, this.samples);
    gl.uniform1f(uniforms.uExtinction, this.extinction);

    const sliceDistance = (this._maxDepth - this._minDepth) / this.slices;
    gl.uniform1f(uniforms.uSliceDistance, sliceDistance);
    for (let step = 0; step < this.steps; step++) {
        if (this._depth > this._maxDepth) {
            break;
        }

        gl.activeTexture(gl.TEXTURE0);
        gl.uniform1i(uniforms.uColor, 0);
        gl.bindTexture(gl.TEXTURE_2D, this._accumulationBuffer.getAttachments().color[0]);

        gl.activeTexture(gl.TEXTURE1);
        gl.uniform1i(uniforms.uOcclusion, 1);
        gl.bindTexture(gl.TEXTURE_2D, this._accumulationBuffer.getAttachments().color[1]);

        // TODO: projection matrix
        const occlusionExtent = sliceDistance * Math.tan(this.aperture * Math.PI / 180);
        const occlusionScale = occlusionExtent / this._depth;
        gl.uniform2f(uniforms.uOcclusionScale, occlusionScale, occlusionScale);
        gl.uniform1f(uniforms.uDepth, this._depth);

        this._accumulationBuffer.use();
        gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
        this._accumulationBuffer.swap();

        this._depth += sliceDistance;
    }

    // Swap again to undo the last swap by AbstractRenderer
    this._accumulationBuffer.swap();
}

_renderFrame() {
    const gl = this._gl;

    const { program, uniforms } = this._programs.render;
    gl.useProgram(program);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this._accumulationBuffer.getAttachments().color[0]);

    gl.uniform1i(uniforms.uAccumulator, 0);

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

    const colorBuffer = {
        width          : this._bufferSize,
        height         : this._bufferSize,
        min            : gl.NEAREST,
        mag            : gl.NEAREST,
        format         : gl.RGBA,
        internalFormat : gl.RGBA32F,
        type           : gl.FLOAT
    };

    const occlusionBuffer = {
        width          : this._bufferSize,
        height         : this._bufferSize,
        min            : gl.LINEAR,
        mag            : gl.LINEAR,
        format         : gl.RED,
        internalFormat : gl.R32F,
        type           : gl.FLOAT
    };

    return [
        colorBuffer,
        occlusionBuffer
    ];
}

}
