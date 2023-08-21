import { WebGL } from '../WebGL.js';
import { AbstractRenderer } from './AbstractRenderer.js';
import { SingleBuffer } from "../SingleBuffer.js";
import { SingleBuffer3D } from "../SingleBuffer3D.js";
import { DoubleBuffer3D } from "../DoubleBuffer3D.js";

const [ SHADERS, MIXINS ] = await Promise.all([
    'shaders.json',
    'mixins.json',
].map(url => fetch(url).then(response => response.json())));

export class FDORenderer extends AbstractRenderer {
    constructor(gl, volume, environmentTexture, options) {
        super(gl, volume, environmentTexture, options);

        this.registerProperties([
            {
                name: 'extinction',
                label: 'Extinction',
                type: 'spinner',
                value: 100,
                min: 0,
            },
            {
                name: 'extinctionFLD',
                label: 'Extinction (FLD)',
                type: 'spinner',
                value: 100,
                min: 0,
            },
            {
                name: 'albedo',
                label: 'Albedo',
                type: 'spinner',
                value: 0.6,
                min: 0,
                max: 1
            },
            {
                name: 'slices',
                label: 'Slices',
                type: 'spinner',
                value: 500,
                min: 1,
            },
            {
                name: 'light',
                label: 'Light direction',
                type: 'vector',
                value: {x: 1, y: 0, z: 0},
            },
            {
                name: 'SOR',
                label: 'SOR',
                type: 'spinner',
                value: 1,
                min: 0,
                max: 2
            },
            {
                name: 'lightVolumeRatio',
                label: 'Light Volume Ratio',
                type: 'spinner',
                value: 1,
                min: 1,
                step: 1
            },
            {
                name: 'voxelSize',
                label: 'Voxel Size',
                type: 'spinner',
                value: 1
            },
            {
                name: 'epsilon',
                label: 'Epsilon',
                type: 'spinner',
                value: 10e-6,
                min: 0,
                max: 1
            },
            {
                name: 'minExtinction',
                label: 'Min. Extinction',
                type: 'spinner',
                value: 10e-6,
                min: 0,
                max: 1
            },
            {
                name: 'fluxLimiter',
                label: 'Flux Limiter',
                type: "dropdown",
                value: 2,
                options: [
                    {
                        value: 0,
                        label: "Sum"
                    },
                    {
                        value: 1,
                        label: "Max"
                    },
                    {
                        value: 2,
                        label: "Kershaw",
                        selected: true
                    },
                    {
                        value: 3,
                        label: "Levermore–Pomraning"
                    }
                ]
            },
            {
                name: 'volume_view',
                label: 'View',
                value: 3,
                type: "dropdown",
                options: [
                    {
                        value: 0,
                        label: "Color"
                    },
                    {
                        value: 1,
                        label: "Emission"
                    },
                    {
                        value: 2,
                        label: "Fluence",
                    },
                    {
                        value: 3,
                        label: "Flux",
                        selected: true
                    },
                    {
                        value: 4,
                        label: "Residual",
                    },
                    {
                        value: 5,
                        label: "sum_numerator",
                    },
                    {
                        value: 6,
                        label: "sum_denominator",
                    },
                    {
                        value: 7,
                        label: "Result",
                    }
                ]
            },
            {
                name: 'cutplaneX',
                label: 'CutPlane (x)',
                type: 'slider',
                value: 0,
                min: 0,
                max: 1
            },
            {
                name: 'cutplaneY',
                label: 'CutPlane (y)',
                type: 'slider',
                value: 0,
                min: 0,
                max: 1
            },
            {
                name: 'cutplaneZ',
                label: 'CutPlane (z)',
                type: 'slider',
                value: 0,
                min: 0,
                max: 1
            },
            {
                name: 'residual_rms',
                label: 'Residual (RMS)',
                type: 'spinner',
                value: 0,
            },
            {
                name: 'step_by_step_enabled',
                label: 'Step-by-step',
                type: "checkbox",
                value: true,
                checked: true,
            },
            {
                name: 'nextButton',
                label: 'Next Step',
                type: "button",
            },
            {
                name: 'transferFunction',
                label: 'Transfer function',
                type: 'transfer-function',
                value: new Uint8Array(256),
            }
        ]);

        this.addEventListener('change', e => {
            const {name, value} = e.detail;

            if (name === 'transferFunction') {
                this.setTransferFunction(this.transferFunction);
            }

            if (name === 'nextButton') {
                this.step = true;
            }

            if ([
                'extinctionFLD',
                'light',
                'voxelSize',
                'lightVolumeRatio',
                'SOR',
                'albedo',
                'epsilon',
                'minExtinction',
                'fluxLimiter',
                'transferFunction'
                // 'scatteringCoefficient',
                // 'absorptionCoefficient'
            ].includes(name)) {
                this.resetVolume();
            }
        });

        this._programs = WebGL.buildPrograms(gl, SHADERS.renderers.FDO, MIXINS);
        this.red = 1;
    }

    setResidualUIElement() {
        let fields = document.querySelectorAll(".instantiate .field")
        for (const element of fields) {
            let found = false;
            let labels = element.querySelectorAll("label")
            for (const label of labels) {
                if (label.innerText === "Residual (RMS)")
                    found = true;
            }
            if (found)
                this.residualHTMLObject = element.querySelectorAll(".container > .spinner > input")[0];
        }
        console.log(this.residualHTMLObject)
    }

    destroy() {
        const gl = this._gl;
        Object.keys(this._programs).forEach(programName => {
            gl.deleteProgram(this._programs[programName].program);
        });
        this.destroyRCBuffer();
        super.destroy();
    }

    setVolume(volume) {
        this._volume = volume;
        this._initialize3DBuffers();

        this.setResidualUIElement();
    }

    _initialize3DBuffers() {
        if (!this._volume.ready)
            return
        console.log(this._volume)
        console.log("Initializing Buffers")
        console.log(this)
        this.volumeDimensions = this._volume.modalities[0].dimensions;
        this.setLightVolumeDimensions();
        this.setFrameBuffer();
        this.setAccumulationBuffer();
        this.setResidualBuffer();
        this.setRCBuffer();
        this.resetVolume();
    }

    setLightVolumeDimensions() {
        const volumeDimensions = this.volumeDimensions;
        this._lightVolumeDimensions = {
            width: Math.floor(volumeDimensions.width / this.lightVolumeRatio),
            height: Math.floor(volumeDimensions.height / this.lightVolumeRatio),
            depth: Math.floor(volumeDimensions.depth / this.lightVolumeRatio)
        };
        console.log("Light Volume Dimensions: " + this._lightVolumeDimensions.width + " " +
            this._lightVolumeDimensions.height + " " + this._lightVolumeDimensions.depth);
    }

    setFrameBuffer() {
        if (this._frameBuffer) {
            this._frameBuffer.destroy();
        }
        this._frameBuffer = new SingleBuffer3D(this._gl, this._getFrameBufferSpec());
        // console.log(this._accumulationBuffer)
    }

    setAccumulationBuffer() {
        if (this._accumulationBuffer) {
            this._accumulationBuffer.destroy();
        }
        this._accumulationBuffer = new DoubleBuffer3D(this._gl, this._getAccumulationBufferSpec());
        // console.log(this._accumulationBuffer)
        // console.log(this._accumulationBuffer)
    }

    setResidualBuffer() {
        this.destroyResidualBuffer();
        this._residualBuffer = new SingleBuffer3D(this._gl, this._getResidualBufferSpec());
    }

    destroyResidualBuffer() {
        if (this._residualBuffer) {
            this._residualBuffer.destroy();
        }
    }

    setRCBuffer() {
        this.destroyRCBuffer();

        const gl = this._gl
        gl.bindTexture(gl.TEXTURE_3D, this._residualBuffer.getAttachments().color[0]);
        gl.generateMipmap(gl.TEXTURE_3D);

        const max_dimension = Math.max(
            this._lightVolumeDimensions.width, this._lightVolumeDimensions.height, this._lightVolumeDimensions.depth);

        const mipmapLevel = Math.floor(Math.log2(max_dimension));

        this._rcBuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, this._rcBuffer);
        gl.framebufferTextureLayer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, this._residualBuffer.getAttachments().color[0], mipmapLevel, 0);
        const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
        if (status !== gl.FRAMEBUFFER_COMPLETE) {
            throw new Error('Cannot create framebuffer: ' + status);
        }
    }

    destroyRCBuffer() {
        const gl = this._gl;
        if (this._rcBuffer) {
            gl.deleteFramebuffer(this._rcBuffer);
        }
    }

    _rebuildBuffers() {
        this._initialize3DBuffers();
        if (this._renderBuffer) {
            this._renderBuffer.destroy();
        }
        const gl = this._gl;
        this._renderBuffer = new SingleBuffer(gl, this._getRenderBufferSpec());
    }

    render() {
        const gl = this._gl;
        gl.bindBuffer(gl.ARRAY_BUFFER, this._clipQuad);
        gl.enableVertexAttribArray(0); // position always bound to attribute 0
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

        this._frameBuffer.use();
        this._generateFrame();

        if (!this.step_by_step_enabled || this.step) {
            this._accumulationBuffer.use();
            this._integrateFrame();
            this._accumulationBuffer.swap();
            this.step = false;
        }


        this._renderBuffer.use();
        this._renderFrame(this._transferFunction, this.volume_view);
    }

    reset() {
        // this.calculateDepth()
    }

    resetVolume() {
        if (!this._volume.ready || !this._accumulationBuffer)
            return;

        const gl = this._gl;
        gl.bindBuffer(gl.ARRAY_BUFFER, this._clipQuad);
        gl.enableVertexAttribArray(0); // position always bound to attribute 0
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

        this._resetFrame();
    }

    _resetFrame() {
        this._resetEmissionField();
        this._resetFluence();
        this._accumulationBuffer.swap();
    }

    _resetFluence() {
        const gl = this._gl;

        const {program, uniforms} = this._programs.reset;
        gl.useProgram(program);
        const dimensions = this._lightVolumeDimensions;

        gl.bindTexture(gl.TEXTURE_3D, this._frameBuffer.getAttachments().color[0]);
        gl.generateMipmap(gl.TEXTURE_3D);

        for (let i = 0; i < this._lightVolumeDimensions.depth; i++) {
            this._accumulationBuffer.use(i);
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_3D, this._frameBuffer.getAttachments().color[0]);

            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_3D, this._volume.getTexture());
            gl.activeTexture(gl.TEXTURE2);
            gl.bindTexture(gl.TEXTURE_2D, this._transferFunction);

            gl.uniform1i(uniforms.uEmission, 0);
            gl.uniform1i(uniforms.uVolume, 1);
            gl.uniform1i(uniforms.uTransferFunction, 2);
            gl.uniform1f(uniforms.uLayer, (i + 0.5) / this._lightVolumeDimensions.depth);

            gl.uniform1f(uniforms.uVoxelSize, this.voxelSize);
            gl.uniform1f(uniforms.uEpsilon, this.epsilon);

            gl.uniform3f(uniforms.uLight, this.light.x, this.light.y, this.light.z);

            gl.uniform3f(uniforms.uStep, 1 / dimensions.width, 1 / dimensions.height, 1 / dimensions.depth);
            gl.uniform3i(uniforms.uSize, dimensions.width, dimensions.height, dimensions.depth);

            gl.drawBuffers([
                gl.COLOR_ATTACHMENT0,
                gl.COLOR_ATTACHMENT1
            ]);

            gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
        }
    }

    _resetEmissionField() {
        console.log("Resetting Emission Field")
        const gl = this._gl;

        const {program, uniforms} = this._programs.generate;
        gl.useProgram(program);

        for (let i = 0; i < this._lightVolumeDimensions.depth; i++) {
            this._frameBuffer.use(i);

            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_3D, this._volume.getTexture());
            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_2D, this._transferFunction);

            gl.uniform1i(uniforms.uVolume, 0);
            gl.uniform1i(uniforms.uTransferFunction, 1);

            gl.uniform1f(uniforms.uLayer, (i + 0.5) / this._lightVolumeDimensions.depth);
            gl.uniform1f(uniforms.uStepSize, 1 / this.slices);
            gl.uniform1f(uniforms.uExtinction, this.extinction);
            gl.uniform1f(uniforms.uAlbedo, this.albedo);
            gl.uniform3f(uniforms.uLight, this.light.x, this.light.y, this.light.z);

            gl.drawBuffers([
                gl.COLOR_ATTACHMENT0
            ]);

            gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
        }
    }

    _generateFrame() {
    }

    _computeResidual() {
        const gl = this._gl;

        const { program, uniforms } = this._programs.computeResidual;
        gl.useProgram(program);

        for (let i = 0; i < this._lightVolumeDimensions.depth; i++) {
            this._residualBuffer.use(i);

            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_3D, this._accumulationBuffer.getAttachments().color[0]);

            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_3D, this._frameBuffer.getAttachments().color[0]);

            gl.activeTexture(gl.TEXTURE2);
            gl.bindTexture(gl.TEXTURE_3D, this._volume.getTexture());
            gl.activeTexture(gl.TEXTURE3);
            gl.bindTexture(gl.TEXTURE_2D, this._transferFunction);

            gl.uniform1i(uniforms.uFluenceAndDiffCoeff, 0);
            gl.uniform1i(uniforms.uEmission, 1);
            gl.uniform1i(uniforms.uVolume, 2);
            gl.uniform1i(uniforms.uTransferFunction, 3);

            gl.uniform1ui(uniforms.uLayer, i);
            gl.uniform1f(uniforms.uExtinction, this.extinctionFLD);
            gl.uniform1f(uniforms.uAlbedo, this.albedo);
            gl.uniform1f(uniforms.uVoxelSize, this.voxelSize);
            gl.uniform1f(uniforms.uMinExtinction, this.minExtinction);


            gl.drawBuffers([
                gl.COLOR_ATTACHMENT0
            ]);

            gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
        }

        this._computeResidualRMS();
    }

    _computeResidualRMS() {
        const gl = this._gl;

        gl.bindTexture(gl.TEXTURE_3D, this._residualBuffer.getAttachments().color[0]);
        gl.generateMipmap(gl.TEXTURE_3D);

        gl.bindFramebuffer(gl.FRAMEBUFFER, this._rcBuffer);
        gl.viewport(0, 0, this._width, this._height);

        let pixels = new Float32Array(1);
        gl.readPixels(0, 0, 1, 1, gl.RED, gl.FLOAT, pixels);
        pixels[0] = Math.sqrt(pixels[0]);
        this.residualHTMLObject.value = pixels[0];
    }

    _integrateFrame() {
        const gl = this._gl;

        if (this.done) {
            return;
        }

        const {program, uniforms} = this._programs.integrate;
        gl.useProgram(program);
        const dimensions = this._lightVolumeDimensions;

        for (let i = 0; i < this._lightVolumeDimensions.depth; i++) {
            this._accumulationBuffer.use(i);

            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_3D, this._accumulationBuffer.getAttachments().color[0]);

            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_3D, this._frameBuffer.getAttachments().color[0]);

            gl.activeTexture(gl.TEXTURE2);
            gl.bindTexture(gl.TEXTURE_3D, this._volume.getTexture());
            gl.activeTexture(gl.TEXTURE3);
            gl.bindTexture(gl.TEXTURE_2D, this._transferFunction);

            gl.uniform1i(uniforms.uFluenceAndDiffCoeff, 0);
            gl.uniform1i(uniforms.uEmission, 1);
            gl.uniform1i(uniforms.uVolume, 2);
            gl.uniform1i(uniforms.uTransferFunction, 3);

            // gl.uniform1f(uniforms.uAbsorptionCoefficient, this.absorptionCoefficient);
            // gl.uniform1f(uniforms.uScatteringCoefficient, this.scatteringCoefficient);
            gl.uniform1f(uniforms.uExtinction, this.extinctionFLD);
            gl.uniform1f(uniforms.uAlbedo, this.albedo);
            gl.uniform1ui(uniforms.uLayer, i);
            gl.uniform1f(uniforms.uLayerRelative, (i + 0.5) / this._lightVolumeDimensions.depth);
            gl.uniform1f(uniforms.uSOR, this.SOR);
            gl.uniform1ui(uniforms.uRed, this.red);

            gl.uniform1f(uniforms.uVoxelSize, this.voxelSize);
            gl.uniform1f(uniforms.uEpsilon, this.epsilon);

            gl.uniform1ui(uniforms.uFluxLimiter, this.fluxLimiter);
            gl.uniform1f(uniforms.uMinExtinction, this.minExtinction);


            gl.uniform3f(uniforms.uStep, 1 / dimensions.width, 1 / dimensions.height, 1 / dimensions.depth);
            gl.uniform3i(uniforms.uSize, dimensions.width, dimensions.height, dimensions.depth);

            gl.drawBuffers([
                gl.COLOR_ATTACHMENT0,
                gl.COLOR_ATTACHMENT1
            ]);

            gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);

        }
        if (this.red === 1) {
            this.red = 0;
        } else {
            this.red = 1;

            this._computeResidual();
        }
    }

    _renderFrame(transferFunction, volumeView) {
        const gl = this._gl;

        const {program, uniforms} = this._programs.render;
        gl.useProgram(program);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_3D, this._accumulationBuffer.getAttachments().color[0]);

        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_3D, this._volume.getTexture());
        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, transferFunction);

        gl.activeTexture(gl.TEXTURE3);
        gl.bindTexture(gl.TEXTURE_3D, this._frameBuffer.getAttachments().color[0]);

        gl.activeTexture(gl.TEXTURE4);
        gl.bindTexture(gl.TEXTURE_3D, this._residualBuffer.getAttachments().color[0]);

        gl.uniform1i(uniforms.uFluence, 0);
        gl.uniform1i(uniforms.uVolume, 1);
        gl.uniform1i(uniforms.uTransferFunction, 2);
        gl.uniform1i(uniforms.uEmission, 3);
        gl.uniform1i(uniforms.uResidual, 4);

        gl.uniform1f(uniforms.uStepSize, 1 / this.slices);
        gl.uniform1f(uniforms.uExtinction, this.extinction);
        gl.uniform1f(uniforms.uAlbedo, this.albedo);
        gl.uniform1f(uniforms.uOffset, Math.random());

        gl.uniform1ui(uniforms.uView, volumeView);

        gl.uniform3f(uniforms.uCutplane, this.cutplaneX, this.cutplaneY, this.cutplaneZ);

        const mvpit = this.calculateMVPInverseTranspose();
        gl.uniformMatrix4fv(uniforms.uMvpInverseMatrix, false, mvpit.m);

        gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
    }

    _getFrameBufferSpec() {
        const gl = this._gl;

        let emissionField = {
            target: gl.TEXTURE_3D,
            width: this.volumeDimensions.width,
            height: this.volumeDimensions.height,
            depth: this.volumeDimensions.depth,
            // min: gl.LINEAR,
            min: gl.LINEAR_MIPMAP_NEAREST,
            mag: gl.LINEAR,
            format: gl.RED,
            internalFormat: gl.R32F,
            // format         : gl.RGBA,
            // internalFormat : gl.RGBA32F,
            type: gl.FLOAT,
            wrapS: gl.CLAMP_TO_EDGE,
            wrapT: gl.CLAMP_TO_EDGE,
            wrapR: gl.CLAMP_TO_EDGE
        };

        return [
            emissionField
        ];
    }

    _getAccumulationBufferSpec() {
        const gl = this._gl;

        let fluenceBufferSpec = {
            target: gl.TEXTURE_3D,
            width: this.volumeDimensions.width,
            height: this.volumeDimensions.height,
            depth: this.volumeDimensions.depth,
            min: gl.LINEAR,
            mag: gl.LINEAR,
            // format         : gl.RED,
            // internalFormat : gl.R32F,
            // format: gl.RG,
            // internalFormat: gl.RG32F,
            format         : gl.RGBA,
            internalFormat : gl.RGBA32F,
            type: gl.FLOAT,
            wrapS: gl.CLAMP_TO_EDGE,
            wrapT: gl.CLAMP_TO_EDGE,
            wrapR: gl.CLAMP_TO_EDGE,
            storage: true
        };

        return [
            fluenceBufferSpec,
        ];
    }

    _getResidualBufferSpec() {
        const gl = this._gl;

        let residualBufferSpec = {
            target: gl.TEXTURE_3D,
            width: this.volumeDimensions.width,
            height: this.volumeDimensions.height,
            depth: this.volumeDimensions.depth,
            // min: gl.LINEAR,
            min: gl.LINEAR,
            mag: gl.LINEAR,
            format         : gl.RED,
            internalFormat : gl.R32F,
            type: gl.FLOAT,
            wrapS: gl.CLAMP_TO_EDGE,
            wrapT: gl.CLAMP_TO_EDGE,
            wrapR: gl.CLAMP_TO_EDGE,
        };

        return [
            residualBufferSpec,
        ];
    }
}