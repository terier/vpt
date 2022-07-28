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
        const s = this.renderingContextDialog.scale;
        const t = this.renderingContextDialog.translation;
        this.renderingContext.setScale(...s);
        this.renderingContext.setTranslation(...t);
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
    const s = this.renderingContext._scale;
    const t = this.renderingContext._translation;
    const p = c.position;
    const r = c.rotation;
    return JSON.stringify({
        fovX: c.fovX,
        fovY: c.fovY,
        near: c.near,
        far: c.far,
        zoomFactor: c.zoomFactor,
        position: [p.x, p.y, p.z],
        rotation: [r.x, r.y, r.z, r.w],
        scale: [s.x, s.y, s.z],
        translation: [t.x, t.y, t.z],
    });
}

deserializeView(v) {
    v = JSON.parse(v);

    const c = this.renderingContext._camera;
    const p = v.position;
    const r = v.rotation;

    c.fovX = v.fovX;
    c.fovY = v.fovY;
    c.near = v.near;
    c.far = v.far;
    c.zoomFactor = v.zoomFactor;
    c.position.set(...p, 1);
    c.rotation.set(...r);
    c.updateMatrices();

    this.renderingContext.setScale(...v.scale);
    this.renderingContext.setTranslation(...v.translation);

    this.renderingContext._renderer.reset();
}

}
