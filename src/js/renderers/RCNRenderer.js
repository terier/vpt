// #package js/main

// #include ../WebGL.js
// #include AbstractRenderer.js
// #include ../LightVolume.js

class RCNRenderer extends AbstractRenderer {

    constructor(gl, volume, environmentTexture, options) {
        super(gl, volume, environmentTexture, options);
        Object.assign(this, {
            _lightDefinitions           : [],
            _nActiveLights              : 0,
            // _lightType                  : 'distant',
            _stepSize                   : 0.00333,
            _alphaCorrection            : 100,
            _absorptionCoefficient      : 1,
            _scattering                 : 0.5,
            _lightVolumeRatio           : 1,
            _lightToggling              : 0,
            _steps                      : 1,
            _majorant                   : 100,
            _absorptionCoefficientMC    : 100,
            _rayCastingStepSize         : 0.00333,
            _rayCastingAlphaCorrection  : 100,
            _limit                      : 0,
            _timer                      : 0,
        }, options);

        this._programs = WebGL.buildPrograms(this._gl, {
            // diffusion       : SHADERS.RCDDiffusion,
            generate        : SHADERS.RCNGenerate,
            integrate       : SHADERS.RCNIntegrate,
            render          : SHADERS.RCNRender,
            reset           : SHADERS.RCNReset
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

        this._lightDefinitions = [
            new LightDefinition('distant', [0.8, 0.01, 0.01], true),
            new LightDefinition('point', [0, -0.1, 0.5], true)
        ]

        if (this._volume.ready) {
            this._initVolume();
        }
    }

    _resetPhotons() {
        const gl = this._gl;
        gl.bindBuffer(gl.ARRAY_BUFFER, this._clipQuad);
        gl.enableVertexAttribArray(0); // position always bound to attribute 0
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

        const program = this._programs.reset;

        gl.useProgram(program.program);

        for (let i = 0; i < this._lightVolumeDimensions.depth; i++) {
            this._accumulationBuffer.use(i);

            gl.uniform1ui(program.uniforms.uLayer, (i + 0.5) / this._lightVolumeDimensions.depth);

            const dimensions = this._lightVolumeDimensions;
            gl.uniform3f(program.uniforms.uSize, dimensions.width, dimensions.height, dimensions.depth);

            const light = this._lightDefinitions[0];
            const lightArr = light.getLightArr();
            gl.uniform4f(program.uniforms.uLight, lightArr[0], lightArr[1], lightArr[2], light.typeToInt());

            gl.drawBuffers([
                gl.COLOR_ATTACHMENT0,
                gl.COLOR_ATTACHMENT1,
                gl.COLOR_ATTACHMENT2,
                gl.COLOR_ATTACHMENT3
            ]);
            gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
        }
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

    setVolume(volume) {
        this._volume = volume;
        this._initVolume();
    }

    _setAccumulationBuffer() {
        this._accumulationBuffer = new DoubleBuffer3D(this._gl, this._getAccumulationBufferSpec());
    }

    _initVolume() {
        const volumeDimensions = this._volume.getDimensions('default');
        this._volumeDimensions = volumeDimensions;

        console.log("Volume Dimensions: " + volumeDimensions.width + " " + volumeDimensions.height + " " + volumeDimensions.depth);
        this._setLightVolumeDimensions();
        this._setAccumulationBuffer();
        this._resetPhotons();
        this.counter = 0;
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
    }

    destroy() {
        const gl = this._gl;
        Object.keys(this._programs).forEach(programName => {
            gl.deleteProgram(this._programs[programName].program);
        });
        super.destroy();
    }

    reset() {}

    _resetFrame() {}

    // _diffusion() {
    //     const gl = this._gl;
    //
    //     const program = this._programs.diffusion;
    //     gl.useProgram(program.program);
    //
    //     gl.bindImageTexture(0, this._energyDensityVolume, 0, true, 0, gl.READ_ONLY, gl.R32F);
    //     gl.bindImageTexture(1, this._energyDensityDiffusion, 0, true, 0, gl.READ_WRITE, gl.R32F);
    //
    //     const dimensions = this._lightVolumeDimensions;
    //
    //     gl.uniform3i(program.uniforms.uSize, dimensions.width, dimensions.height, dimensions.depth);
    //     gl.uniform1f(program.uniforms.scattering, this._scattering);
    //
    //     gl.uniform1f(program.uniforms.uRatio, Math.floor(this._lightVolumeRatio));
    //
    //     gl.dispatchCompute(Math.ceil(dimensions.width / this._localSizeX),
    //         Math.ceil(dimensions.height / this._localSizeY),
    //         Math.ceil(dimensions.depth / this._localSizeZ));
    // }

    _generateFrame() {}

    _integrateFrame() {
        const gl = this._gl;
        const program = this._programs.integrate;
        gl.useProgram(program.program);
        for (let i = 0; i < this._lightVolumeDimensions.depth; i++) {
            this._accumulationBuffer.use(i);

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
            gl.bindTexture(gl.TEXTURE_2D, this._transferFunction);

            gl.uniform1i(program.uniforms.uPosition, 0);
            gl.uniform1i(program.uniforms.uDirectionAndTransmittance, 1);
            gl.uniform1i(program.uniforms.uDistanceTravelledAndSamples, 2);
            gl.uniform1i(program.uniforms.uRadianceAndDiffusion, 3);
            gl.uniform1i(program.uniforms.uVolume, 4);
            gl.uniform1i(program.uniforms.uTransferFunction, 5);

            gl.uniform1ui(program.uniforms.uSteps, this._steps);
            gl.uniform1f(program.uniforms.uLayer, (i + 0.5) / this._lightVolumeDimensions.depth);

            gl.uniform1f(program.uniforms.uAbsorptionCoefficient, this._absorptionCoefficientMC)
            gl.uniform1f(program.uniforms.uMajorant, this._majorant);
            gl.uniform1f(program.uniforms.uRandSeed, Math.random());

            const dimensions = this._lightVolumeDimensions;
            gl.uniform3f(program.uniforms.uSize, dimensions.width, dimensions.height, dimensions.depth);

            const light = this._lightDefinitions[0];
            const lightArr = light.getLightArr();
            gl.uniform4f(program.uniforms.uLight, lightArr[0], lightArr[1], lightArr[2], light.typeToInt());

            gl.drawBuffers([
                gl.COLOR_ATTACHMENT0,
                gl.COLOR_ATTACHMENT1,
                gl.COLOR_ATTACHMENT2,
                gl.COLOR_ATTACHMENT3
            ]);

            gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
        }
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

        gl.uniformMatrix4fv(program.uniforms.uMvpInverseMatrix, false, this._mvpInverseMatrix.m);

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

        const positionBufferSpec = {
            target         : gl.TEXTURE_3D,
            width          : this._volumeDimensions.width,
            height         : this._volumeDimensions.height,
            depth          : this._volumeDimensions.depth,
            min            : gl.NEAREST,
            mag            : gl.NEAREST,
            // format         : gl.RGB,
            // internalFormat : gl.RGB32F,
            format         : gl.RGBA,
            internalFormat : gl.RGBA32F,
            type           : gl.FLOAT,
            wrapS          : gl.CLAMP_TO_EDGE,
            wrapT          : gl.CLAMP_TO_EDGE,
            wrapR          : gl.CLAMP_TO_EDGE,
            storage        : true
        };

        const directionAndTransmittanceBufferSpec = {
            target         : gl.TEXTURE_3D,
            width          : this._volumeDimensions.width,
            height         : this._volumeDimensions.height,
            depth          : this._volumeDimensions.depth,
            min            : gl.NEAREST,
            mag            : gl.NEAREST,
            // format         : gl.RGBA,
            // internalFormat : gl.RGBA32F,
            format         : gl.RGBA,
            internalFormat : gl.RGBA32F,
            type           : gl.FLOAT,
            wrapS          : gl.CLAMP_TO_EDGE,
            wrapT          : gl.CLAMP_TO_EDGE,
            wrapR          : gl.CLAMP_TO_EDGE,
            storage        : true
        };

        const distanceTravelledAndSample = {
            target         : gl.TEXTURE_3D,
            width          : this._volumeDimensions.width,
            height         : this._volumeDimensions.height,
            depth          : this._volumeDimensions.depth,
            min            : gl.NEAREST,
            mag            : gl.NEAREST,
            // format         : gl.RGB,
            // internalFormat : gl.RGB32F,
            format         : gl.RGBA,
            internalFormat : gl.RGBA32F,
            type           : gl.FLOAT,
            wrapS          : gl.CLAMP_TO_EDGE,
            wrapT          : gl.CLAMP_TO_EDGE,
            wrapR          : gl.CLAMP_TO_EDGE,
            storage        : true
        };

        const radianceAndDiffusion = {
            target         : gl.TEXTURE_3D,
            width          : this._volumeDimensions.width,
            height         : this._volumeDimensions.height,
            depth          : this._volumeDimensions.depth,
            min            : gl.LINEAR,
            mag            : gl.LINEAR,
            format         : gl.RG,
            internalFormat : gl.RG32F,
            // format         : gl.RGBA,
            // internalFormat : gl.RGBA32F,
            type           : gl.FLOAT,
            wrapS          : gl.CLAMP_TO_EDGE,
            wrapT          : gl.CLAMP_TO_EDGE,
            wrapR          : gl.CLAMP_TO_EDGE,
            storage        : true
        };

        return [
            positionBufferSpec,
            directionAndTransmittanceBufferSpec,
            distanceTravelledAndSample,
            radianceAndDiffusion
        ];
    }

}