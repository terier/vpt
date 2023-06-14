import { DOMUtils } from './utils/DOMUtils.js';

import './ui/UI.js';

import { LoaderFactory } from './loaders/LoaderFactory.js';
import { ReaderFactory } from './readers/ReaderFactory.js';

import { MainDialog } from './dialogs/MainDialog/MainDialog.js';
import { GroupDialog } from './dialogs/GroupDialog/GroupDialog.js';
import { VolumeLoadDialog } from './dialogs/VolumeLoadDialog/VolumeLoadDialog.js';
import { EnvmapLoadDialog } from './dialogs/EnvmapLoadDialog/EnvmapLoadDialog.js';
import { RenderingContextDialog } from './dialogs/RenderingContextDialog/RenderingContextDialog.js';
import { DialogConstructor } from './dialogs/DialogConstructor.js';

import { RenderingContext } from './RenderingContext.js';
import { ConductorVolume } from './ConductorVolume.js';

import { PerspectiveCamera } from './PerspectiveCamera.js';

import { vec3, quat } from '../lib/gl-matrix-module.js';

export class Application {

constructor() {
    this._handleFileDrop = this._handleFileDrop.bind(this);
    this._handleRendererChange = this._handleRendererChange.bind(this);
    this._handleToneMapperChange = this._handleToneMapperChange.bind(this);
    this._handleVolumeLoad = this._handleVolumeLoad.bind(this);
    this._handleEnvmapLoad = this._handleEnvmapLoad.bind(this);
    this._handleRecordAnimation = this._handleRecordAnimation.bind(this);

    this.binds = DOMUtils.bind(document.body);

    this.renderingContext = new RenderingContext();
    this.binds.canvasContainer.appendChild(this.renderingContext.canvas);

    document.body.addEventListener('dragover', e => e.preventDefault());
    document.body.addEventListener('drop', this._handleFileDrop);

    this.mainDialog = new MainDialog();
    this.binds.sidebarContainer.appendChild(this.mainDialog.object);

    this.groupDialog = new GroupDialog();
    this.mainDialog.binds.groups.appendChild(this.groupDialog.object);
    this.groupDialog.addEventListener('groupchange', e => {
        const volume = this.renderingContext.volume;
        if (!(volume instanceof ConductorVolume)) return;
        volume.groups = this.groupDialog.getGroupData();
        volume.updateInstanceGroupAssignments();
        volume.updateInstanceMaskValues();
        volume.updateMask();
        volume.smoothMask();
        volume.updateTransferFunction();
        this.renderingContext.renderer.setTransferFunction(volume.getTransferFunction());
        this.renderingContext.renderer.reset();
    });
    this.groupDialog.addEventListener('colorchange', e => {
        const volume = this.renderingContext.volume;
        if (!(volume instanceof ConductorVolume)) return;
        volume.groups = this.groupDialog.getGroupData();
        volume.updateTransferFunction();
        this.renderingContext.renderer.setTransferFunction(volume.getTransferFunction());
        this.renderingContext.renderer.reset();
    });
    this.groupDialog.addEventListener('densitychange', e => {
        const volume = this.renderingContext.volume;
        if (!(volume instanceof ConductorVolume)) return;
        volume.groups = this.groupDialog.getGroupData();
        volume.updateInstanceGroupAssignments();
        volume.updateInstanceMaskValues();
        volume.updateMask();
        volume.smoothMask();
        volume.updateTransferFunction();
        this.renderingContext.renderer.setTransferFunction(volume.getTransferFunction());
        this.renderingContext.renderer.reset();
    });
    this.renderingContext.addEventListener('attributechange', e => {
        this.groupDialog.attributes = e.detail;
    });

    this.volumeLoadDialog = new VolumeLoadDialog();
    this.mainDialog.getVolumeLoadContainer().appendChild(this.volumeLoadDialog.object);
    this.volumeLoadDialog.addEventListener('load', this._handleVolumeLoad);

    this.envmapLoadDialog = new EnvmapLoadDialog();
    this.mainDialog.getEnvmapLoadContainer().appendChild(this.envmapLoadDialog.object);
    this.envmapLoadDialog.addEventListener('load', this._handleEnvmapLoad);

    this.renderingContextDialog = new RenderingContextDialog();
    this.mainDialog.getRenderingContextSettingsContainer().appendChild(
            this.renderingContextDialog.object);
    this.renderingContextDialog.addEventListener('resolution', e => {
        const resolution = this.renderingContextDialog.resolution;
        this.renderingContext.setResolution(resolution);
    });
    this.renderingContextDialog.addEventListener('transformation', e => {
        const transform = this.renderingContext.volumeTransform;
        transform.translation = this.renderingContextDialog.translation;
        transform.rotation = quat.fromEuler(quat.create(), ...this.renderingContextDialog.rotation);
        transform.scale = this.renderingContextDialog.scale;
        this.renderingContext.renderer.reset();
    });
    this.renderingContextDialog.addEventListener('filter', e => {
        const filter = this.renderingContextDialog.filter;
        this.renderingContext.setFilter(filter);
    });
    this.renderingContextDialog.addEventListener('fullscreen', e => {
        this.renderingContext.canvas.classList.toggle('fullscreen',
            this.renderingContextDialog.fullscreen);
    });

    new ResizeObserver(entries => {
        const size = entries[0].contentBoxSize[0];
        const camera = this.renderingContext.camera.getComponentOfType(PerspectiveCamera);
        camera.aspect = size.inlineSize / size.blockSize;
    }).observe(this.renderingContext.canvas);

    this.renderingContext.addEventListener('progress', e => {
        this.volumeLoadDialog.binds.loadProgress.value = e.detail;
    });

    this.renderingContext.addEventListener('animationprogress', e => {
        this.mainDialog.binds.animationProgress.value = e.detail;
    });

    this.mainDialog.addEventListener('rendererchange', this._handleRendererChange);
    this.mainDialog.addEventListener('tonemapperchange', this._handleToneMapperChange);
    this._handleRendererChange();
    this._handleToneMapperChange();

    this.mainDialog.addEventListener('recordanimation', this._handleRecordAnimation);
    this.mainDialog.addEventListener('generateTests', e => this.generateTests());

    this.mainDialog.binds.runrun.addEventListener('click', async e => {
        const volume = this.renderingContext.volume;
        const renderer = this.renderingContext.renderer;
        const gl = this.renderingContext.gl;

        const ext = gl.getExtension('EXT_disjoint_timer_query_webgl2');
        const elapsedPrecision = gl.getQuery(ext.TIME_ELAPSED_EXT, ext.QUERY_COUNTER_BITS_EXT);
        console.log(`Precision: ${elapsedPrecision}`);

        this.renderingContext.stopRendering();

        let minAll = Infinity;
        let minUpdateInstanceGroupAssignments = Infinity;
        let minUpdateInstanceMaskValues = Infinity;
        let minUpdateMask = Infinity;
        let minSmoothMask = Infinity;
        let minUpdateTransferFunction = Infinity;
        let minSetTransferFunction = Infinity;

        for (let n = 0; n < 5; n++) {
            minAll = Math.min(
                minAll,
                await this.testAll());
        }
        for (let n = 0; n < 5; n++) {
            minUpdateInstanceGroupAssignments = Math.min(
                minUpdateInstanceGroupAssignments,
                await this.testUpdateInstanceGroupAssignments());
        }
        for (let n = 0; n < 5; n++) {
            minUpdateInstanceMaskValues = Math.min(
                minUpdateInstanceMaskValues,
                await this.testUpdateInstanceMaskValues());
        }
        for (let n = 0; n < 10; n++) {
            minUpdateMask = Math.min(
                minUpdateMask,
                await this.testUpdateMask());
        }
        for (let n = 0; n < 10; n++) {
            minSmoothMask = Math.min(
                minSmoothMask,
                await this.testSmoothMask());
        }
        for (let n = 0; n < 5; n++) {
            minUpdateTransferFunction = Math.min(
                minUpdateTransferFunction,
                await this.testUpdateTransferFunction());
        }
        for (let n = 0; n < 5; n++) {
            minSetTransferFunction = Math.min(
                minSetTransferFunction,
                await this.testSetTransferFunction());
        }

        console.log(
            minAll.toFixed(2),
            minUpdateInstanceGroupAssignments.toFixed(2),
            minUpdateInstanceMaskValues.toFixed(2),
            minUpdateMask.toFixed(2),
            minSmoothMask.toFixed(2),
            minUpdateTransferFunction.toFixed(2),
            minSetTransferFunction.toFixed(2),
        );
    });
}

async _handleRecordAnimation(e) {
    this.renderingContext.recordAnimation(e.detail);
}

_handleFileDrop(e) {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length === 0) {
        return;
    }
    const file = files[0];
    if (file.name.toLowerCase().endsWith('.bvp.zip')) {
        this._handleVolumeLoad(new CustomEvent('load', {
            detail: {
                type       : 'file',
                file       : file,
                filetype   : 'bvpzip',
                dimensions : { x: 0, y: 0, z: 0 }, // doesn't matter
                precision  : 8, // doesn't matter
            }
        }));
    } else if (file.name.toLowerCase().endsWith('.bvp.saf')) {
        this._handleVolumeLoad(new CustomEvent('load', {
            detail: {
                type       : 'file',
                file       : file,
                filetype   : 'bvpsaf',
                dimensions : { x: 0, y: 0, z: 0 }, // doesn't matter
                precision  : 8, // doesn't matter
            }
        }));
    } else {
        throw new Error('Unknown file name extension');
    }
}

_handleRendererChange() {
    if (this.rendererDialog) {
        this.rendererDialog.remove();
    }

    const which = this.mainDialog.getSelectedRenderer();
    this.renderingContext.chooseRenderer(which);
    const renderer = this.renderingContext.renderer;
    const object = DialogConstructor.construct(renderer.properties);
    const binds = DOMUtils.bind(object);
    this.rendererDialog = object;
    for (const name in binds) {
        binds[name].addEventListener('change', e => {
            const value = binds[name].value;
            renderer[name] = value;
            renderer.dispatchEvent(new CustomEvent('change', {
                detail: { name, value }
            }));
        });
    }
    const container = this.mainDialog.getRendererSettingsContainer();
    container.appendChild(this.rendererDialog);
}

_handleToneMapperChange() {
    if (this.toneMapperDialog) {
        this.toneMapperDialog.remove();
    }

    const which = this.mainDialog.getSelectedToneMapper();
    this.renderingContext.chooseToneMapper(which);
    const toneMapper = this.renderingContext.toneMapper;
    const object = DialogConstructor.construct(toneMapper.properties);
    const binds = DOMUtils.bind(object);
    this.toneMapperDialog = object;
    for (const name in binds) {
        binds[name].addEventListener('change', e => {
            const value = binds[name].value;
            toneMapper[name] = value;
            toneMapper.dispatchEvent(new CustomEvent('change', {
                detail: { name, value }
            }));
        });
    }
    const container = this.mainDialog.getToneMapperSettingsContainer();
    container.appendChild(this.toneMapperDialog);
}

async _handleVolumeLoad(e) {
    const options = e.detail;
    if (options.type === 'file') {
        const readerClass = ReaderFactory(options.filetype);
        if (readerClass) {
            const loaderClass = LoaderFactory('blob');
            const loader = new loaderClass(options.file);
            const reader = new readerClass(loader, {
                width  : options.dimensions[0],
                height : options.dimensions[1],
                depth  : options.dimensions[2],
                bits   : options.precision,
            });
            this.renderingContext.stopRendering();
            await this.renderingContext.setVolume(reader);
            this.renderingContext.startRendering();
        }
    } else if (options.type === 'url') {
        const readerClass = ReaderFactory(options.filetype);
        if (readerClass) {
            const loaderClass = LoaderFactory('ajax');
            const loader = new loaderClass(options.url);
            const reader = new readerClass(loader);
            this.renderingContext.stopRendering();
            await this.renderingContext.setVolume(reader);
            this.renderingContext.startRendering();
        }
    }
}

_handleEnvmapLoad(e) {
    const options = e.detail;
    let image = new Image();
    image.crossOrigin = 'anonymous';
    image.addEventListener('load', () => {
        this.renderingContext.setEnvironmentMap(image);
        this.renderingContext.renderer.reset();
    });

    if (options.type === 'file') {
        let reader = new FileReader();
        reader.addEventListener('load', () => {
            image.src = reader.result;
        });
        reader.readAsDataURL(options.file);
    } else if (options.type === 'url') {
        image.src = options.url;
    }
}

// TODO fix, this probably does not work after switch to gl-matrix
serializeView() {
    const c = this.renderingContext.camera;
    const mt = this.renderingContext.translation;
    const mr = this.renderingContext.rotation;
    const ms = this.renderingContext.scale;
    const cp = c.position;
    const cr = c.rotation;

    return JSON.stringify({
        camera: {
            fovX: c.fovX,
            fovY: c.fovY,
            near: c.near,
            far: c.far,
            zoomFactor: c.zoomFactor,
            position: [cp.x, cp.y, cp.z],
            rotation: [cr.x, cr.y, cr.z, r.w],
        },
        model: {
            translation: [mt.x, mt.y, mt.z],
            rotation: [mr.x, mr.y, mr.z],
            scale: [ms.x, ms.y, ms.z],
        },
    });
}

// TODO fix, this probably does not work after switch to gl-matrix
deserializeView(v) {
    v = JSON.parse(v);

    const c = this.renderingContext.getCamera();
    const cfrom = v.camera;

    c.fovX = cfrom.fovX;
    c.fovY = cfrom.fovY;
    c.near = cfrom.near;
    c.far = cfrom.far;
    c.zoomFactor = cfrom.zoomFactor;
    c.position.set(...cfrom.position, 1);
    c.rotation.set(...cfrom.rotation);
    c.updateMatrices();

    this.renderingContext.setTranslation(...v.model.translation);
    this.renderingContext.setRotation(...v.model.rotation);
    this.renderingContext.setScale(...v.model.scale);

    this.renderingContext.renderer.reset();
}

randomizeCamera() {
    const x = Math.acos(Math.random() * 2 - 1);
    const y = Math.random() * Math.PI * 2;
    const q = quat.create();
    quat.rotateX(q, q, x);
    quat.rotateY(q, q, y);
    this.renderingContext.volumeTransform.rotation = q;
}

samplePoint() {
    return this.renderingContext.renderer.samplePoint();
}

async generateTests() {
    let currentFileName = null;

    const [testsHandle] = await window.showOpenFilePicker();
    const testsFile = await testsHandle.getFile();
    const tests = JSON.parse(await testsFile.text());

    const inputFiles = {};
    const inputDirectory = await window.showDirectoryPicker();
    for await (const [name, handle] of inputDirectory.entries()) {
        inputFiles[name] = await handle.getFile();
    }

    const outputDirectory = await window.showDirectoryPicker();

    for (const test of tests) {
        this.renderingContext.stopRendering();
        this.renderingContext.setResolution(test.resolution);

        // setup renderer
        this.renderingContext.chooseRenderer(test.renderer.type);
        const renderer = this.renderingContext.renderer;
        for (const setting in test.renderer.settings) {
            renderer[setting] = test.renderer.settings[setting];
        }

        // setup tonemapper
        this.renderingContext.chooseToneMapper(test.tonemapper.type);
        const tonemapper = this.renderingContext.toneMapper;
        for (const setting in test.tonemapper.settings) {
            tonemapper[setting] = test.tonemapper.settings[setting];
        }

        // setup camera
        const camera = this.renderingContext.camera;
        const perspectiveCamera = camera.getComponentOfType(PerspectiveCamera);
        for (const setting in test.camera) {
            perspectiveCamera[setting] = test.camera[setting];
        }
        perspectiveCamera.aspect = 1;
        const displacement = this.renderingContext.cameraAnimator.displacement;
        vec3.scale(displacement, displacement, test.camera.distance / vec3.length(displacement));

        // setup model
        const { translation, rotation, scale } = test;
        const q = quat.create();
        quat.rotateX(q, q, rotation[0]);
        quat.rotateY(q, q, rotation[1]);
        quat.rotateZ(q, q, rotation[2]);
        const transform = this.renderingContext.volumeTransform;
        transform.translation = translation;
        transform.rotation = q;
        transform.scale = scale;

        // setup input data (skip if the same data)
        if (test.fileName !== currentFileName) {
            currentFileName = test.fileName;
            const file = inputFiles[currentFileName];
            const loaderClass = LoaderFactory('blob');
            const readerClass = ReaderFactory('bvpsaf');
            const loader = new loaderClass(file);
            const reader = new readerClass(loader);
            await this.renderingContext.setVolume(reader);
        }

        // setup conductor groups or transfer function
        if (test.fileType === 'conductor') {
            const volume = this.renderingContext.volume;
            volume.groups = test.groups;
            volume.updateInstanceGroupAssignments();
            volume.updateInstanceMaskValues();
            volume.updateMask();
            volume.smoothMask();
            volume.updateTransferFunction();
            renderer.setTransferFunction(volume.getTransferFunction());
        } else if (test.fileType === 'normal') {
            const tf = document.createElement('ui-transfer-function');
            tf.bumps = test.transferFunction;
            tf.render();
            renderer.setTransferFunction(tf.value);
        }

        // generate images
        function pad(number, length) {
            const string = String(number);
            const remaining = length - string.length;
            const padding = new Array(remaining).fill('0').join('');
            return padding + string;
        }
        const directoryName = `test${pad(tests.indexOf(test), 4)}`;
        const directory = await outputDirectory.getDirectoryHandle(directoryName, { create: true });
        this.renderingContext.startRendering();
        await this.renderingContext.recordAnimationToImageSequence({
            directory,
            startTime: 0,
            endTime: 1,
            fps: 30,
            frameTime: test.frameTime,
        });
    }
}

async testAll() {
    const volume = this.renderingContext.volume;
    const renderer = this.renderingContext.renderer;
    const gl = this.renderingContext.gl;

    const ext = gl.getExtension('EXT_disjoint_timer_query_webgl2');

    gl.finish();
    gl.getParameter(ext.GPU_DISJOINT_EXT);

    const query = gl.createQuery();
    gl.beginQuery(ext.TIME_ELAPSED_EXT, query);
    const start = performance.now();

    const N = 100;
    for (let i = 0; i < N; i++) {
        volume.updateInstanceGroupAssignments();
        volume.updateInstanceMaskValues();
        volume.updateMask();
        volume.smoothMask();
        volume.updateTransferFunction();
        renderer.setTransferFunction(volume.getTransferFunction());
    }

    gl.finish();
    gl.endQuery(ext.TIME_ELAPSED_EXT);
    const end = performance.now();

    const promise = new Promise((resolve, reject) => {
        function check() {
            const available = gl.getQueryParameter(query, gl.QUERY_RESULT_AVAILABLE);
            const disjoint = gl.getParameter(ext.GPU_DISJOINT_EXT);

            if (disjoint) {
                reject();
                gl.deleteQuery(query);
                return;
            }

            if (available) {
                const result = gl.getQueryParameter(query, gl.QUERY_RESULT);
                resolve(result);
                gl.deleteQuery(query);
                return;
            }

            setTimeout(check, 0);
        }

        setTimeout(check, 0);
    });

    const cpuTime = (end - start) / N;
    const gpuTime = (await promise) / 1_000_000 / N;
    console.log(`all\nCPU: ${cpuTime.toFixed(2)} ms\nGPU: ${gpuTime.toFixed(2)} ms`);
    return Math.max(cpuTime, gpuTime);
}

async testUpdateInstanceGroupAssignments() {
    const volume = this.renderingContext.volume;
    const renderer = this.renderingContext.renderer;
    const gl = this.renderingContext.gl;

    const ext = gl.getExtension('EXT_disjoint_timer_query_webgl2');

    gl.finish();
    gl.getParameter(ext.GPU_DISJOINT_EXT);

    const query = gl.createQuery();
    gl.beginQuery(ext.TIME_ELAPSED_EXT, query);
    const start = performance.now();

    const N = 1000;
    for (let i = 0; i < N; i++) {
        volume.updateInstanceGroupAssignments();
    }

    gl.finish();
    gl.endQuery(ext.TIME_ELAPSED_EXT);
    const end = performance.now();

    const promise = new Promise((resolve, reject) => {
        function check() {
            const available = gl.getQueryParameter(query, gl.QUERY_RESULT_AVAILABLE);
            const disjoint = gl.getParameter(ext.GPU_DISJOINT_EXT);

            if (disjoint) {
                reject();
                gl.deleteQuery(query);
                return;
            }

            if (available) {
                const result = gl.getQueryParameter(query, gl.QUERY_RESULT);
                resolve(result);
                gl.deleteQuery(query);
                return;
            }

            setTimeout(check, 0);
        }

        setTimeout(check, 0);
    });

    const cpuTime = (end - start) / N;
    const gpuTime = (await promise) / 1_000_000 / N;
    console.log(`updateInstanceGroupAssignments\nCPU: ${cpuTime.toFixed(2)} ms\nGPU: ${gpuTime.toFixed(2)} ms`);
    return Math.max(cpuTime, gpuTime);
}

async testUpdateInstanceMaskValues() {
    const volume = this.renderingContext.volume;
    const renderer = this.renderingContext.renderer;
    const gl = this.renderingContext.gl;

    const ext = gl.getExtension('EXT_disjoint_timer_query_webgl2');

    gl.finish();
    gl.getParameter(ext.GPU_DISJOINT_EXT);

    const query = gl.createQuery();
    gl.beginQuery(ext.TIME_ELAPSED_EXT, query);
    const start = performance.now();

    const N = 100;
    for (let i = 0; i < N; i++) {
        volume.updateInstanceMaskValues();
    }

    gl.finish();
    gl.endQuery(ext.TIME_ELAPSED_EXT);
    const end = performance.now();

    const promise = new Promise((resolve, reject) => {
        function check() {
            const available = gl.getQueryParameter(query, gl.QUERY_RESULT_AVAILABLE);
            const disjoint = gl.getParameter(ext.GPU_DISJOINT_EXT);

            if (disjoint) {
                reject();
                gl.deleteQuery(query);
                return;
            }

            if (available) {
                const result = gl.getQueryParameter(query, gl.QUERY_RESULT);
                resolve(result);
                gl.deleteQuery(query);
                return;
            }

            setTimeout(check, 0);
        }

        setTimeout(check, 0);
    });

    const cpuTime = (end - start) / N;
    const gpuTime = (await promise) / 1_000_000 / N;
    console.log(`updateInstanceMaskValues\nCPU: ${cpuTime.toFixed(2)} ms\nGPU: ${gpuTime.toFixed(2)} ms`);
    return Math.max(cpuTime, gpuTime);
}

async testUpdateMask() {
    const volume = this.renderingContext.volume;
    const renderer = this.renderingContext.renderer;
    const gl = this.renderingContext.gl;

    const ext = gl.getExtension('EXT_disjoint_timer_query_webgl2');

    gl.finish();
    gl.getParameter(ext.GPU_DISJOINT_EXT);

    const query = gl.createQuery();
    gl.beginQuery(ext.TIME_ELAPSED_EXT, query);
    const start = performance.now();

    const N = 100;
    for (let i = 0; i < N; i++) {
        volume.updateMask();
    }

    gl.finish();
    gl.endQuery(ext.TIME_ELAPSED_EXT);
    const end = performance.now();

    const promise = new Promise((resolve, reject) => {
        function check() {
            const available = gl.getQueryParameter(query, gl.QUERY_RESULT_AVAILABLE);
            const disjoint = gl.getParameter(ext.GPU_DISJOINT_EXT);

            if (disjoint) {
                reject();
                gl.deleteQuery(query);
                return;
            }

            if (available) {
                const result = gl.getQueryParameter(query, gl.QUERY_RESULT);
                resolve(result);
                gl.deleteQuery(query);
                return;
            }

            setTimeout(check, 0);
        }

        setTimeout(check, 0);
    });

    const cpuTime = (end - start) / N;
    const gpuTime = (await promise) / 1_000_000 / N;
    console.log(`updateMask\nCPU: ${cpuTime.toFixed(2)} ms\nGPU: ${gpuTime.toFixed(2)} ms`);
    return Math.max(cpuTime, gpuTime);
}

async testSmoothMask() {
    const volume = this.renderingContext.volume;
    const renderer = this.renderingContext.renderer;
    const gl = this.renderingContext.gl;

    const ext = gl.getExtension('EXT_disjoint_timer_query_webgl2');

    gl.finish();
    gl.getParameter(ext.GPU_DISJOINT_EXT);

    const query = gl.createQuery();
    gl.beginQuery(ext.TIME_ELAPSED_EXT, query);
    const start = performance.now();

    const N = 50;
    for (let i = 0; i < N; i++) {
        volume.smoothMask();
    }

    gl.finish();
    gl.endQuery(ext.TIME_ELAPSED_EXT);
    const end = performance.now();

    const promise = new Promise((resolve, reject) => {
        function check() {
            const available = gl.getQueryParameter(query, gl.QUERY_RESULT_AVAILABLE);
            const disjoint = gl.getParameter(ext.GPU_DISJOINT_EXT);

            if (disjoint) {
                reject();
                gl.deleteQuery(query);
                return;
            }

            if (available) {
                const result = gl.getQueryParameter(query, gl.QUERY_RESULT);
                resolve(result);
                gl.deleteQuery(query);
                return;
            }

            setTimeout(check, 0);
        }

        setTimeout(check, 0);
    });

    const cpuTime = (end - start) / N;
    const gpuTime = (await promise) / 1_000_000 / N;
    console.log(`smoothMask\nCPU: ${cpuTime.toFixed(2)} ms\nGPU: ${gpuTime.toFixed(2)} ms`);
    return Math.max(cpuTime, gpuTime);
}

async testUpdateTransferFunction() {
    const volume = this.renderingContext.volume;
    const renderer = this.renderingContext.renderer;
    const gl = this.renderingContext.gl;

    const ext = gl.getExtension('EXT_disjoint_timer_query_webgl2');

    gl.finish();
    gl.getParameter(ext.GPU_DISJOINT_EXT);

    const query = gl.createQuery();
    gl.beginQuery(ext.TIME_ELAPSED_EXT, query);
    const start = performance.now();

    const N = 1000;
    for (let i = 0; i < N; i++) {
        volume.updateTransferFunction();
    }

    gl.finish();
    gl.endQuery(ext.TIME_ELAPSED_EXT);
    const end = performance.now();

    const promise = new Promise((resolve, reject) => {
        function check() {
            const available = gl.getQueryParameter(query, gl.QUERY_RESULT_AVAILABLE);
            const disjoint = gl.getParameter(ext.GPU_DISJOINT_EXT);

            if (disjoint) {
                reject();
                gl.deleteQuery(query);
                return;
            }

            if (available) {
                const result = gl.getQueryParameter(query, gl.QUERY_RESULT);
                resolve(result);
                gl.deleteQuery(query);
                return;
            }

            setTimeout(check, 0);
        }

        setTimeout(check, 0);
    });

    const cpuTime = (end - start) / N;
    const gpuTime = (await promise) / 1_000_000 / N;
    console.log(`updateTransferFunction\nCPU: ${cpuTime.toFixed(2)} ms\nGPU: ${gpuTime.toFixed(2)} ms`);
    return Math.max(cpuTime, gpuTime);
}

async testSetTransferFunction() {
    const volume = this.renderingContext.volume;
    const renderer = this.renderingContext.renderer;
    const gl = this.renderingContext.gl;

    const ext = gl.getExtension('EXT_disjoint_timer_query_webgl2');

    gl.finish();
    gl.getParameter(ext.GPU_DISJOINT_EXT);

    const query = gl.createQuery();
    gl.beginQuery(ext.TIME_ELAPSED_EXT, query);
    const start = performance.now();

    const N = 1000;
    for (let i = 0; i < N; i++) {
        renderer.setTransferFunction(volume.getTransferFunction());
    }

    gl.finish();
    gl.endQuery(ext.TIME_ELAPSED_EXT);
    const end = performance.now();

    const promise = new Promise((resolve, reject) => {
        function check() {
            const available = gl.getQueryParameter(query, gl.QUERY_RESULT_AVAILABLE);
            const disjoint = gl.getParameter(ext.GPU_DISJOINT_EXT);

            if (disjoint) {
                reject();
                gl.deleteQuery(query);
                return;
            }

            if (available) {
                const result = gl.getQueryParameter(query, gl.QUERY_RESULT);
                resolve(result);
                gl.deleteQuery(query);
                return;
            }

            setTimeout(check, 0);
        }

        setTimeout(check, 0);
    });

    const cpuTime = (end - start) / N;
    const gpuTime = (await promise) / 1_000_000 / N;
    console.log(`setTransferFunction\nCPU: ${cpuTime.toFixed(2)} ms\nGPU: ${gpuTime.toFixed(2)} ms`);
    return Math.max(cpuTime, gpuTime);
}

}
