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
    this.binds.container.appendChild(this.renderingContext.getCanvas());

    document.body.addEventListener('dragover', e => e.preventDefault());
    document.body.addEventListener('drop', this._handleFileDrop);

    this.mainDialog = new MainDialog();

    this.groupDialog = new GroupDialog();
    this.mainDialog.binds.groups.appendChild(this.groupDialog.object);
    this.groupDialog.addEventListener('groupchange', e => {
        const volume = this.renderingContext._volume;
        if (!(volume instanceof ConductorVolume)) return;
        volume.groups = this.groupDialog.getGroupData();
        volume.updateInstanceGroupAssignments();
        volume.updateInstanceMaskValues();
        volume.updateMask();
        volume.smoothMask();
        volume.updateTransferFunction();
        this.renderingContext.getRenderer().setTransferFunction(volume.getTransferFunction());
        this.renderingContext.getRenderer().reset();
    });
    this.groupDialog.addEventListener('colorchange', e => {
        const volume = this.renderingContext._volume;
        if (!(volume instanceof ConductorVolume)) return;
        volume.groups = this.groupDialog.getGroupData();
        volume.updateTransferFunction();
        this.renderingContext.getRenderer().setTransferFunction(volume.getTransferFunction());
        this.renderingContext.getRenderer().reset();
    });
    this.groupDialog.addEventListener('densitychange', e => {
        const volume = this.renderingContext._volume;
        if (!(volume instanceof ConductorVolume)) return;
        volume.groups = this.groupDialog.getGroupData();
        volume.updateInstanceGroupAssignments();
        volume.updateInstanceMaskValues();
        volume.updateMask();
        volume.smoothMask();
        volume.updateTransferFunction();
        this.renderingContext.getRenderer().setTransferFunction(volume.getTransferFunction());
        this.renderingContext.getRenderer().reset();
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
        const t = this.renderingContextDialog.translation;
        const r = this.renderingContextDialog.rotation;
        const s = this.renderingContextDialog.scale;
        this.renderingContext.setTranslation(...t);
        this.renderingContext.setRotation(...r);
        this.renderingContext.setScale(...s);
    });
    this.renderingContextDialog.addEventListener('filter', e => {
        const filter = this.renderingContextDialog.filter;
        this.renderingContext.setFilter(filter);
    });
    this.renderingContextDialog.addEventListener('fullscreen', e => {
        this.renderingContext.getCanvas().classList.toggle('fullscreen',
            this.renderingContextDialog.fullscreen);
    });

    new ResizeObserver(entries => {
        const size = entries[0].contentBoxSize[0];
        this.renderingContext._camera.resize(size.inlineSize, size.blockSize);
    }).observe(this.renderingContext.getCanvas());

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
    if (!file.name.toLowerCase().endsWith('.bvp')) {
        throw new Error('Filename extension must be .bvp');
    }
    this._handleVolumeLoad(new CustomEvent('load', {
        detail: {
            type       : 'file',
            file       : file,
            filetype   : 'bvp',
            dimensions : { x: 0, y: 0, z: 0 }, // doesn't matter
            precision  : 8, // doesn't matter
        }
    }));
}

_handleRendererChange() {
    if (this.rendererDialog) {
        this.rendererDialog.remove();
    }

    const which = this.mainDialog.getSelectedRenderer();
    this.renderingContext.chooseRenderer(which);
    const renderer = this.renderingContext.getRenderer();
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
    const toneMapper = this.renderingContext.getToneMapper();
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

_handleVolumeLoad(e) {
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
            this.renderingContext.setVolume(reader);
        }
    } else if (options.type === 'url') {
        const readerClass = ReaderFactory(options.filetype);
        if (readerClass) {
            const loaderClass = LoaderFactory('ajax');
            const loader = new loaderClass(options.url);
            const reader = new readerClass(loader);
            this.renderingContext.stopRendering();
            this.renderingContext.setVolume(reader);
        }
    }
}

_handleEnvmapLoad(e) {
    const options = e.detail;
    let image = new Image();
    image.crossOrigin = 'anonymous';
    image.addEventListener('load', () => {
        this.renderingContext.setEnvironmentMap(image);
        this.renderingContext.getRenderer().reset();
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

serializeView() {
    const c = this.renderingContext._camera;
    const mt = this.renderingContext._translation;
    const mr = this.renderingContext._rotation;
    const ms = this.renderingContext._scale;
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

    this.renderingContext._renderer.reset();
}

randomizeCamera() {
    const x = Math.acos(Math.random() * 2 - 1);
    const y = Math.random() * Math.PI * 2;
    this.renderingContext.setRotation(x, y, 0);
}

samplePoint() {
    return this.renderingContext.getRenderer().samplePoint();
}

async run() {
    let currentFileName = null;

    // I'm going to hell for this ...
    alert('First choose the JSON with tests, then choose the directory with volumes, then choose the output directory');

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
        this.renderingContext.setResolution(test.resolution);

        // setup renderer
        this.renderingContext.chooseRenderer(test.renderer);
        const renderer = this.renderingContext.getRenderer();
        for (const setting in test.rendererSettings) {
            renderer[setting] = test.rendererSettings[setting];
        }

        // setup tonemapper
        this.renderingContext.chooseToneMapper(test.tonemapper);
        const tonemapper = this.renderingContext.getToneMapper();
        for (const setting in test.tonemapperSettings) {
            tonemapper[setting] = test.tonemapperSettings[setting];
        }

        // setup camera
        const camera = this.renderingContext.getCamera();
        for (const setting in test.cameraSettings) {
            camera[setting] = test.cameraSettings[setting];
        }

        // setup model
        const { translation, rotation, scale } = test;
        this.renderingContext.setTranslation(...translation);
        this.renderingContext.setRotation(...rotation);
        this.renderingContext.setScale(...scale);

        // setup input data (skip if the same data)
        if (test.data.fileName !== currentFileName) {
            currentFileName = test.data.fileName;
            const file = inputFiles[currentFileName];
            const loaderClass = LoaderFactory('blob');
            const readerClass = ReaderFactory('bvp');
            const loader = new loaderClass(file);
            const reader = new readerClass(loader);
            await this.renderingContext.setVolume(test.data.type, reader);
        }

        // setup conductor groups?

        // setup transfer function
        //if (test.transferFunctionSettings) {
            // TODO
        //}

        // generate images
        function pad(number, length) {
            const string = String(number);
            const remaining = length - string.length;
            const padding = new Array(remaining).fill('0').join('');
            return padding + string;
        }
        const directoryName = `test${pad(tests.indexOf(test), 4)}`;
        const directory = await outputDirectory.getDirectoryHandle(directoryName, { create: true });
        await this.renderingContext.recordAnimationToImageSequence({
            directory,
            startTime: 0,
            endTime: 1,
            fps: 60,
            frameTime: 0.5,
            ...test.animationOptions,
        });
    }
}

}
