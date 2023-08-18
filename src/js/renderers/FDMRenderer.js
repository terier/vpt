import { WebGL } from '../WebGL.js';
import { AbstractRenderer } from './AbstractRenderer.js';
import { SingleBuffer } from "../SingleBuffer.js";
import { SingleBuffer3D } from "../SingleBuffer3D.js";
import { DoubleBuffer3D } from "../DoubleBuffer3D.js";

const [ SHADERS, MIXINS ] = await Promise.all([
    'shaders.json',
    'mixins.json',
].map(url => fetch(url).then(response => response.json())));

class Grid {
    constructor(accumulator, f, temp, residual, size, depth) {
        this.accumulator = accumulator;
        this.f = f;
        this.temp = temp;
        this.residual = residual;
        this.size = size;
        this.depth = depth;
        this.done = false;
    }

    destroy() {
        if (this.accumulator) {
            this.accumulator.destroy();
        }
        if (this.f) {
            this.f.destroy();
        }
        if (this.temp) {
            this.temp.destroy();
        }
    }
}

export class FDMRenderer extends AbstractRenderer {
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
                value: 0.9,
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
                value: 1,
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
                name: 'nSmooth',
                label: 'Smooth Steps',
                type: 'spinner',
                value: 2,
                min: 0,
            },
            {
                name: 'nSolve',
                label: 'Final Solve Steps',
                type: 'spinner',
                value: 2,
                min: 0,
            },
            {
                name: 'minGridSize',
                label: 'Min. Grid Size',
                type: 'spinner',
                value: 5,
                min: 1,
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
                        label: "Color"
                    },
                    {
                        value: 1,
                        label: "Emission"
                    },
                    {
                        value: 2,
                        label: "Fluence",
                        selected: true
                    },
                    {
                        value: 3,
                        label: "Residual",
                    },
                    {
                        value: 4,
                        label: "Error",
                    },
                    {
                        value: 5,
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
                name: 'residueDisplay',
                label: 'Residual+',
                type: 'spinner',
                value: 0,
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
                name: 'renderLevel',
                label: 'Render Level',
                type: 'spinner',
                value: 0,
                min: 0
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

            if (name === 'renderLevel' && this.grids) {
                if (this.grids && this.renderLevel > this.grids.length - 1) {
                    this.renderLevel = this.grids.length - 1;
                    console.log("Number of grid levels:", this.renderLevel);
                }
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
                'nSmooth',
                'nSolve',
                'minGridSize',
                'fluxLimiter',
                'transferFunction'
                // 'scatteringCoefficient',
                // 'absorptionCoefficient'
            ].includes(name)) {
                this.resetVolume();
            }
        });

        this._programs = WebGL.buildPrograms(gl, SHADERS.renderers.FDM, MIXINS);
        this.red = 1;

        this.step = false;
    }

    destroy() {
        const gl = this._gl;
        Object.keys(this._programs).forEach(programName => {
            gl.deleteProgram(this._programs[programName].program);
        });
        this._destroyGrids();
        super.destroy();
    }

    setVolume(volume) {
        this._volume = volume;
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
        this._initializeGrids();
        this.resetVolume();
    }

    _destroyGrids() {
        if (this.grids) {
            for (const grid of this.grids) {
                grid.destroy();
            }
        }
    }

    _initializeGrids() {
        this._destroyGrids();
        this.grids = [];

        let gridDimensions = {
            width: this.volumeDimensions.width,
            height: this.volumeDimensions.height,
            depth: this.volumeDimensions.depth
        };

        let gridDepth = 0;

        while(gridDimensions.width >= this.minGridSize
        && gridDimensions.height >= this.minGridSize
        && gridDimensions.depth >= this.minGridSize) {
            let accumulationBuffer = gridDepth === 0 ?
                this._accumulationBuffer :
                new DoubleBuffer3D(this._gl, this._getAccumulationBufferSpec(
                gridDimensions.width, gridDimensions.height, gridDimensions.depth));

            // let f = new SingleBuffer3D(this._gl, this._getResidualBufferSpec(
            //     gridDimensions.width, gridDimensions.height, gridDimensions.depth));
            let f = gridDepth === 0 ?
                this._frameBuffer :
                new SingleBuffer3D(this._gl, this._getResidualBufferSpec(
                    gridDimensions.width, gridDimensions.height, gridDimensions.depth));

            let tmp = null;
            if (gridDepth !== 0)
                tmp = new SingleBuffer3D(this._gl, this._getResidualBufferSpec(
                    gridDimensions.width, gridDimensions.height, gridDimensions.depth));

            let residual = new SingleBuffer3D(this._gl, this._getResidualBufferSpec(
                gridDimensions.width, gridDimensions.height, gridDimensions.depth));
            let grid = new Grid(accumulationBuffer, f, tmp, residual, structuredClone(gridDimensions), gridDepth);
            gridDepth += 1;

            this.grids.push(grid);

            gridDimensions.width = Math.floor(gridDimensions.width / 2);
            gridDimensions.height = Math.floor(gridDimensions.height / 2);
            gridDimensions.depth = Math.floor(gridDimensions.depth / 2);
        }
        console.log(this.grids)
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
        this._accumulationBuffer = new DoubleBuffer3D(this._gl, this._getAccumulationBufferSpec(
            this._lightVolumeDimensions.width, this._lightVolumeDimensions.height, this._lightVolumeDimensions.depth));
        // console.log(this._accumulationBuffer)
        // console.log(this._accumulationBuffer)
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
            this._vCycle(0);
            // this._accumulationBuffer.swap();
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

        this._accumulationBuffer.use();
        this._resetFrame();
        this._accumulationBuffer.swap();
    }

    _resetFrame() {
        this._resetEmissionField();
        // this._initializeGrids();
        if (this.grids) {
            // this._resetFluence(this.grids[0].accumulator, this.grids[0].size);
            for (const grid of this.grids) {
                this._resetFluence(grid.accumulator, grid.size, grid.depth)
            }
        }
    }

    _resetFluence(accumulator, dimensions, depth = 0) {
        const gl = this._gl;

        const {program, uniforms} = this._programs.reset;
        gl.useProgram(program);

        gl.bindTexture(gl.TEXTURE_3D, this._frameBuffer.getAttachments().color[0]);
        gl.generateMipmap(gl.TEXTURE_3D);

        for (let i = 0; i < dimensions.depth; i++) {
            accumulator.use(i);
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_3D, this._frameBuffer.getAttachments().color[0]);

            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_3D, this._volume.getTexture());
            gl.activeTexture(gl.TEXTURE2);
            gl.bindTexture(gl.TEXTURE_2D, this._transferFunction);

            gl.uniform1i(uniforms.uEmission, 0);
            gl.uniform1i(uniforms.uVolume, 1);
            gl.uniform1i(uniforms.uTransferFunction, 2);
            gl.uniform1f(uniforms.uLayer, (i + 0.5) / dimensions.depth);

            gl.uniform1f(uniforms.uVoxelSize, this.voxelSize * Math.pow(2, depth));
            gl.uniform1f(uniforms.uEpsilon, this.epsilon);

            gl.uniform3f(uniforms.uLight, this.light.x, this.light.y, this.light.z);

            gl.uniform3f(uniforms.uStep, 1 / dimensions.width, 1 / dimensions.height, 1 / dimensions.depth);
            gl.uniform3i(uniforms.uSize, dimensions.width, dimensions.height, dimensions.depth);

            gl.drawBuffers([
                gl.COLOR_ATTACHMENT0
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
            gl.uniform3f(uniforms.uLight, this.light.x, this.light.y, this.light.z);

            gl.drawBuffers([
                gl.COLOR_ATTACHMENT0
            ]);

            gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
        }
    }

    _generateFrame() {
    }
    _smoothing(accumulator, f, dimensions, depth = 0) {
        const gl = this._gl;

        if (this.done) {
            return;
        }

        const {program, uniforms} = this._programs.integrate;

        gl.useProgram(program);

        for (let i = 0; i < dimensions.depth; i++) {
            accumulator.use(i);

            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_3D, accumulator.getAttachments().color[0]);
            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_3D, f.getAttachments().color[0]);

            gl.activeTexture(gl.TEXTURE2);
            gl.bindTexture(gl.TEXTURE_3D, this._volume.getTexture());
            gl.activeTexture(gl.TEXTURE3);
            gl.bindTexture(gl.TEXTURE_2D, this._transferFunction);

            gl.uniform1i(uniforms.uFluenceAndDiffCoeff, 0);
            gl.uniform1i(uniforms.uEmission, 1);
            gl.uniform1i(uniforms.uVolume, 2);
            gl.uniform1i(uniforms.uTransferFunction, 3);
            // gl.uniform1i(uniforms.uF, 4);

            // gl.uniform1f(uniforms.uAbsorptionCoefficient, this.absorptionCoefficient);
            // gl.uniform1f(uniforms.uScatteringCoefficient, this.scatteringCoefficient);
            gl.uniform1f(uniforms.uExtinction, this.extinction);
            gl.uniform1f(uniforms.uAlbedo, this.albedo);
            gl.uniform1ui(uniforms.uLayer, i);
            gl.uniform1f(uniforms.uLayerRelative, (i + 0.5) / dimensions.depth);
            gl.uniform1f(uniforms.uSOR, this.SOR);
            gl.uniform1ui(uniforms.uRed, this.red);

            gl.uniform1f(uniforms.uVoxelSize, this.voxelSize * Math.pow(2, depth));
            gl.uniform1f(uniforms.uEpsilon, this.epsilon);

            gl.uniform1ui(uniforms.uFluxLimiter, this.fluxLimiter);
            gl.uniform1f(uniforms.uMinExtinction, this.minExtinction);

            gl.uniform1ui(uniforms.uTop, 1);

            gl.uniform3f(uniforms.uStep, 1 / dimensions.width, 1 / dimensions.height, 1 / dimensions.depth);
            gl.uniform3i(uniforms.uSize, dimensions.width, dimensions.height, dimensions.depth);

            gl.drawBuffers([
                gl.COLOR_ATTACHMENT0
            ]);

            gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
        }

        if (this.red === 1) {
            this.red = 0;
        } else {
            this.red = 1;
        }

        accumulator.swap();
    }

    _residual(residual, accumulator, f, dimensions, depth = 0) {
        const gl = this._gl;

        const { program, uniforms } = this._programs.computeResidual;
        gl.useProgram(program);

        for (let i = 0; i < dimensions.depth; i++) {
            residual.use(i);

            // gl.activeTexture(gl.TEXTURE0);
            // gl.bindTexture(gl.TEXTURE_3D, accumulator.getAttachments().color[0]);
            //
            // gl.activeTexture(gl.TEXTURE1);
            // gl.bindTexture(gl.TEXTURE_3D, f.getAttachments().color[0]);
            //
            // gl.uniform1i(uniforms.uFluence, 0);
            // gl.uniform1i(uniforms.uF, 1);
            //
            // gl.uniform1ui(uniforms.uLayer, i);
            // gl.uniform3i(uniforms.uSize, dimensions.width, dimensions.height, dimensions.depth);

            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_3D, accumulator.getAttachments().color[0]);

            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_3D, f.getAttachments().color[0]);

            gl.activeTexture(gl.TEXTURE2);
            gl.bindTexture(gl.TEXTURE_3D, this._volume.getTexture());
            gl.activeTexture(gl.TEXTURE3);
            gl.bindTexture(gl.TEXTURE_2D, this._transferFunction);

            gl.uniform1i(uniforms.uFluence, 0);
            gl.uniform1i(uniforms.uEmission, 1);
            gl.uniform1i(uniforms.uVolume, 2);
            gl.uniform1i(uniforms.uTransferFunction, 3);

            gl.uniform1ui(uniforms.uLayer, i);
            gl.uniform1f(uniforms.uExtinction, this.extinction);
            gl.uniform1f(uniforms.uAlbedo, this.albedo);
            gl.uniform1f(uniforms.uVoxelSize, this.voxelSize * Math.pow(2, depth));
            gl.uniform3i(uniforms.uSize, dimensions.width, dimensions.height, dimensions.depth);
            gl.uniform1f(uniforms.uMinExtinction, this.minExtinction);

            gl.uniform1ui(uniforms.uTop, 1);

            gl.drawBuffers([
                gl.COLOR_ATTACHMENT0
            ]);

            gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
        }
    }

    _restriction(residual, fCoarse, dimensions) {
        const gl = this._gl;

        const { program, uniforms } = this._programs.restrict;
        gl.useProgram(program);

        for (let i = 0; i < dimensions.depth; i++) {
            fCoarse.use(i);

            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_3D, residual.getAttachments().color[0]);

            gl.uniform1i(uniforms.uTmp, 0);

            gl.uniform1ui(uniforms.uLayer, i);
            gl.uniform1f(uniforms.uLayerRelative, (i + 0.5) / dimensions.depth);
            gl.uniform3i(uniforms.uSize, dimensions.width, dimensions.height, dimensions.depth);

            gl.drawBuffers([
                gl.COLOR_ATTACHMENT0
            ]);

            gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
        }
    }

    _correction(accumulator, accumulatorCoarse, dimensions) {
        const gl = this._gl;

        const { program, uniforms } = this._programs.correction;
        gl.useProgram(program);

        for (let i = 0; i < dimensions.depth; i++) {
            accumulator.use(i);

            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_3D, accumulator.getAttachments().color[0]);

            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_3D, accumulatorCoarse.getAttachments().color[0]);

            gl.uniform1i(uniforms.uFluence, 0);
            gl.uniform1i(uniforms.uCorrection, 1);

            gl.uniform1f(uniforms.uLayerRelative, (i + 0.5) / dimensions.depth);
            gl.uniform3f(uniforms.uStep, 1 / dimensions.width, 1 / dimensions.height, 1 / dimensions.depth);

            gl.drawBuffers([
                gl.COLOR_ATTACHMENT0
            ]);

            gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
        }
    }

    _augmentF(f, residual, accumulationUp, dimensions, depth = 0) {
        const gl = this._gl;

        const { program, uniforms } = this._programs.augmentF;
        gl.useProgram(program);

        for (let i = 0; i < dimensions.depth; i++) {
            f.use(i);

            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_3D, accumulationUp.getAttachments().color[0]);

            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_3D, residual.getAttachments().color[0]);

            gl.activeTexture(gl.TEXTURE2);
            gl.bindTexture(gl.TEXTURE_3D, this._volume.getTexture());
            gl.activeTexture(gl.TEXTURE3);
            gl.bindTexture(gl.TEXTURE_2D, this._transferFunction);

            gl.uniform1i(uniforms.uFluenceAndDiffCoeff, 0);
            gl.uniform1i(uniforms.uResidual, 1);
            gl.uniform1i(uniforms.uVolume, 2);
            gl.uniform1i(uniforms.uTransferFunction, 3);

            gl.uniform1f(uniforms.uLayerRelative, (i + 0.5) / dimensions.depth);
            gl.uniform3f(uniforms.uStep, 1 / dimensions.width, 1 / dimensions.height, 1 / dimensions.depth);
            gl.uniform3i(uniforms.uSize, dimensions.width, dimensions.height, dimensions.depth);
            gl.uniform1f(uniforms.uVoxelSize, this.voxelSize * Math.pow(2, depth));

            gl.uniform1f(uniforms.uExtinction, this.extinction);
            gl.uniform1f(uniforms.uAlbedo, this.albedo);
            gl.uniform1f(uniforms.uMinExtinction, this.minExtinction);

            gl.drawBuffers([
                gl.COLOR_ATTACHMENT0
            ]);

            gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
        }
    }

    _computeError(error, solution, solutionUp, dimensions) {
        const gl = this._gl;

        const { program, uniforms } = this._programs.computeError;
        gl.useProgram(program);

        for (let i = 0; i < dimensions.depth; i++) {
            error.use(i);

            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_3D, solution.getAttachments().color[0]);

            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_3D, solutionUp.getAttachments().color[0]);

            gl.uniform1i(uniforms.uSolution, 0);
            gl.uniform1i(uniforms.uSolutionUp, 1);

            gl.uniform1f(uniforms.uLayerRelative, (i + 0.5) / dimensions.depth);
            gl.uniform3f(uniforms.uStep, 1 / dimensions.width, 1 / dimensions.height, 1 / dimensions.depth);

            gl.drawBuffers([
                gl.COLOR_ATTACHMENT0
            ]);

            gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
        }
    }

    _vCycle(depth) {
        this.red = 1;
        const fineGrid = this.grids[depth];
        const coarseGrid = this.grids[depth + 1];

        // Pre-smoothing
        for (let i = 0; i < this.nSmooth * 2; ++i) {
            this._smoothing(fineGrid.accumulator, fineGrid.f, fineGrid.size, depth);
        }

        // Residual
        this._residual(fineGrid.residual, fineGrid.accumulator, fineGrid.f, fineGrid.size, depth);

        // Restriction
        this._restriction(fineGrid.residual, coarseGrid.temp, coarseGrid.size);

        // Compute coarse F (FAS)
        this._augmentF(coarseGrid.f, fineGrid.accumulator, coarseGrid.temp, coarseGrid.size, depth + 1);

        // Recursion or direct solver
        if (depth + 2 >= this.grids.length) {
            for (let i = 0; i < this.nSolve * 2; ++i) {
                this._smoothing(coarseGrid.accumulator, coarseGrid.f, coarseGrid.size, depth + 1);
            }
        } else {
            this._vCycle(depth + 1);
        }

        // Compute coarse grid error (FAS)
        this._computeError(coarseGrid.temp, coarseGrid.accumulator, fineGrid.accumulator, coarseGrid.size);

        // Prolongation and correction
        this._correction(fineGrid.accumulator, coarseGrid.temp, fineGrid.size);

        fineGrid.accumulator.swap();

        // Post-smoothing
        for (let i = 0; i < this.nSmooth * 2; ++i) {
            // Need to reverse local read and write variables
            this._smoothing(fineGrid.accumulator, fineGrid.f, fineGrid.size, depth);
        }

        if (depth === 0) {
            this.grids.forEach((element) => element.done = false);
        }
        else {
            this.grids[depth].done = true;
        }
    }

    _renderFrame(transferFunction, volumeView) {
        const gl = this._gl;

        const {program, uniforms} = this._programs.render;
        gl.useProgram(program);

        // const texture = this._accumulationBuffer.getAttachments().color[0];
        const texture = this.grids[this.renderLevel].accumulator.getAttachments().color[0];

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_3D, texture);

        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_3D, this._volume.getTexture());
        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, transferFunction);

        gl.activeTexture(gl.TEXTURE3);
        gl.bindTexture(gl.TEXTURE_3D, this.grids[this.renderLevel].f.getAttachments().color[0]);

        gl.activeTexture(gl.TEXTURE4);
        gl.bindTexture(gl.TEXTURE_3D, this.grids[this.renderLevel].residual.getAttachments().color[0]);

        if (this.renderLevel > 0) {
            gl.activeTexture(gl.TEXTURE5);
            gl.bindTexture(gl.TEXTURE_3D, this.grids[this.renderLevel].temp.getAttachments().color[0]);
        }


        gl.uniform1i(uniforms.uFluence, 0);
        gl.uniform1i(uniforms.uVolume, 1);
        gl.uniform1i(uniforms.uTransferFunction, 2);
        gl.uniform1i(uniforms.uEmission, 3);
        gl.uniform1i(uniforms.uResidual, 4);
        gl.uniform1i(uniforms.uError, 5);

        gl.uniform1f(uniforms.uStepSize, 1 / this.slices);
        gl.uniform1f(uniforms.uExtinction, this.extinction);
        gl.uniform1f(uniforms.uAlbedo, this.albedo);
        gl.uniform1f(uniforms.uOffset, Math.random());

        gl.uniform3f(uniforms.uCutplane, this.cutplaneX, this.cutplaneY, this.cutplaneZ);

        gl.uniform1ui(uniforms.uView, volumeView);

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
            type: gl.FLOAT,
            wrapS: gl.CLAMP_TO_EDGE,
            wrapT: gl.CLAMP_TO_EDGE,
            wrapR: gl.CLAMP_TO_EDGE
        };

        return [
            emissionField
        ];
    }

    _getAccumulationBufferSpec(width, height, depth) {
        const gl = this._gl;

        let fluenceBufferSpec = {
            target: gl.TEXTURE_3D,
            width: width,
            height: height,
            depth: depth,
            min: gl.LINEAR,
            mag: gl.LINEAR,
            format: gl.RG,
            internalFormat: gl.RG32F,
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

    _getResidualBufferSpec(width, height, depth) {
        const gl = this._gl;

        let residualBufferSpec = {
            target: gl.TEXTURE_3D,
            width: width,
            height: height,
            depth: depth,
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
            residualBufferSpec
        ];
    }

    _getRCBufferSpec() {
        const gl = this._gl;

        let rcBufferSpec = {
            target: gl.TEXTURE_2D,
            width: 1,
            height: 1,
            min: gl.NEAREST,
            mag: gl.NEAREST,
            format         : gl.RG,
            internalFormat : gl.RG32F,
            type: gl.FLOAT,
            wrapS: gl.CLAMP_TO_EDGE,
            wrapT: gl.CLAMP_TO_EDGE,
            storage: true
        };

        return [
            rcBufferSpec,
        ];
    }
}