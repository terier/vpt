import { WebGL } from '../WebGL.js';
import { AbstractRenderer } from './AbstractRenderer.js';
import { SingleBuffer } from "../SingleBuffer.js";
import { SingleBuffer3D } from "../SingleBuffer3D.js";
import { DoubleBuffer3D } from "../DoubleBuffer3D.js";

const [ SHADERS, MIXINS ] = await Promise.all([
    'shaders.json',
    'mixins.json',
].map(url => fetch(url).then(response => response.json())));

export class FLDRenderer extends AbstractRenderer {

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
            value: 2,
            type: "dropdown",
            options: [
                {
                    value: 0,
                    label: "Emission"
                },
                {
                    value: 1,
                    label: "Fluence"
                },
                {
                    value: 2,
                    label: "Result",
                    selected: true
                }
            ]
        },
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
            value: 2,
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
    });

    this.addEventListener('change', e => {
        const { name, value } = e.detail;



    });
    this._programs = WebGL.buildPrograms(gl, SHADERS.renderers.FLD, MIXINS);
    this.red = 1;
}

destroy() {
    const gl = this._gl;
    if (this._defferedRenderBuffer) {
        this._destroyDeferredRenderBuffer()
    }
    Object.keys(this._programs).forEach(programName => {
        gl.deleteProgram(this._programs[programName].program);
    });
    super.destroy();
}

setVolume(volume) {
    this._volume = volume;
    if (this.deferred_enabled)
        this._buildDeferredRenderBuffer();
    this._initialize3DBuffers();
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
    // if (this._frameBuffer) {
    //     this._frameBuffer.destroy();
    // }
    // if (this._accumulationBuffer) {
    //     this._accumulationBuffer.destroy();
    // }
    this._initialize3DBuffers();
    if (this._renderBuffer) {
        this._renderBuffer.destroy();
    }
    if (this._defferedRenderBuffer) {
        this._destroyDeferredRenderBuffer()
    }
    const gl = this._gl;
    // this._frameBuffer = new SingleBuffer3D(gl, this._getFrameBufferSpec());
    // this._accumulationBuffer = new DoubleBuffer3D(gl, this._getAccumulationBufferSpec());
    this._renderBuffer = new SingleBuffer(gl, this._getRenderBufferSpec());
    if (this.deferred_enabled)
        this._buildDeferredRenderBuffer();
}

_buildDeferredRenderBuffer() {
    const gl = this._gl;
    this._defferedRenderBuffer = new SingleBuffer(gl, this._getDeferredRenderBufferSpec());
}

_destroyDeferredRenderBuffer() {
    this._defferedRenderBuffer.destroy();
    this._defferedRenderBuffer = null;
}

_checkDeferredRendering() {
    if (this.deferred_enabled && !this._defferedRenderBuffer)
        this._buildDeferredRenderBuffer();
    else if (!this.deferred_enabled && this._defferedRenderBuffer)
        this._destroyDeferredRenderBuffer();
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
        this._deferredRenderFrame();
        this._combineRenderFrame();
    } else {
        this._renderBuffer.use();
        this._renderFrame();
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

_renderFrame() {
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

    const mvpit = this.calculateMVPInverseTranspose();
    gl.uniformMatrix4fv(uniforms.uMvpInverseMatrix, false, mvpit.m);

    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
}

_deferredRenderFrame() {
    const gl = this._gl;

    this._defferedRenderBuffer.use()

    const { program, uniforms } = this._programs.deferred_render;
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

    const mvpit = this.calculateMVPInverseTranspose();
    gl.uniformMatrix4fv(uniforms.uMvpInverseMatrix, false, mvpit.m);

    gl.drawBuffers([
        gl.COLOR_ATTACHMENT0,
        gl.COLOR_ATTACHMENT1
    ]);

    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
}

_combineRenderFrame() {
    const gl = this._gl;
    this._renderBuffer.use()

    const { program, uniforms } = this._programs.combine_render;
    gl.useProgram(program);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this._defferedRenderBuffer.getAttachments().color[0]);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this._defferedRenderBuffer.getAttachments().color[1]);

    gl.uniform1i(uniforms.uColor, 0);
    gl.uniform1i(uniforms.uLighting, 1);

    gl.uniform1i(uniforms.uSmartDeNoise, this.smart_denoise);
    gl.uniform1f(uniforms.uSigma, 1);
    gl.uniform1f(uniforms.uKSigma, 1);
    gl.uniform1f(uniforms.uTreshold, 1);

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

    return [
        color,
        lighting
    ];
}

}
