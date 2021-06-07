// #package js/main

// #include ../WebGL.js
// #include AbstractRenderer.js

class MCDRenderer extends AbstractRenderer {

    constructor(gl, volume, environmentTexture, options) {
        super(gl, volume, environmentTexture, options);

        Object.assign(this, {
            absorptionCoefficient : 80, // 1
            scatteringCoefficient : 20, // 1
            scatteringBias        : 0,
            majorant              : 100, // 2
            maxBounces            : 80, // 8
            steps                 : 20, // 1
            _nActiveLights        : 0,
            counter               : 0,
            _limit                : 0,
            _timer                : 0
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

    setVolume(volume) {
        this._volume = volume;
        this._setLightTexture();
        this.reset();
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

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this._lightsTexture);

        gl.uniform1i(program.uniforms.uLights, 0);

        gl.uniformMatrix4fv(program.uniforms.uMvpInverseMatrix, false, this._mvpInverseMatrix.m);
        gl.uniform2f(program.uniforms.uInverseResolution, 1 / this._bufferSize, 1 / this._bufferSize);
        gl.uniform1f(program.uniforms.uRandSeed, Math.random());
        gl.uniform1f(program.uniforms.uBlur, 0);

        gl.drawBuffers([
            gl.COLOR_ATTACHMENT0,
            gl.COLOR_ATTACHMENT1,
            gl.COLOR_ATTACHMENT2,
            gl.COLOR_ATTACHMENT3,
            gl.COLOR_ATTACHMENT4
        ]);

        gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
        this.counter = 0;
    }

    render() {
        // TODO: put the following logic in VAO
        if (this._limit !== 0) {
            if (this.counter === 0) {
                this.counter += Math.floor(this.steps);
                this._timer = new Date().getTime();
                if (this.counter >= this._limit)
                    console.log("Done!", new Date().getTime() - this._timer)
            }
            else if (this.counter < this._limit) {
                this.counter += Math.floor(this.steps);
                console.log("Counter:", this.counter);
                if (this.counter >= this._limit)
                    console.log("Done!", new Date().getTime() - this._timer)
            }
            else {
                return
            }
        }

        const gl = this._gl;
        gl.bindBuffer(gl.ARRAY_BUFFER, this._clipQuad);
        gl.enableVertexAttribArray(0); // position always bound to attribute 0
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

        this._frameBuffer.use();
        this._generateFrame();

        this._accumulationBuffer.use();
        this._integrateFrame();
        this._accumulationBuffer.swap();

        this._renderBuffer.use();
        this._renderFrame();
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
        gl.bindTexture(gl.TEXTURE_2D, this._accumulationBuffer.getAttachments().color[4]);

        gl.activeTexture(gl.TEXTURE5);
        gl.bindTexture(gl.TEXTURE_3D, this._volume.getTexture());
        gl.activeTexture(gl.TEXTURE6);
        gl.bindTexture(gl.TEXTURE_2D, this._lightsTexture);
        gl.activeTexture(gl.TEXTURE7);
        gl.bindTexture(gl.TEXTURE_2D, this._transferFunction);

        gl.uniform1i(program.uniforms.uPosition, 0);
        gl.uniform1i(program.uniforms.uDirection, 1);
        gl.uniform1i(program.uniforms.uTransmittance, 2);
        gl.uniform1i(program.uniforms.uRadiance, 3);
        gl.uniform1i(program.uniforms.uLightDirection, 4);

        gl.uniform1i(program.uniforms.uVolume, 5);
        gl.uniform1i(program.uniforms.uLights, 6);
        gl.uniform1i(program.uniforms.uTransferFunction, 7);

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
        gl.uniform1ui(program.uniforms.uNLights, this._nActiveLights);

        gl.drawBuffers([
            gl.COLOR_ATTACHMENT0,
            gl.COLOR_ATTACHMENT1,
            gl.COLOR_ATTACHMENT2,
            gl.COLOR_ATTACHMENT3,
            gl.COLOR_ATTACHMENT4
        ]);

        gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
    }

    _renderFrame() {
        const gl = this._gl;
        // if (this._limit !== 0 && this.counter >= this._limit + 1) {
        //     return
        // }
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

        const lightDirBufferSpec = {
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
            radianceBufferSpec,
            lightDirBufferSpec
        ];
    }

}
