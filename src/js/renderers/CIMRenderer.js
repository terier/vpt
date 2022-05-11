// #package js/main

// #include ../WebGL.js
// #include AbstractRenderer.js
// #include ../LightVolume.js

class CIMRenderer extends AbstractRenderer {

    constructor(gl, volume, environmentTexture, options) {
        super(gl, volume, environmentTexture, options);
        Object.assign(this, {
            // Ray Marching
            _stepSize                   : 0.00333,
            _alphaCorrection            : 100,
            _absorptionCoefficient      : 0,
            // Monte Carlo
            _lightVolumeRatio           : 1,
            _steps                      : 1,
            _majorant                   : 100,
            _extinctionScale            : 100,
            _scatteringBias             : 0,
            _maxBounces                 : 0,
            _mcEnabled                  : true,
            _halfFloat                  : false,
            // ISO
            _isovalue                   : 0.5,
            _light                      : [1, 1, 1],
            _diffuse                    : [0.86, 0.93, 1],
            p                           : 100,
            _shaderType                 : 3,
            // BRDF
            f0       : [0.04, 0.04, 0.04],
            f90      : [1, 1, 1],
            specularWeight : 1,
            alphaRoughness : 1,
        }, options);

        this._programs = WebGL.buildPrograms(this._gl, {
            generate        : SHADERS.CIMGenerate,
            integrateMCM    : SHADERS.CIMIntegrateMCM,
            render          : SHADERS.CIMRender,
            resetPhotonsMCM : SHADERS.CIMResetPhotonsMCM,
        }, MIXINS);

        this._transferFunction = WebGL.createTexture(gl, {
            width  : 2,
            height : 1,
            data   : new Uint8Array([255, 0, 0, 0, 255, 0, 0, 255]),
            wrapS  : gl.CLAMP_TO_EDGE,
            wrapT  : gl.CLAMP_TO_EDGE,
            min    : gl.LINEAR,
            mag    : gl.LINEAR
        });

        if (this._volume.ready) {
            this._initVolume();
        }
    }

    setVolume(volume) {
        this._volume = volume;
        this._initVolume();
    }

    render() {
        const gl = this._gl;
        gl.bindBuffer(gl.ARRAY_BUFFER, this._clipQuad);
        gl.enableVertexAttribArray(0); // position always bound to attribute 0
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

        // this._frameBuffer.use();
        // this._generateFrame();

        // this._accumulationBuffer.use();
        this._integrateFrameENV();
        this._accumulationBuffer.swap();

        this._renderBuffer.use();
        this._renderFrame();
    }

    destroy() {
        const gl = this._gl;
        Object.keys(this._programs).forEach(programName => {
            gl.deleteProgram(this._programs[programName].program);
        });
        super.destroy();
    }

    resetLightVolume() {
        if (this._volumeDimensions) {
            this._resetPhotons();
        }
    }

    _initVolume() {
        const volumeDimensions = this._volume.getDimensions('default');
        this._volumeDimensions = volumeDimensions;

        console.log("Volume Dimensions: " + volumeDimensions.width + " " + volumeDimensions.height + " " + volumeDimensions.depth);
        // this._mcEnabled = false
        this._setLightVolumeDimensions();
        this._setAccumulationBuffer();
        this._resetPhotons();
        // this._initDynamicIterationValues();
        // this._mcEnabled = true
    }

    _setLightVolumeDimensions() {
        if (!this._volumeDimensions) {
            return;
        }
        const volumeDimensions = this._volumeDimensions;
        this._lightVolumeDimensions = {
            width: Math.floor(volumeDimensions.width / this._lightVolumeRatio),
            height: Math.floor(volumeDimensions.height / this._lightVolumeRatio),
            depth: Math.floor(volumeDimensions.depth / this._lightVolumeRatio)
        };

        console.log("Light Volume Dimensions: " + this._lightVolumeDimensions.width + " " +
            this._lightVolumeDimensions.height + " " + this._lightVolumeDimensions.depth);
        // this._lightVolumeDimensions.depth = 150
    }

    _setAccumulationBuffer() {
        if (this._accumulationBuffer) {
            this._accumulationBuffer.destroy();
        }
        this._accumulationBuffer = new DoubleBuffer3D(this._gl, this._getAccumulationBufferSpec());
    }

    _resetPhotons() {
        const gl = this._gl;
        this._previousTime = new Date().getTime()

        // this._setAccumulationBuffer();

        gl.bindBuffer(gl.ARRAY_BUFFER, this._clipQuad);
        gl.enableVertexAttribArray(0); // position always bound to attribute 0
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

        const program = this._programs.resetPhotonsMCM;
        gl.useProgram(program.program);
        for (let i = 0; i < this._lightVolumeDimensions.depth; i++) {
            this._accumulationBuffer.use(i);

            gl.uniform1f(program.uniforms.uRandSeed, Math.random());
            gl.uniform1f(program.uniforms.uLayer, (i + 0.5) / this._lightVolumeDimensions.depth);

            gl.drawBuffers([
                gl.COLOR_ATTACHMENT0,
                gl.COLOR_ATTACHMENT1,
                gl.COLOR_ATTACHMENT2,
                gl.COLOR_ATTACHMENT3
            ]);
            gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
        }
        this._currentDepth = 0;
        this._accumulationBuffer.swap();
    }

    _rebuildBuffers() {
        if (this._frameBuffer) {
            this._frameBuffer.destroy();
        }
        // if (this._accumulationBuffer) {
        //     this._accumulationBuffer.destroy();
        // }
        if (this._renderBuffer) {
            this._renderBuffer.destroy();
        }
        const gl = this._gl;
        this._frameBuffer = new SingleBuffer(gl, this._getFrameBufferSpec());
        // this._accumulationBuffer = new DoubleBuffer(gl, this._getAccumulationBufferSpec());
        this._renderBuffer = new SingleBuffer(gl, this._getRenderBufferSpec());
    }

    reset() {}

    _resetFrame() {}

    _generateFrame() {}

    _integrateFrameENV() {
        const gl = this._gl;
        if (!this._mcEnabled)
            return
        let program = this._programs.integrateMCM;
        gl.useProgram(program.program);

        const dimensions = this._lightVolumeDimensions;
        const iterations = this._lightVolumeDimensions.depth
        // let currentDepth = this._currentDepth
        let currentDepth = 0
        // console.log("IT:", iterations, "CD:", this._currentDepth)
        for (let i = 0; i < iterations; i++) {
        // for (let currentDepth = 0; currentDepth < this._lightVolumeDimensions.depth; currentDepth++) {
            this._accumulationBuffer.use(currentDepth);

            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_3D, this._accumulationBuffer.getAttachments().color[0]);
            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_3D, this._accumulationBuffer.getAttachments().color[1]);
            gl.activeTexture(gl.TEXTURE2);
            gl.bindTexture(gl.TEXTURE_3D, this._accumulationBuffer.getAttachments().color[2]);
            gl.activeTexture(gl.TEXTURE3);
            gl.bindTexture(gl.TEXTURE_3D, this._accumulationBuffer.getAttachments().color[3]);

            gl.activeTexture(gl.TEXTURE4);
            gl.bindTexture(gl.TEXTURE_3D, this._volume.getTexture());
            gl.activeTexture(gl.TEXTURE5);
            gl.bindTexture(gl.TEXTURE_2D, this._environmentTexture);
            gl.activeTexture(gl.TEXTURE6);
            gl.bindTexture(gl.TEXTURE_2D, this._transferFunction);

            gl.uniform1i(program.uniforms.uPosition, 0);
            gl.uniform1i(program.uniforms.uDirectionAndBounces, 1);
            gl.uniform1i(program.uniforms.uWeight, 2);
            gl.uniform1i(program.uniforms.uRadianceAndSamples, 3);
            gl.uniform1i(program.uniforms.uVolume, 4);
            gl.uniform1i(program.uniforms.uEnvironment, 5);
            gl.uniform1i(program.uniforms.uTransferFunction, 6);



            gl.uniform1ui(program.uniforms.uSteps, this._steps);
            gl.uniform1f(program.uniforms.uLayer, (currentDepth + 0.5) / dimensions.depth);


            gl.uniform1f(program.uniforms.uExtinctionScale, this._extinctionScale);
            gl.uniform1f(program.uniforms.uScatteringBias, this._scatteringBias);
            gl.uniform1ui(program.uniforms.uMaxBounces, this._maxBounces);

            gl.uniform1f(program.uniforms.uMajorant, this._majorant);
            gl.uniform1f(program.uniforms.uRandSeed, Math.random());

            gl.uniform1f(program.uniforms.uIsovalue, this._isovalue);
            gl.uniform3fv(program.uniforms.uLight, this._light);
            gl.uniform3fv(program.uniforms.uDiffuse, this._diffuse);

            gl.drawBuffers([
                gl.COLOR_ATTACHMENT0,
                gl.COLOR_ATTACHMENT1,
                gl.COLOR_ATTACHMENT2,
                gl.COLOR_ATTACHMENT3
            ]);

            gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);

            currentDepth++;
        }

        this._currentDepth = currentDepth
    }

    _renderFrame() {
        const gl = this._gl;

        const program = this._programs.render;
        gl.useProgram(program.program);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_3D, this._volume.getTexture());
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, this._transferFunction);
        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_3D, this._accumulationBuffer.getAttachments().color[3]);

        gl.uniform1i(program.uniforms.uVolume, 0);
        gl.uniform1i(program.uniforms.uTransferFunction, 1);
        gl.uniform1i(program.uniforms.uRadianceAndDiffusion, 2);

        gl.uniform1f(program.uniforms.uStepSize, this._stepSize);
        gl.uniform1f(program.uniforms.uOffset, Math.random());
        gl.uniform1f(program.uniforms.uAlphaCorrection, this._alphaCorrection);

        gl.uniform1f(program.uniforms.uIsovalue, this._isovalue);
        gl.uniform3fv(program.uniforms.uLight, this._light);
        gl.uniform3fv(program.uniforms.uDiffuse, this._diffuse);

        gl.uniformMatrix4fv(program.uniforms.uMvpInverseMatrix, false, this._mvpInverseMatrix.m);

        gl.uniform1f(program.uniforms.uSpecularWeight, this.specularWeight);
        gl.uniform1f(program.uniforms.uAlphaRoughness, this.alphaRoughness);
        gl.uniform3fv(program.uniforms.uF0, this.f0);
        gl.uniform3fv(program.uniforms.uF90, this.f90);
        gl.uniform1f(program.uniforms.uP, this.p);
        gl.uniform1i(program.uniforms.uShaderType, this._shaderType);

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
            internalFormat : gl.RGBA,
            type           : gl.UNSIGNED_BYTE
        }];
    }

    _getAccumulationBufferSpec() {
        const gl = this._gl;

        const width = this._lightVolumeDimensions.width;
        const height = this._lightVolumeDimensions.height;
        const depth = this._lightVolumeDimensions.depth;

        let type = gl.FLOAT
        let internalFormat = gl.RGBA32F
        if (this.halfFloat) {
            type = gl.HALF_FLOAT
            internalFormat = gl.RGBA16F
        }

        const positionBufferSpec = {
            target         : gl.TEXTURE_3D,
            width          : width,
            height         : height,
            depth          : depth,
            min            : gl.NEAREST,
            mag            : gl.NEAREST,
            // format         : gl.RGB,
            // internalFormat : gl.RGB32F,
            format         : gl.RGBA,
            internalFormat : internalFormat,
            type           : type,
            wrapS          : gl.CLAMP_TO_EDGE,
            wrapT          : gl.CLAMP_TO_EDGE,
            wrapR          : gl.CLAMP_TO_EDGE,
            storage        : true
        };

        const directionAndBouncesBufferSpec = {
            target         : gl.TEXTURE_3D,
            width          : width,
            height         : height,
            depth          : depth,
            min            : gl.NEAREST,
            mag            : gl.NEAREST,
            // format         : gl.RGBA,
            // internalFormat : gl.RGBA32F,
            format         : gl.RGBA,
            internalFormat : internalFormat,
            type           : type,
            wrapS          : gl.CLAMP_TO_EDGE,
            wrapT          : gl.CLAMP_TO_EDGE,
            wrapR          : gl.CLAMP_TO_EDGE,
            storage        : true
        };

        const transmittanceBufferSpec = {
            target         : gl.TEXTURE_3D,
            width          : width,
            height         : height,
            depth          : depth,
            min            : gl.NEAREST,
            mag            : gl.NEAREST,
            // format         : gl.RGB,
            // internalFormat : gl.RGB32F,
            format         : gl.RGBA,
            internalFormat : internalFormat,
            type           : type,
            wrapS          : gl.CLAMP_TO_EDGE,
            wrapT          : gl.CLAMP_TO_EDGE,
            wrapR          : gl.CLAMP_TO_EDGE,
            storage        : true
        };

        const radianceAndSamplesBufferSpec = {
            target         : gl.TEXTURE_3D,
            width          : width,
            height         : height,
            depth          : depth,
            min            : gl.LINEAR,
            mag            : gl.LINEAR,
            // min            : gl.NEAREST,
            // mag            : gl.NEAREST,
            // format         : gl.RG,
            // internalFormat : gl.RG32F,
            format         : gl.RGBA,
            internalFormat : internalFormat,
            type           : type,
            wrapS          : gl.CLAMP_TO_EDGE,
            wrapT          : gl.CLAMP_TO_EDGE,
            wrapR          : gl.CLAMP_TO_EDGE,
            storage        : true
        };

        return [
            positionBufferSpec,
            directionAndBouncesBufferSpec,
            transmittanceBufferSpec,
            radianceAndSamplesBufferSpec
        ];
    }
}