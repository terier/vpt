import { WebGL } from '../WebGL.js';
import { AbstractRenderer } from './AbstractRenderer.js';
import { SingleBuffer } from "../SingleBuffer.js";
import { SingleBuffer3D } from "../SingleBuffer3D.js";
import { DoubleBuffer3D } from "../DoubleBuffer3D.js";
import { CommonUtils } from '../utils/CommonUtils.js';
import { Matrix } from '../math/Matrix.js';

const [ SHADERS, MIXINS ] = await Promise.all([
    'shaders.json',
    'mixins.json',
].map(url => fetch(url).then(response => response.json())));

export class FLDRenderer extends AbstractRenderer {

constructor(gl, volume, environmentTexture, options) {
    super(gl, volume, environmentTexture, options);

    this._bloomTransferFunction = WebGL.createTexture(gl, {
        width  : 2,
        height : 1,
        data   : new Uint8Array([255, 0, 0, 0, 255, 0, 0, 255]),
        wrapS  : gl.CLAMP_TO_EDGE,
        wrapT  : gl.CLAMP_TO_EDGE,
        min    : gl.LINEAR,
        mag    : gl.LINEAR,
    });

    this.registerProperties([
        {
            name: 'extinction',
            label: 'Extinction',
            type: 'spinner',
            value: 100,
            min: 0,
        },
        {
            name: 'albedo',
            label: 'Albedo',
            type: 'spinner',
            value: 1,
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
            value: { x: 1, y: 0, z: 0 },
        },
        // {
        //     name: 'scatteringCoefficient',
        //     label: 'Scattering Coefficient',
        //     type: 'spinner',
        //     value: 0.1,
        //     min: 0,
        //     max: 1
        // },
        // {
        //     name: 'absorptionCoefficient',
        //     label: 'Absorption Coefficient',
        //     type: 'spinner',
        //     value: 1,
        //     min: 0,
        // },
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
            type: 'slider',
            value: 1,
            min: 0.1,
            max: 2
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
            value: 10e-5,
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
                    label: "Fluence"
                },
                {
                    value: 3,
                    label: "Result",
                    selected: true
                }
            ]
        },
        {
            name: 'deff_rendering_panel',
            label: 'Deferred Rendering',
            type: "accordion",
            contracted: false,
            children: [
                {
                    name: 'deferred_enabled',
                    label: 'Deferred Rendering',
                    type: "checkbox",
                    value: true,
                    checked: true,
                },
                {
                    name: 'deferred_view',
                    label: 'Deferred View',
                    value: 7,
                    type: "dropdown",
                    options: [
                        {
                            value: 0,
                            label: "Color"
                        },
                        {
                            value: 1,
                            label: "Lighting"
                        },
                        {
                            value: 2,
                            label: "Result",
                            selected: true
                        },
                        {
                            value: 3,
                            label: "Bloom",
                        },
                        {
                            value: 4,
                            label: "Bloom * Light",
                        },
                        {
                            value: 5,
                            label: "Depth",
                        },
                        {
                            value: 6,
                            label: "Ambient Occlusion",
                        },
                        {
                            value: 7,
                            label: "Result with AO",
                        }
                    ]
                },
                {
                    name: 'smart_denoise',
                    label: 'Smart De-Noise',
                    type: "checkbox",
                    value: false,
                    checked: false,
                },
            ]
        },
        {
            name: 'bloom_rendering_panel',
            label: 'Bloom',
            type: "accordion",
            contracted: true,
            children: [
                {
                    name: 'bloom',
                    label: 'Bloom',
                    type: "checkbox",
                    value: false,
                    checked: false,
                },
                {
                    name: 'bloomBase',
                    label: 'Bloom Base',
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
                            label: "Fluence"
                        },
                        {
                            value: 3,
                            label: "Result",
                            selected: true
                        }
                    ]
                },
                {
                    name: 'preExposure',
                    label: 'Pre-Exposure',
                    type: "slider",
                    value: 1,
                    min: 0,
                    max: 5
                },
                {
                    name: 'postExposure',
                    label: 'Post-Exposure',
                    type: "slider",
                    value: 1,
                    min: 0,
                    max: 5
                },
                {
                    name: 'bloomIntensity',
                    label: 'Bloom Intensity',
                    type: "slider",
                    value: 0.7,
                    min: 0,
                    max: 2
                },
                {
                    name: 'bloomThreshold',
                    label: 'Bloom Threshold',
                    type: "slider",
                    value: 1.5,
                    min: 0,
                    max: 5
                },
                {
                    name: 'bloomKnee',
                    label: 'Bloom Knee',
                    type: "slider",
                    value: 0.9,
                    min: 0,
                    max: 1
                },
                {
                    name: 'bloomTransferFunction',
                    label: 'Bloom transfer function',
                    type: 'transfer-function',
                    value: new Uint8Array(256),
                }
            ]
        },
        {
            name: 'ambient_occlusion_panel',
            label: 'Ambient Occlusion',
            type: 'accordion',
            children: [
                {
                    name: 'ao_enabled',
                    label: 'Ambient Occlusion',
                    type: 'checkbox',
                    value: true,
                    checked: true,
                },
                {
                    name: 'ao_samples',
                    label: 'AO Samples',
                    type: 'spinner',
                    value: 10,
                    min: 0
                },
                {
                    name: 'ao_radius',
                    label: 'AO Radius',
                    type: 'spinner',
                    value: 0.005,
                    min: 0
                },
                {
                    name: 'ao_threshold',
                    label: 'AO Threshold',
                    type: 'slider',
                    value: 0.15,
                    min: 0,
                    max: 1
                },
                {
                    name: 'ao_bias',
                    label: 'AO Bias',
                    type: 'spinner',
                    value: 0.025,
                    min: 0,
                    max: 1
                },
            ]
        },
        {
            name: 'render_gradient_rendering_panel',
            label: 'Render Gradient',
            type: "accordion",
            contracted: true,
            children: [
                {
                    name: 'renderGradient',
                    label: 'Render Gradient',
                    type: "checkbox",
                    value: false,
                    checked: false,
                },
                {
                    name: 'gradientFactor',
                    label: 'Gradient Factor',
                    type: "spinner",
                    value: 1,
                    min: 0,
                },
                {
                    name: 'metallic',
                    label: 'Metallic',
                    type: "slider",
                    value: 0,
                    min: 0,
                    max: 1
                },
                {
                    name: 'f90',
                    label: 'f90',
                    type: "color-chooser",
                    value: "#ffffff",
                },
                {
                    name: 'specularWeight',
                    label: 'Specular Weight',
                    type: "slider",
                    value: 1.0,
                    min: 0,
                    max: 1,
                },
                {
                    name: 'alphaRoughness',
                    label: 'Alpha Roughness',
                    type: "slider",
                    value: 0.08,
                    min: 0,
                    max: 1,
                    step: 0.05
                },
            ]
        },
        {
            name: 'transferFunction',
            label: 'Transfer function',
            type: 'transfer-function',
            value: new Uint8Array(256),
        }
    ]);

    this.addEventListener('change', e => {
        const { name, value } = e.detail;

        if (name === 'transferFunction') {
            this.setTransferFunction(this.transferFunction);
        }

        if ([
            'extinction',
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

        if (name === 'deferred_enabled') {
            this._checkDeferredRendering();
        }

        if (name === 'ao_enabled') {
            this._checkAmbientOcclusion();
        }

        if (name === 'bloomTransferFunction') {
            this.setBloomTransferFunction(this.bloomTransferFunction);
        }
    });

    this._programs = WebGL.buildPrograms(gl, SHADERS.renderers.FLD, MIXINS);
    this.red = 1;
}

destroy() {
    const gl = this._gl;
    if (this._defferedRenderBuffer) {
        this._destroyDeferredRenderBuffer()
    }
    if (this._ambientOcclusionBuffer) {
        this._ambientOcclusionBuffer.destroy();
    }
    if (this._bloomBaseBuffer) {
        this._bloomBaseBuffer.destroy();
    }
    Object.keys(this._programs).forEach(programName => {
        gl.deleteProgram(this._programs[programName].program);
    });
    this._destroyBloomBuffers();
    super.destroy();
}

setVolume(volume) {
    this._volume = volume;
    if (this.deferred_enabled)
        this._buildDeferredRenderBuffer();
    this._initialize3DBuffers();
}

setBloomTransferFunction(transferFunction) {
    const gl = this._gl;
    gl.bindTexture(gl.TEXTURE_2D, this._bloomTransferFunction);
    gl.texImage2D(gl.TEXTURE_2D, 0,
        gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, transferFunction);
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
}

_rebuildBuffers() {
    this._initialize3DBuffers();
    if (this._renderBuffer) {
        this._renderBuffer.destroy();
    }
    if (this._defferedRenderBuffer) {
        this._destroyDeferredRenderBuffer();
    }
    // if (this._ambientOcclusionBuffer) {
    //     this._destroyAmbientOcclusionBuffer()
    // }
    const gl = this._gl;
    this._renderBuffer = new SingleBuffer(gl, this._getRenderBufferSpec());
    this._checkDeferredRendering();
    // this._checkAmbientOcclusion();
    this._buildBloomBuffers();
}

_buildDeferredRenderBuffer() {
    const gl = this._gl;
    this._defferedRenderBuffer = new SingleBuffer(gl, this._getDeferredRenderBufferSpec());
}

_destroyDeferredRenderBuffer() {
    this._defferedRenderBuffer.destroy();
    this._defferedRenderBuffer = null;
}

_buildAmbientOcclusionBuffer() {
    const gl = this._gl;
    this._ambientOcclusionBuffer = new SingleBuffer(gl, this._getAmbientOcclusionBufferSpec());
}

_destroyAmbientOcclusionBuffer() {
    this._ambientOcclusionBuffer.destroy();
    this._ambientOcclusionBuffer = null;
}

_checkDeferredRendering() {
    if (this.deferred_enabled && !this._defferedRenderBuffer)
        this._buildDeferredRenderBuffer();
    else if (!this.deferred_enabled && this._defferedRenderBuffer)
        this._destroyDeferredRenderBuffer();

    // this._checkAmbientOcclusion();
}

_checkAmbientOcclusion() {
    if (this.ao_enabled && this.deferred_enabled && !this._ambientOcclusionBuffer)
        this._buildAmbientOcclusionBuffer();
    else if ((!this.ao_enabled || !this.deferred_enabled) && this._ambientOcclusionBuffer)
        this._destroyAmbientOcclusionBuffer();
}

_buildBloomBuffers() {
    const gl = this._gl;

    if (this._bloomBaseBuffer) {
        this._bloomBaseBuffer.destroy();
    }
    this._bloomBaseBuffer = new SingleBuffer(gl, this._getBloomBaseBufferSpec());
    this._createBloomBuffers();
}

render() {
    const gl = this._gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, this._clipQuad);
    gl.enableVertexAttribArray(0); // position always bound to attribute 0
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    this._frameBuffer.use();
    this._generateFrame();

    this._accumulationBuffer.use();
    this._integrateFrame();
    this._accumulationBuffer.swap();

    if (this.deferred_enabled) {
        this._deferredRenderFrame(this._transferFunction);
        if (!this.bloom) {
            this._renderBuffer.use();
            this._combineRenderFrame();
        }
        else {
            this._bloomBaseBuffer.use();
            this._renderFrame(this._bloomTransferFunction, this.bloomBase);
            this._renderBright();
            this._renderBloom();
            this._renderBuffer.use();
            this._combineBloomRenderFrame();
        }
    } else {
        this._renderBuffer.use();
        if (this.renderGradient) {
            this._renderFrameGradient();
        }
        else {
            this._renderFrame(this._transferFunction, this.volume_view);
        }

    }
}

reset() { }

resetVolume() {
    if (!this._volume.ready || !this._accumulationBuffer)
        return;

    const gl = this._gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, this._clipQuad);
    gl.enableVertexAttribArray(0); // position always bound to attribute 0
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    this._accumulationBuffer.use();
    this._resetFrame();
    this._accumulationBuffer.swap();
}

_resetFrame() {
    this._resetEmissionField();
    this._resetFluence();
}

_resetFluence() {
    const gl = this._gl;

    const { program, uniforms } = this._programs.reset;
    gl.useProgram(program);
    const dimensions = this._lightVolumeDimensions;

    // gl.bindTexture(gl.TEXTURE_3D, this._frameBuffer.getAttachments().color[0]);
    // gl.generateMipmap(gl.TEXTURE_3D);

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
        // gl.uniform3i(uniforms.uSize, dimensions.width, dimensions.height, dimensions.depth);

        gl.drawBuffers([
            gl.COLOR_ATTACHMENT0
        ]);

        gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
    }
}

_resetEmissionField() {
    console.log("Resetting Emission Field")
    const gl = this._gl;

    const { program, uniforms } = this._programs.generate;
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
        gl.uniform3f(uniforms.uLight, this.light.x, this.light.y, this.light.z);

        gl.drawBuffers([
            gl.COLOR_ATTACHMENT0
        ]);

        gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
    }
}

_generateFrame() {
}

_integrateFrame() {
    const gl = this._gl;

    const { program, uniforms } = this._programs.integrate;
    gl.useProgram(program);
    const dimensions = this._lightVolumeDimensions;

    // gl.bindTexture(gl.TEXTURE_3D, this._accumulationBuffer.getAttachments().color[0]);
    // gl.generateMipmap(gl.TEXTURE_3D);

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

        gl.uniform1i(uniforms.uFluence, 0);
        gl.uniform1i(uniforms.uEmission, 1);
        gl.uniform1i(uniforms.uVolume, 2);
        gl.uniform1i(uniforms.uTransferFunction, 3);

        // gl.uniform1f(uniforms.uAbsorptionCoefficient, this.absorptionCoefficient);
        // gl.uniform1f(uniforms.uScatteringCoefficient, this.scatteringCoefficient);
        gl.uniform1f(uniforms.uExtinction, this.extinction);
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
        gl.uniform3ui(uniforms.uSize, dimensions.width, dimensions.height, dimensions.depth);

        gl.drawBuffers([
            gl.COLOR_ATTACHMENT0
        ]);

        gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);

    }
    if (this.red === 1) {
        this.red = 0;
    }
    else {
        this.red = 1;
    }
}

_renderFrame(transferFunction, volumeView) {
    const gl = this._gl;

    const { program, uniforms } = this._programs.render;
    gl.useProgram(program);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_3D, this._accumulationBuffer.getAttachments().color[0]);

    // debug
    // gl.bindTexture(gl.TEXTURE_3D, this._frameBuffer.getAttachments().color[0]);
    //
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_3D, this._volume.getTexture());
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, transferFunction);

    gl.activeTexture(gl.TEXTURE3);
    gl.bindTexture(gl.TEXTURE_3D, this._frameBuffer.getAttachments().color[0]);

    gl.uniform1i(uniforms.uFluence, 0);
    gl.uniform1i(uniforms.uVolume, 1);
    gl.uniform1i(uniforms.uTransferFunction, 2);
    gl.uniform1i(uniforms.uEmission, 3);

    gl.uniform1f(uniforms.uStepSize, 1 / this.slices);
    gl.uniform1f(uniforms.uExtinction, this.extinction);
    gl.uniform1f(uniforms.uAlbedo, this.albedo);
    gl.uniform1f(uniforms.uOffset, Math.random());

    gl.uniform1ui(uniforms.uView, volumeView);

    gl.uniform1f(uniforms.uExposure, this.preExposure);


    gl.uniform1i(uniforms.uAOEnabled, this.ao_enabled);
    gl.uniform1i(uniforms.uAOSamples, this.ao_samples);
    gl.uniform1f(uniforms.uAORadius, this.ao_radius);
    gl.uniform1f(uniforms.uAORandSeed, 42);

    const mvpit = this.calculateMVPInverseTranspose();
    gl.uniformMatrix4fv(uniforms.uMvpInverseMatrix, false, mvpit.m);

    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
}

_renderFrameGradient() {
    const gl = this._gl;

    const { program, uniforms } = this._programs.render_gradient;
    gl.useProgram(program);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_3D, this._accumulationBuffer.getAttachments().color[0]);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_3D, this._volume.getTexture());
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, this._transferFunction);

    gl.activeTexture(gl.TEXTURE3);
    gl.bindTexture(gl.TEXTURE_3D, this._frameBuffer.getAttachments().color[0]);

    gl.uniform1i(uniforms.uFluence, 0);
    gl.uniform1i(uniforms.uVolume, 1);
    gl.uniform1i(uniforms.uTransferFunction, 2);
    gl.uniform1i(uniforms.uEmission, 3);

    gl.uniform1f(uniforms.uStepSize, 1 / this.slices);
    gl.uniform1f(uniforms.uExtinction, this.extinction);
    gl.uniform1f(uniforms.uAlbedo, this.albedo);
    gl.uniform1f(uniforms.uOffset, Math.random());

    gl.uniform1ui(uniforms.uView, this.volume_view);

    gl.uniform1f(uniforms.uGradientFactor, this.gradientFactor);

    gl.uniform3f(uniforms.uLight, this.light.x, this.light.y, this.light.z);
    gl.uniform1f(uniforms.uSpecularWeight, this.specularWeight);
    gl.uniform1f(uniforms.uAlphaRoughness, this.alphaRoughness);
    gl.uniform1f(uniforms.uMetallic, this.metallic);
    gl.uniform3fv(uniforms.uF90, CommonUtils.hex2rgb(this.f90));

    const mvpit = this.calculateMVPInverseTranspose();
    gl.uniformMatrix4fv(uniforms.uMvpInverseMatrix, false, mvpit.m);

    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
}

_calculateMV() {
    const mv = new Matrix();
    mv.multiply(this.viewMatrix, this.modelMatrix);
    return mv;
}

_deferredRenderFrame(transferFunction) {
    const gl = this._gl;

    this._defferedRenderBuffer.use()

    const { program, uniforms } = this._programs.deferred_render;
    gl.useProgram(program);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_3D, this._accumulationBuffer.getAttachments().color[0]);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_3D, this._volume.getTexture());
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, transferFunction);

    gl.activeTexture(gl.TEXTURE3);
    gl.bindTexture(gl.TEXTURE_3D, this._frameBuffer.getAttachments().color[0]);

    gl.uniform1i(uniforms.uFluence, 0);
    gl.uniform1i(uniforms.uVolume, 1);
    gl.uniform1i(uniforms.uTransferFunction, 2);
    gl.uniform1i(uniforms.uEmission, 3);

    gl.uniform1f(uniforms.uStepSize, 1 / this.slices);
    gl.uniform1f(uniforms.uExtinction, this.extinction);
    gl.uniform1f(uniforms.uAlbedo, this.albedo);
    gl.uniform1f(uniforms.uOffset, Math.random());

    gl.uniform1i(uniforms.uAOEnabled, this.ao_enabled);
    gl.uniform1f(uniforms.uAOThreshold, this.ao_threshold);

    gl.uniform1ui(uniforms.uView, this.volume_view);

    const mvpit = this.calculateMVPInverseTranspose();
    gl.uniformMatrix4fv(uniforms.uMvpInverseMatrix, false, mvpit.m);

    const mv = this._calculateMV();
    gl.uniformMatrix4fv(uniforms.uMvMatrix, false, mv.m);

    gl.drawBuffers([
        gl.COLOR_ATTACHMENT0,
        gl.COLOR_ATTACHMENT1,
        gl.COLOR_ATTACHMENT2
    ]);

    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
}

_combineRenderFrame() {
    const gl = this._gl;

    const { program, uniforms } = this._programs.combine_render;
    gl.useProgram(program);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this._defferedRenderBuffer.getAttachments().color[0]);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this._defferedRenderBuffer.getAttachments().color[1]);
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, this._defferedRenderBuffer.getAttachments().color[2]);

    gl.uniform1i(uniforms.uColor, 0);
    gl.uniform1i(uniforms.uLighting, 1);
    gl.uniform1i(uniforms.uDepth, 2);

    gl.uniform1i(uniforms.uSmartDeNoise, this.smart_denoise);
    gl.uniform1f(uniforms.uSigma, 1);
    gl.uniform1f(uniforms.uKSigma, 1);
    gl.uniform1f(uniforms.uTreshold, 1);

    gl.uniform1ui(uniforms.uDeferredView, this.deferred_view);

    gl.uniform1i(uniforms.uAOEnabled, this.ao_enabled);
    gl.uniform1i(uniforms.uAOSamples, this.ao_samples);
    gl.uniform1f(uniforms.uAORadius, this.ao_radius);
    gl.uniform1f(uniforms.uAORandSeed, 42);
    gl.uniform1f(uniforms.uAODepthBias, this.ao_bias);

    // const mvp = this._calculateMVP();
    // gl.uniformMatrix4fv(uniforms.uMvpMatrix, false, mvp.m);

    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
}

_renderBright() {
    const gl = this._gl;

    this.bloomBuffers[0].use()

    // this._renderBuffer.use();

    const { program, uniforms } = this._programs.renderBright;
    gl.useProgram(program);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this._bloomBaseBuffer.getAttachments().color[0]);
    gl.uniform1i(uniforms.uColor, 0);

    gl.uniform1f(uniforms.uBloomThreshold, this.bloomThreshold);
    gl.uniform1f(uniforms.uBloomKnee, this.bloomKnee);

    // gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);

}

_renderBloom() {
    const gl = this._gl;

    const levels = this.bloomBuffers.length;

    for (let i = 1; i < levels; i++) {
        this.bloomBuffers[i].use()

        const { program, uniforms } = this._programs.downsampleAndBlur;
        gl.useProgram(program);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.bloomBuffers[i - 1].getAttachments().color[0]);
        gl.uniform1i(uniforms.uColor, 0);

        // gl.drawArrays(gl.TRIANGLES, 0, 3);
        gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
    }

    gl.enable(gl.BLEND);
    gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE, gl.ONE, gl.ZERO);

    for (let i = levels - 2; i >= 0; i--) {
        this.bloomBuffers[i].use()

        const { program, uniforms } = this._programs.upsampleAndCombine;
        gl.useProgram(program);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.bloomBuffers[i + 1].getAttachments().color[0]);
        gl.uniform1i(uniforms.uColor, 0);

        gl.uniform1f(uniforms.uBloomIntensity, this.bloomIntensity);

        // gl.drawArrays(gl.TRIANGLES, 0, 3);
        gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
    }

    // gl.blendFuncSeparate(gl.ONE, gl.ONE, gl.ONE, gl.ZERO);
    //
    // this.bloomBuffers[0].use();
    //
    // const { program, uniforms } = this._programs.upsampleAndCombine;
    // gl.useProgram(program);
    //
    // gl.activeTexture(gl.TEXTURE0);
    // gl.bindTexture(gl.TEXTURE_2D, this._bloomBaseBuffer.getAttachments().color[0]);
    // gl.uniform1i(uniforms.uColor, 0);
    //
    // gl.uniform1f(uniforms.uBloomIntensity, 1);
    //
    // // gl.drawArrays(gl.TRIANGLES, 0, 3);
    // gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
    //
    gl.disable(gl.BLEND);
}

_combineBloomRenderFrame() {
    const gl = this._gl;

    const { program, uniforms } = this._programs.renderToCanvas;
    gl.useProgram(program);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this._defferedRenderBuffer.getAttachments().color[0]);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this._defferedRenderBuffer.getAttachments().color[1]);
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, this.bloomBuffers[0].getAttachments().color[0]);

    gl.uniform1i(uniforms.uColor, 0);
    gl.uniform1i(uniforms.uLighting, 1);
    gl.uniform1i(uniforms.uBloom, 2);

    gl.uniform1i(uniforms.uSmartDeNoise, this.smart_denoise);
    gl.uniform1f(uniforms.uSigma, 1);
    gl.uniform1f(uniforms.uKSigma, 1);
    gl.uniform1f(uniforms.uTreshold, 1);

    gl.uniform1f(uniforms.uExposure, this.postExposure);

    gl.uniform1ui(uniforms.uDeferredView, this.deferred_view);

    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
}

_getFrameBufferSpec() {
    const gl = this._gl;

    let emissionField = {
        target         : gl.TEXTURE_3D,
        width          : this.volumeDimensions.width,
        height         : this.volumeDimensions.height,
        depth          : this.volumeDimensions.depth,
        min            : gl.LINEAR,
        mag            : gl.LINEAR,
        // min            : gl.LINEAR_MIPMAP_LINEAR,
        // mag            : gl.LINEAR,
        format         : gl.RED,
        internalFormat : gl.R32F,
        // format         : gl.RGBA,
        // internalFormat : gl.RGBA32F,
        type           : gl.FLOAT,
        wrapS          : gl.CLAMP_TO_EDGE,
        wrapT          : gl.CLAMP_TO_EDGE,
        wrapR          : gl.CLAMP_TO_EDGE
    };

    return [
        emissionField
    ];
}

_getAccumulationBufferSpec() {
    const gl = this._gl;

    let fluenceBufferSpec = {
        target         : gl.TEXTURE_3D,
        width          : this.volumeDimensions.width,
        height         : this.volumeDimensions.height,
        depth          : this.volumeDimensions.depth,
        min            : gl.LINEAR,
        mag            : gl.LINEAR,
        // format         : gl.RED,
        // internalFormat : gl.R32F,
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
        fluenceBufferSpec,
    ];
}

_getDeferredRenderBufferSpec() {
    const gl = this._gl;
    const color = {
        width          : this._bufferSize,
        height         : this._bufferSize,
        min            : gl.NEAREST,
        mag            : gl.NEAREST,
        wrapS          : gl.CLAMP_TO_EDGE,
        wrapT          : gl.CLAMP_TO_EDGE,
        format         : gl.RGBA,
        internalFormat : gl.RGBA32F,
        type           : gl.FLOAT
    };

    const lighting = {
        width          : this._bufferSize,
        height         : this._bufferSize,
        min            : gl.NEAREST,
        mag            : gl.NEAREST,
        wrapS          : gl.CLAMP_TO_EDGE,
        wrapT          : gl.CLAMP_TO_EDGE,
        format         : gl.RED,
        internalFormat : gl.R32F,
        type           : gl.FLOAT
    };

    const depth = {
        width          : this._bufferSize,
        height         : this._bufferSize,
        min            : gl.NEAREST,
        mag            : gl.NEAREST,
        wrapS          : gl.CLAMP_TO_EDGE,
        wrapT          : gl.CLAMP_TO_EDGE,
        format         : gl.RGBA,
        internalFormat : gl.RGBA32F,
        type           : gl.FLOAT
    };

    return [
        color,
        lighting,
        depth
    ];
}

_getAmbientOcclusionBufferSpec() {
    const gl = this._gl;
    const depth = {
        width          : this._bufferSize,
        height         : this._bufferSize,
        min            : gl.NEAREST,
        mag            : gl.NEAREST,
        wrapS          : gl.CLAMP_TO_EDGE,
        wrapT          : gl.CLAMP_TO_EDGE,
        format         : gl.RG,
        internalFormat : gl.RG32F,
        type           : gl.FLOAT
    };
    const ao = {
        width          : this._bufferSize,
        height         : this._bufferSize,
        min            : gl.NEAREST,
        mag            : gl.NEAREST,
        wrapS          : gl.CLAMP_TO_EDGE,
        wrapT          : gl.CLAMP_TO_EDGE,
        format         : gl.RG,
        internalFormat : gl.RG32F,
        type           : gl.FLOAT
    };

    return [
        depth,
        ao
    ];
}

_getBloomBaseBufferSpec() {
    const gl = this._gl;
    const color = {
        width          : this._bufferSize,
        height         : this._bufferSize,
        min            : gl.LINEAR,
        mag            : gl.LINEAR,
        wrapS          : gl.CLAMP_TO_EDGE,
        wrapT          : gl.CLAMP_TO_EDGE,
        format         : gl.RGBA,
        internalFormat : gl.RGBA32F,
        type           : gl.FLOAT
    };

    return [
        color,
    ];
}

_getBloomBufferSpec(width, height) {
    const gl = this._gl;
    const color = {
        width          : width,
        height         : height,
        min            : gl.LINEAR,
        mag            : gl.LINEAR,
        wrapS          : gl.CLAMP_TO_EDGE,
        wrapT          : gl.CLAMP_TO_EDGE,
        format         : gl.RGBA,
        internalFormat : gl.RGBA16F,
        type           : gl.FLOAT
    };

    return [
        color
    ];
}

_getBloomBaseSpec() {
    const gl = this._gl;
    return [{
        width          : this._bufferSize,
        height         : this._bufferSize,
        min            : gl.NEAREST,
        mag            : gl.NEAREST,
        wrapS          : gl.CLAMP_TO_EDGE,
        wrapT          : gl.CLAMP_TO_EDGE,
        format         : gl.RGBA,
        internalFormat : gl.RGBA16F,
        type           : gl.FLOAT,
    }];
}

_destroyBloomBuffers() {
    if (this.bloomBuffers) {
        for (const buffer of this.bloomBuffers) {
            buffer.destroy()
        }
    }
}

_createBloomBuffers() {
    const gl = this._gl;

    this._destroyBloomBuffers()

    function numberOfLevels(width, height) {
        return Math.ceil(Math.log2(Math.max(width, height)));
    }

    function sizeAtLevel(level, baseWidth, baseHeight) {
        return {
            width: Math.max(1, Math.floor(baseWidth / (2 ** level))),
            height: Math.max(1, Math.floor(baseHeight / (2 ** level))),
        };
    }

    const levels = numberOfLevels(gl.drawingBufferWidth, gl.drawingBufferHeight);


    this.bloomBuffers = new Array(levels).fill(0).map((_, level) => {
        const size = sizeAtLevel(level, gl.drawingBufferWidth, gl.drawingBufferHeight);
        return new SingleBuffer(this._gl, this._getBloomBufferSpec(size.width, size.height));
    });
}
}
