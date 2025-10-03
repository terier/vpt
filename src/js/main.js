import { quat } from '../lib/gl-matrix-module.js';

import { DOMUtils } from './utils/DOMUtils.js';

import './ui/UI.js';

import { ReaderFactory } from './readers/ReaderFactory.js';
import { SAFReader } from './readers/SAFReader.js';
import { loadRAW } from './readers/loadRAW.js';
import { RendererFactory } from './renderers/RendererFactory.js';
import { ToneMapperFactory } from './tonemappers/ToneMapperFactory.js';

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
camera.addComponent(new OrbitCameraAnimator(camera, canvas));
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
let renderer = new rendererClass(gl, scene, {
    resolution: [canvas.width, canvas.height],
});
renderer.reset();

const toneMapperClass = ToneMapperFactory('artistic');
let toneMapper = new toneMapperClass(gl, renderer.getTexture(), {
    resolution: [canvas.width, canvas.height],
});

const renderToCanvas = buildPrograms(gl, {
    quad: SHADERS.quad
}, MIXINS).quad;

// Main application functions
function update(t, dt) {
    for (const node of scene) {
        for (const component of node.components) {
            component.update?.(t, dt);
        }
    }
}

function resize({ displaySize: { width, height }}) {
    renderer.setResolution(width, height);
    toneMapper.setResolution(width, height);
    camera.getComponentOfType(Camera).aspect = width / height;
}

function render() {
    // TODO: execute render graph
    //renderer.render(scene, camera);

    renderer.render();
    toneMapper.setTexture(renderer.getTexture());
    toneMapper.render();

    const { program, uniforms } = renderToCanvas;
    gl.useProgram(program);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, toneMapper.getTexture());
    gl.uniform1i(uniforms.uTexture, 0);

    gl.drawArrays(gl.TRIANGLES, 0, 3);
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
    renderer.reset();
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
    renderer.destroy();

    const rendererClass = RendererFactory(which);
    renderer = new rendererClass(gl, scene, {
        resolution: [canvas.width, canvas.height],
    });
    renderer.reset();

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
    toneMapper.destroy();

    const toneMapperClass = ToneMapperFactory(which);
    toneMapper = new toneMapperClass(gl, renderer.getTexture(), {
        resolution: [canvas.width, canvas.height],
    });

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
    renderer.reset();
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
        //const readerClass = ReaderFactory(options.filetype);
        //if (readerClass) {
        //    const file = await fetch(options.url).then(response => response.blob());
        //    const reader = new readerClass(file);
        //    //await setVolume(reader);
        //}
        throw new Error(`Not yet working`);
    }
}

function handleEnvmapLoad(e) {
    const options = e.detail;
    let image = new Image();
    image.crossOrigin = 'anonymous';
    image.addEventListener('load', () => {
        renderingContext.setEnvironmentMap(image);
        renderingContext.renderer.reset();
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
