// #package js/main

// #include ../WebGL.js
// #include AbstractRenderer.js
// #include ../LightVolume.js

class FCNRenderer extends AbstractRenderer {

    constructor(gl, volume, environmentTexture, options) {
        super(gl, volume, environmentTexture, options);
        Object.assign(this, {
            _lightDefinitions           : [],
            _stepSize                   : 0.00333,
            _alphaCorrection            : 100,
            _absorptionCoefficient      : 0.5,
            _scattering                 : 0.5,
            _lightVolumeRatio           : 1,
            _convectionLimit            : 0,
            _convectionSteps            : 5,
            _lightToggling              : 1,
            _localSizeX                 : 16,
            _localSizeY                 : 16,
            _localSizeZ                 : 4,
            _timer                      : 0
        }, options);

        this._programs = WebGL.buildPrograms(this._gl, {
            generate  : SHADERS.FCNGenerate,
            integrate : SHADERS.FCNIntegrate,
            render    : SHADERS.FCNRender,
            reset     : SHADERS.FCNReset
        }, MIXINS);

        console.log(this._programs);

        this._lightDefinitions = [
            new LightDefinition('distant', [0.05,0.05,0.05], true),
            new LightDefinition('point', [0.9,0.5,0.4], false)
        ]

        if (this._volume.ready) {
            this._initVolume();
        }
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


    setVolume(volume) {
        this._volume = volume;
        this._initVolume();
        this.reset();
    }

    _initVolume() {
        const volumeDimensions = this._volume.getDimensions('default');
        this._volumeDimensions = volumeDimensions;
        console.log("Volume Dimensions: " + volumeDimensions.width + " " + volumeDimensions.height + " " + volumeDimensions.depth)
        this._setLightVolumeDimensions();
        this._setAccumulationBuffer();
        this._resetLightVolume();
        this.counter = 0;
    }

    _setAccumulationBuffer() {
        this._accumulationBuffer = new DoubleBuffer3D(this._gl, this._getAccumulationBufferSpec());
        console.log(this._accumulationBuffer)
    }

    _setLightVolumeDimensions() {
        const volumeDimensions = this._volumeDimensions;
        this._lightVolumeDimensions = {
            width: Math.floor(volumeDimensions.width / this._lightVolumeRatio),
            height: Math.floor(volumeDimensions.height / this._lightVolumeRatio),
            depth: Math.floor(volumeDimensions.depth / this._lightVolumeRatio)
        };
        console.log("Light Volume Dimensions: " + this._lightVolumeDimensions.width + " " +
            this._lightVolumeDimensions.height + " " + this._lightVolumeDimensions.depth);
    }

    _resetLightVolume() {
        console.log("Reset Light Volume")
        const gl = this._gl;
        let lightDefinition = this._lightDefinitions[0];
        let readLight = this._accumulationBuffer.getReadAttachments().color[0];
        lightDefinition.light = LightTexture.resetLight(gl, lightDefinition.light[0], lightDefinition.light[1], lightDefinition.light[2],
            this._lightVolumeDimensions, readLight, lightDefinition.type);
        let writeLight = this._accumulationBuffer.getWriteAttachments().color[0];
        lightDefinition.light = LightTexture.resetLight(gl, lightDefinition.light[0], lightDefinition.light[1], lightDefinition.light[2],
            this._lightVolumeDimensions, writeLight, lightDefinition.type);
        // console.log(lightDefinition)

        this.counter = 0;
    }

    destroy() {
        const gl = this._gl;
        Object.keys(this._programs).forEach(programName => {
            gl.deleteProgram(this._programs[programName].program);
        });
        super.destroy();
    }

    _resetFrame() {}

    _generateFrame() {}

    _integrateFrame() {
        const gl = this._gl;

        const program = this._programs.integrate;
        gl.useProgram(program.program);

        for (let i = 0; i < this._lightVolumeDimensions.depth; i++) {
            this._accumulationBuffer.use(i);
            // console.log(gl.getParameter(gl.FRAMEBUFFER_BINDING))

            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_3D, this._accumulationBuffer.getAttachments().color[0]);

            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_3D, this._accumulationBuffer.getAttachments().color[1]);

            gl.activeTexture(gl.TEXTURE2);
            gl.bindTexture(gl.TEXTURE_3D, this._volume.getTexture());

            gl.activeTexture(gl.TEXTURE3);
            gl.bindTexture(gl.TEXTURE_2D, this._transferFunction);

            gl.uniform1i(program.uniforms.uEnergyDensity, 0);
            gl.uniform1i(program.uniforms.uDiffusion, 1);
            gl.uniform1i(program.uniforms.uVolume, 2);
            gl.uniform1i(program.uniforms.uTransferFunction, 3);



            const dimensions = this._lightVolumeDimensions;

            gl.uniform3f(program.uniforms.uSize, 1 / dimensions.width, 1 / dimensions.height, 1 / dimensions.depth);

            const lightDirection = this._lightDefinitions[0].light;
            gl.uniform3fv(program.uniforms.uLight, lightDirection);
            gl.uniform1f(program.uniforms.uAbsorptionCoefficient, this._absorptionCoefficient)
            gl.uniform1i(program.uniforms.uSteps, Math.floor(this._convectionSteps));
            gl.uniform1f(program.uniforms.uRatio, Math.floor(this._lightVolumeRatio));
            gl.uniform1f(program.uniforms.uLayer, (i + 0.5) / this._lightVolumeDimensions.depth);
            gl.uniform1f(program.uniforms.uScattering, this._scattering);
            gl.drawBuffers([
                gl.COLOR_ATTACHMENT0,
                gl.COLOR_ATTACHMENT1
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
        gl.bindTexture(gl.TEXTURE_3D, this._accumulationBuffer.getAttachments().color[0]);
        gl.activeTexture(gl.TEXTURE3);
        gl.bindTexture(gl.TEXTURE_3D, this._accumulationBuffer.getAttachments().color[1]);

        gl.uniform1i(program.uniforms.uVolume, 0);
        gl.uniform1i(program.uniforms.uTransferFunction, 1);
        gl.uniform1i(program.uniforms.uEnergyDensity, 2);
        gl.uniform1i(program.uniforms.uDiffusion, 3);
        gl.uniform1f(program.uniforms.uStepSize, this._stepSize);
        gl.uniform1f(program.uniforms.uAlphaCorrection, this._alphaCorrection);
        gl.uniform1f(program.uniforms.uOffset, Math.random());
        gl.uniformMatrix4fv(program.uniforms.uMvpInverseMatrix, false, this._mvpInverseMatrix.m);

        // gl.drawBuffers([
        //     gl.COLOR_ATTACHMENT0
        // ]);

        gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
    }

    _getProgramFromLightType(index) {
        switch(this._lightVolumes[index].getType()) {
            case 'distant': return this._programs.convection;
            case 'point': return this._programs.convectionPL;
        }
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
        const convectionBufferSpec = {
            target         : gl.TEXTURE_3D,
            width          : this._volumeDimensions.width,
            height         : this._volumeDimensions.height,
            depth          : this._volumeDimensions.depth,
            min            : gl.LINEAR,
            mag            : gl.LINEAR,
            format         : gl.RED,
            internalFormat : gl.R32F,
            type           : gl.FLOAT,
            wrapS          : gl.CLAMP_TO_EDGE,
            wrapT          : gl.CLAMP_TO_EDGE,
            wrapR          : gl.CLAMP_TO_EDGE,
            storage        : true
        };

        const diffusionBufferSpec = {
            target         : gl.TEXTURE_3D,
            width          : this._volumeDimensions.width,
            height         : this._volumeDimensions.height,
            depth          : this._volumeDimensions.depth,
            min            : gl.LINEAR,
            mag            : gl.LINEAR,
            format         : gl.RED,
            internalFormat : gl.R32F,
            type           : gl.FLOAT,
            wrapS          : gl.CLAMP_TO_EDGE,
            wrapT          : gl.CLAMP_TO_EDGE,
            wrapR          : gl.CLAMP_TO_EDGE,
            storage        : true
        };

        return [convectionBufferSpec, diffusionBufferSpec];
    }

}
