import { quat } from '../lib/gl-matrix-module.js';

import { DOMUtils } from './utils/DOMUtils.js';

import './ui/UI.js';

import { ReaderFactory } from './readers/ReaderFactory.js';
import { SAFReader } from './readers/SAFReader.js';
import { loadRAW } from './readers/loadRAW.js';
import { RendererFactory } from './renderers/RendererFactory.js';
import { ToneMapperFactory } from './tonemappers/ToneMapperFactory.js';
import { formatToTextureType } from './TextureFormats.js';
import { SingleBuffer } from './SingleBuffer.js';
import { DoubleBuffer } from './DoubleBuffer.js';

import { MainDialog } from './dialogs/MainDialog/MainDialog.js';
import { VolumeLoadDialog } from './dialogs/VolumeLoadDialog/VolumeLoadDialog.js';
import { EnvmapLoadDialog } from './dialogs/EnvmapLoadDialog/EnvmapLoadDialog.js';
import { RenderingContextDialog } from './dialogs/RenderingContextDialog/RenderingContextDialog.js';
import { DialogConstructor } from './dialogs/DialogConstructor.js';

import { RenderingContext } from './RenderingContext.js';

import { Node } from './Node.js';
import { Camera } from './Camera.js';
import { Transform } from './Transform.js';
import { Volume } from './Volume.js';
import { EnvironmentMap } from './EnvironmentMap.js';

import { OrbitCameraAnimator } from './animators/OrbitCameraAnimator.js';

import { ResizeSystem } from './systems/ResizeSystem.js';
import { UpdateSystem } from './systems/UpdateSystem.js';

import {
    buildPrograms,
    createTexture,
} from './WebGL.js';
import { SHADERS, MIXINS } from './shaders.js';

const binds = DOMUtils.bind(document.body);
const canvas = binds.canvas;
canvas.width = 512;
canvas.height = 512;

// Initialize WebGL
const gl = canvas.getContext('webgl2', {
    alpha: false,
    depth: false,
    stencil: false,
    antialias: false,
    preserveDrawingBuffer: true,
});

const supportedExtensions = gl.getSupportedExtensions();
const requiredExtensions = [
    'EXT_color_buffer_float', // render to RGBA32F
    'OES_texture_float_linear', // interpolate RGBA32F
];

const extensions = {};
for (const extension of requiredExtensions) {
    if (!supportedExtensions.includes(extension)) {
        throw new Error(`Required extension '${extension}' not supported!`);
    }
    extensions[extension] = gl.getExtension(extension);
}

// Alignment issues
gl.pixelStorei(gl.PACK_ALIGNMENT, 1);
gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);

// Construct scene
const scene = [];

const camera = new Node();
camera.addComponent(new Camera());
camera.addComponent(new Transform({
    translation: [0, 0, 2],
}));
const animator = new OrbitCameraAnimator(camera, canvas);
camera.addComponent(animator);
animator.addEventListener('update', e => {
    renderer.needsReset = true;
});
scene.push(camera);

const volume = new Node();
volume.addComponent(new Volume(gl));
volume.addComponent(new Transform());
scene.push(volume);

const environmentTexture = createTexture(gl, {
    image: await createImageBitmap(new ImageData(new Uint8ClampedArray([255, 255, 255, 255]), 1, 1)),
});
const environmentLight = new Node();
environmentLight.addComponent(new EnvironmentMap({
    texture: environmentTexture,
}));
scene.push(environmentLight);

// Construct render graph
const rendererClass = RendererFactory('mcm');
let renderer = new rendererClass(gl);

const toneMapperClass = ToneMapperFactory('artistic');
let toneMapper = new toneMapperClass(gl);

// Construct render targets
let frameBuffer, accumulationBuffer, renderBuffer;

const commonRenderTargetParameters = {
    width: canvas.width,
    height: canvas.height,
    min: gl.NEAREST,
    mag: gl.NEAREST,
    wrapS: gl.CLAMP_TO_EDGE,
    wrapT: gl.CLAMP_TO_EDGE,
};

function rebuildRenderTargets() {
    frameBuffer?.destroy();
    frameBuffer = new SingleBuffer(gl, renderer.frameBufferFormat.map(format => ({
        ...commonRenderTargetParameters,
        ...formatToTextureType(gl, format),
    })));
    accumulationBuffer?.destroy();
    accumulationBuffer = new DoubleBuffer(gl, renderer.accumulationBufferFormat.map(format => ({
        ...commonRenderTargetParameters,
        ...formatToTextureType(gl, format),
    })));
    renderBuffer?.destroy();
    renderBuffer = new SingleBuffer(gl, [{
        ...commonRenderTargetParameters,
        ...formatToTextureType(gl, 'rgba16float'),
    }]);
}

rebuildRenderTargets();

// Main application functions
function update(t, dt) {
    for (const node of scene) {
        for (const component of node.components) {
            component.update?.(t, dt);
        }
    }
}

function resize({ displaySize: { width, height }}) {
    commonRenderTargetParameters.width = width;
    commonRenderTargetParameters.height = height;
    rebuildRenderTargets();
    camera.getComponentOfType(Camera).aspect = width / height;
    renderer.needsReset = true;
}

function render() {
    // TODO: execute render graph
    //renderer.render(scene, camera);

    renderer.generate(frameBuffer, scene);
    renderer.integrate(frameBuffer, accumulationBuffer, scene);
    renderer.render(accumulationBuffer, renderBuffer, scene);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    toneMapper.render(renderBuffer);
}

new ResizeSystem({ canvas, resize }).start();
new UpdateSystem({ update, render }).start();

// Main dialogs
const mainDialog = new MainDialog();
binds.sidebarContainer.appendChild(mainDialog.object);

const volumeLoadDialog = new VolumeLoadDialog();
mainDialog.getVolumeLoadContainer().appendChild(volumeLoadDialog.object);
volumeLoadDialog.addEventListener('load', handleVolumeLoad);

const envmapLoadDialog = new EnvmapLoadDialog();
mainDialog.getEnvmapLoadContainer().appendChild(envmapLoadDialog.object);
envmapLoadDialog.addEventListener('load', handleEnvmapLoad);

// Rendering context dialog
const renderingContextDialog = new RenderingContextDialog();
mainDialog.getRenderingContextSettingsContainer().appendChild(renderingContextDialog.object);

renderingContextDialog.addEventListener('resolution', e => {
    const [width, height] = renderingContextDialog.resolution;
    canvas.width = width;
    canvas.height = height;
});

renderingContextDialog.addEventListener('transformation', e => {
    const volumeTransform = volume.getComponentOfType(Transform);
    volumeTransform.translation = renderingContextDialog.translation;
    volumeTransform.rotation = quat.fromEuler(quat.create(), ...renderingContextDialog.rotation);
    volumeTransform.scale = renderingContextDialog.scale;
});

renderingContextDialog.addEventListener('filter', e => {
    const volumeComponent = volume.getComponentOfType(Volume);
    volumeComponent.setFilter(renderingContextDialog.filter);
    renderer.reset(accumulationBuffer, scene);
});

renderingContextDialog.addEventListener('fullscreen', e => {
    canvas.classList.toggle('stretch', renderingContextDialog.fullscreen);
});

//renderingContext.addEventListener('progress', e => {
//    volumeLoadDialog.binds.loadProgress.value = e.detail;
//});

//renderingContext.addEventListener('animationprogress', e => {
//    mainDialog.binds.animationProgress.value = e.detail;
//});

// Renderer dialog
function createDialogForRenderer(renderer) {
    const dialog = DialogConstructor.construct(renderer.properties);
    const binds = DOMUtils.bind(dialog);

    for (const name in binds) {
        binds[name].addEventListener('change', e => {
            const value = binds[name].value;
            renderer[name] = value;
            renderer.dispatchEvent(new CustomEvent('change', {
                detail: { name, value }
            }));
        });
    }

    return dialog;
}

let rendererDialog = createDialogForRenderer(renderer);
mainDialog.getRendererSettingsContainer().appendChild(rendererDialog);

function setRenderer(which) {

    const rendererClass = RendererFactory(which);
    renderer.destroy();
    renderer = new rendererClass(gl);
    rebuildRenderTargets();
    renderer.reset(accumulationBuffer, scene);

    rendererDialog.remove();
    rendererDialog = createDialogForRenderer(renderer);
    const container = mainDialog.getRendererSettingsContainer();
    container.appendChild(rendererDialog);
}

mainDialog.addEventListener('rendererchange', e => {
    setRenderer(mainDialog.getSelectedRenderer());
});

// Tone mapper dialog
function createDialogForToneMapper(toneMapper) {
    const dialog = DialogConstructor.construct(toneMapper.properties);
    const binds = DOMUtils.bind(dialog);

    for (const name in binds) {
        binds[name].addEventListener('change', e => {
            const value = binds[name].value;
            toneMapper[name] = value;
            toneMapper.dispatchEvent(new CustomEvent('change', {
                detail: { name, value }
            }));
        });
    }

    return dialog;
}

let toneMapperDialog = createDialogForToneMapper(toneMapper);
mainDialog.getToneMapperSettingsContainer().appendChild(toneMapperDialog);

function setToneMapper(which) {
    const toneMapperClass = ToneMapperFactory(which);
    toneMapper.destroy();
    toneMapper = new toneMapperClass(gl);

    toneMapperDialog.remove();
    toneMapperDialog = createDialogForToneMapper(toneMapper);
    const container = mainDialog.getToneMapperSettingsContainer();
    container.appendChild(toneMapperDialog);
}

mainDialog.addEventListener('tonemapperchange', e => {
    setToneMapper(mainDialog.getSelectedToneMapper());
});

//mainDialog.addEventListener('recordanimation', handleRecordAnimation);

//async function handleRecordAnimation(e) {
//    renderingContext.recordAnimation(e.detail);
//}

document.body.addEventListener('dragover', e => e.preventDefault());
document.body.addEventListener('drop', async e => {
    e.preventDefault();
    const [file] = e.dataTransfer.files;
    if (!file) {
        return;
    }
    if (!file.name.toLowerCase().endsWith('.bvp.saf')) {
        throw new Error('Filename extension must be .bvp.saf');
    }
    const safReaderClass = ReaderFactory('saf');
    const safReader = new safReaderClass(file);
    const bvpReaderClass = ReaderFactory('bvp');
    const bvpReader = new bvpReaderClass(safReader);
    const modality = await bvpReader.readModality(0);

    const size = modality.block.dimensions;
    const datatype = 'unorm8';
    const filter = renderingContextDialog.filter;

    const volume = new Volume(gl, { size, datatype, filter });
    volume.writeData(modality.block.data, [0, 0, 0], size);
    setVolume(volume);
});

function setVolume(volumeComponent) {
    volume.removeComponentsOfType(Volume);
    volume.addComponent(volumeComponent);
    renderer.reset(accumulationBuffer, scene);
}

async function handleVolumeLoad(e) {
    const options = e.detail;
    if (options.type === 'file') {
        if (options.filetype !== 'raw') {
            throw new Error(`Only .raw files`);
        }
        const size = options?.dimensions ?? [1, 1, 1];
        let datatype;
        switch (options?.precision) {
            case 8: datatype = 'unorm8'; break;
            case 16: datatype = 'unorm16'; break;
            default: throw new Error(`Precision ${options?.precision} not supported`);
        }
        const volume = await loadRAW(options.file, gl, size, datatype);
        volume.setFilter(renderingContextDialog.filter);
        setVolume(volume);
    } else if (options.type === 'url') {
        const file = await fetch(options.url).then(response => response.blob());
        if (!file.name.toLowerCase().endsWith('.bvp.saf')) {
            throw new Error('Filename extension must be .bvp.saf');
        }
        const safReaderClass = ReaderFactory('saf');
        const safReader = new safReaderClass(file);
        const bvpReaderClass = ReaderFactory('bvp');
        const bvpReader = new bvpReaderClass(safReader);
        const modality = await bvpReader.readModality(0);

        const size = modality.block.dimensions;
        const datatype = 'unorm8';
        const filter = renderingContextDialog.filter;

        const volume = new Volume(gl, { size, datatype, filter });
        volume.writeData(modality.block.data, [0, 0, 0], size);
        setVolume(volume);
    }
}

function handleEnvmapLoad(e) {
    const options = e.detail;
    let image = new Image();
    image.crossOrigin = 'anonymous';
    image.addEventListener('load', () => {
        renderingContext.setEnvironmentMap(image);
        renderingContext.renderer.reset(accumulationBuffer, scene);
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
