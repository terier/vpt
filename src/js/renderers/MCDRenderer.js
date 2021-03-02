// #package js/main

// #include ../WebGL.js
// #include AbstractRenderer.js

class MCDRenderer extends AbstractRenderer {

    constructor(gl, volume, environmentTexture, options) {
        super(gl, volume, environmentTexture, options);

        Object.assign(this, {
            absorptionCoefficient : 1,
            scatteringCoefficient : 1,
            scatteringBias        : 0,
            majorant              : 2,
            maxBounces            : 8,
            steps                 : 1,
            _nActiveLights        : 0
        }, options);

        this._programs = WebGL.buildPrograms(gl, {
            generate  : SHADERS.MCDGenerate,
            integrate : SHADERS.MCDIntegrate,
            render    : SHADERS.MCDRender,
            reset     : SHADERS.MCDReset
        }, MIXINS);

        this._lightDefinitions = [
            new LightDefinition('distant', [0.8, 0.01, 0.01], true),
            new LightDefinition('point', [0, -0.1, 0.5], true)
        ]
    }

    _setLightTexture() {
        const gl = this._gl;
        if (this._lightsTexture && gl.isTexture(this._lightsTexture)) {
            gl.deleteTexture(this._lightsTexture);
        }

        const lightDefinitionArray = this._getLightDefinitionArray();

        this._lightsTexture = WebGL.createTexture(gl, {
            width          : this._nActiveLights,
            height         : 1,
            data           : new Float32Array(lightDefinitionArray),
            format         : gl.RGBA,
            internalFormat : gl.RGBA32F,
            type           : gl.FLOAT,
            wrapS          : gl.CLAMP_TO_EDGE,
            wrapT          : gl.CLAMP_TO_EDGE,
            min            : gl.NEAREST,
            mag            : gl.NEAREST
        });
    }

    _getLightDefinitionArray() {
        let lightsArray = [];
        let nLights = 0
        for (let i = 0; i < this._lightDefinitions.length; i++) {
            if (!this._lightDefinitions[i].isEnabled())
                continue;
            let lightArray = this._lightDefinitions[i].getLightArr();
            lightsArray.push(lightArray[0], lightArray[1], lightArray[2], this._lightDefinitions[i].typeToInt());
            nLights++;
        }
        this._nActiveLights = nLights;
        return lightsArray;
    }

    destroy() {
        const gl = this._gl;
        Object.keys(this._programs).forEach(programName => {
            gl.deleteProgram(this._programs[programName].program);
        });
        if (this._lightsTexture && gl.isTexture(this._lightsTexture)) {
            gl.deleteTexture(this._lightsTexture);
        }
        super.destroy();
    }

    _resetFrame() {
        const gl = this._gl;

        const program = this._programs.reset;
        gl.useProgram(program.program);

        gl.uniformMatrix4fv(program.uniforms.uMvpInverseMatrix, false, this._mvpInverseMatrix.m);
        gl.uniform2f(program.uniforms.uInverseResolution, 1 / this._bufferSize, 1 / this._bufferSize);
        gl.uniform1f(program.uniforms.uRandSeed, Math.random());
        gl.uniform1f(program.uniforms.uBlur, 0);

        gl.drawBuffers([
            gl.COLOR_ATTACHMENT0,
            gl.COLOR_ATTACHMENT1,
            gl.COLOR_ATTACHMENT2,
            gl.COLOR_ATTACHMENT3
        ]);

        gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
    }

    _generateFrame() {
    }

    _integrateFrame() {
        const gl = this._gl;

        const program = this._programs.integrate;
        gl.useProgram(program.program);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this._accumulationBuffer.getAttachments().color[0]);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, this._accumulationBuffer.getAttachments().color[1]);
        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, this._accumulationBuffer.getAttachments().color[2]);
        gl.activeTexture(gl.TEXTURE3);
        gl.bindTexture(gl.TEXTURE_2D, this._accumulationBuffer.getAttachments().color[3]);

        gl.activeTexture(gl.TEXTURE4);
        gl.bindTexture(gl.TEXTURE_3D, this._volume.getTexture());
        gl.activeTexture(gl.TEXTURE5);
        gl.bindTexture(gl.TEXTURE_2D, this._environmentTexture);
        gl.activeTexture(gl.TEXTURE6);
        gl.bindTexture(gl.TEXTURE_2D, this._transferFunction);

        gl.uniform1i(program.uniforms.uPosition, 0);
        gl.uniform1i(program.uniforms.uDirection, 1);
        gl.uniform1i(program.uniforms.uTransmittance, 2);
        gl.uniform1i(program.uniforms.uRadiance, 3);

        gl.uniform1i(program.uniforms.uVolume, 4);
        gl.uniform1i(program.uniforms.uEnvironment, 5);
        gl.uniform1i(program.uniforms.uTransferFunction, 6);

        gl.uniformMatrix4fv(program.uniforms.uMvpInverseMatrix, false, this._mvpInverseMatrix.m);
        gl.uniform2f(program.uniforms.uInverseResolution, 1 / this._bufferSize, 1 / this._bufferSize);
        gl.uniform1f(program.uniforms.uRandSeed, Math.random());
        gl.uniform1f(program.uniforms.uBlur, 0);

        gl.uniform1f(program.uniforms.uAbsorptionCoefficient, this.absorptionCoefficient);
        gl.uniform1f(program.uniforms.uScatteringCoefficient, this.scatteringCoefficient);
        gl.uniform1f(program.uniforms.uScatteringBias, this.scatteringBias);
        gl.uniform1f(program.uniforms.uMajorant, this.majorant);
        gl.uniform1ui(program.uniforms.uMaxBounces, this.maxBounces);
        gl.uniform1ui(program.uniforms.uSteps, this.steps);

        gl.drawBuffers([
            gl.COLOR_ATTACHMENT0,
            gl.COLOR_ATTACHMENT1,
            gl.COLOR_ATTACHMENT2,
            gl.COLOR_ATTACHMENT3
        ]);

        gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
    }

    _renderFrame() {
        const gl = this._gl;

        const program = this._programs.render;
        gl.useProgram(program.program);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this._accumulationBuffer.getAttachments().color[3]);

        gl.uniform1i(program.uniforms.uColor, 0);

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
