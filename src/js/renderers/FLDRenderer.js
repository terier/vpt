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
            name: 'slices',
            label: 'Slices',
            type: 'spinner',
            value: 64,
            min: 1,
        },
        {
            name: 'light',
            label: 'Light direction',
            type: 'vector',
            value: { x: 1, y: 0, z: 0 },
        },
        {
            name: 'scatteringCoefficient',
            label: 'Scattering Coefficient',
            type: 'spinner',
            value: 0.1,
            min: 0,
            max: 1
        },
        {
            name: 'absorptionCoefficient',
            label: 'Absorption Coefficient',
            type: 'spinner',
            value: 1,
            min: 0,
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
            type: 'slider',
            value: 1,
            min: 0,
            max: 1
        },
        {
            name: 'transferFunction',
            label: 'Transfer function',
            type: 'transfer-function',
            value: new Uint8Array(256),
        },
    ]);

    this.addEventListener('change', e => {
        const { name, value } = e.detail;

        if (name === 'transferFunction') {
            this.setTransferFunction(this.transferFunction);
        }

        if ([
            'light',
            'scattering',
            'voxelSize',
            'lightVolumeRatio',
            'SOR',
            'scatteringCoefficient',
            'absorptionCoefficient'
        ].includes(name)) {
            this.resetVolume();
        }
    });

    this._programs = WebGL.buildPrograms(gl, SHADERS.renderers.FLD, MIXINS);

    this.epsilon = 10e-10
}

destroy() {
    const gl = this._gl;
    Object.keys(this._programs).forEach(programName => {
        gl.deleteProgram(this._programs[programName].program);
    });
    super.destroy();
}

setVolume(volume) {
    this._volume = volume;
    this.volumeDimensions = volume.modalities[0].dimensions;
    this.setFrameBuffer();
    this.setAccumulationBuffer();
    this.setLightVolumeDimensions();
    console.log("Volume Loaded!");
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
    if (this._renderBuffer) {
        this._renderBuffer.destroy();
    }
    const gl = this._gl;
    // this._frameBuffer = new SingleBuffer3D(gl, this._getFrameBufferSpec());
    // this._accumulationBuffer = new DoubleBuffer3D(gl, this._getAccumulationBufferSpec());
    this._renderBuffer = new SingleBuffer(gl, this._getRenderBufferSpec());
}

reset() { }

resetVolume() {
    const gl = this._gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, this._clipQuad);
    gl.enableVertexAttribArray(0); // position always bound to attribute 0
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    this._accumulationBuffer.use();
    this._resetFrame();
    this._accumulationBuffer.swap();
}

_resetFrame() {
    this._resetEmissionField()
    this._resetFluence()
}

_resetFluence() {
    const gl = this._gl;

    const { program, uniforms } = this._programs.reset;
    gl.useProgram(program);
    const dimensions = this._lightVolumeDimensions;

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
        gl.uniform3ui(uniforms.uSize, dimensions.width, dimensions.height, dimensions.depth);

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
    this.red = 1;
    const { program, uniforms } = this._programs.integrate;
    gl.useProgram(program);
    const dimensions = this._lightVolumeDimensions;

    gl.bindTexture(gl.TEXTURE_3D, this._accumulationBuffer.getAttachments().color[0]);
    gl.generateMipmap(gl.TEXTURE_3D);
    gl.bindTexture(gl.TEXTURE_3D, this._frameBuffer.getAttachments().color[0]);
    gl.generateMipmap(gl.TEXTURE_3D);

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

        gl.uniform1f(uniforms.uAbsorptionCoefficient, this.absorptionCoefficient);
        gl.uniform1f(uniforms.uScatteringCoefficient, this.scatteringCoefficient);
        gl.uniform1f(uniforms.uLayer, (i + 0.5) / this._lightVolumeDimensions.depth);
        gl.uniform1f(uniforms.uSOR, this.SOR);
        gl.uniform1ui(uniforms.uRed, this.red);
        gl.uniform1f(uniforms.uLOD, this.LOD);

        gl.uniform1f(uniforms.uVoxelSize, 1);
        gl.uniform1f(uniforms.uEpsilon, this.epsilon);


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

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_3D, this._volume.getTexture());
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, this._transferFunction);

    gl.uniform1i(uniforms.uFluence, 0);
    gl.uniform1i(uniforms.uVolume, 1);
    gl.uniform1i(uniforms.uTransferFunction, 2);

    gl.uniform1f(uniforms.uStepSize, 1 / this.slices);
    gl.uniform1f(uniforms.uExtinction, this.extinction);
    gl.uniform1f(uniforms.uOffset, Math.random());
    const mvpit = this.calculateMVPInverseTranspose();
    gl.uniformMatrix4fv(uniforms.uMvpInverseMatrix, false, mvpit.m);

    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
}

_getFrameBufferSpec() {
    const gl = this._gl;

    let emissionField = {
        target         : gl.TEXTURE_3D,
        width          : this.volumeDimensions.width,
        height         : this.volumeDimensions.height,
        depth          : this.volumeDimensions.depth,
        min            : gl.LINEAR_MIPMAP_LINEAR,
        mag            : gl.LINEAR,
        // format         : gl.RED,
        // internalFormat : gl.R32F,
        format         : gl.RGBA,
        internalFormat : gl.RGBA32F,
        type           : gl.FLOAT,
        wrapS          : gl.CLAMP_TO_EDGE,
        wrapT          : gl.CLAMP_TO_EDGE,
        wrapR          : gl.CLAMP_TO_EDGE
    };

    let residualField = {
        target         : gl.TEXTURE_3D,
        width          : this.volumeDimensions.width,
        height         : this.volumeDimensions.height,
        depth          : this.volumeDimensions.depth,
        min            : gl.LINEAR_MIPMAP_LINEAR,
        mag            : gl.LINEAR,
        // format         : gl.RED,
        // internalFormat : gl.R32F,
        format         : gl.RG,
        internalFormat : gl.RG32F,
        type           : gl.FLOAT,
        wrapS          : gl.CLAMP_TO_EDGE,
        wrapT          : gl.CLAMP_TO_EDGE,
        wrapR          : gl.CLAMP_TO_EDGE
    };

    return [
        emissionField,
        residualField
    ];
}

_getAccumulationBufferSpec() {
    const gl = this._gl;

    let fluenceBufferSpec = {
        target         : gl.TEXTURE_3D,
        width          : this.volumeDimensions.width,
        height         : this.volumeDimensions.height,
        depth          : this.volumeDimensions.depth,
        min            : gl.NEAREST,
        mag            : gl.NEAREST,
        // format         : gl.RED,
        // internalFormat : gl.R32F,
        format         : gl.RGBA,
        internalFormat : gl.RGBA32F,
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

}
