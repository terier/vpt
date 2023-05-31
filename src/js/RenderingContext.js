import { WebGL } from './WebGL.js';
import { Ticker } from './Ticker.js';

import { Node } from './Node.js';
import { PerspectiveCamera } from './PerspectiveCamera.js';
import { Volume } from './Volume.js';
import { ConductorVolume } from './ConductorVolume.js';

import { RendererFactory } from './renderers/RendererFactory.js';
import { ToneMapperFactory } from './tonemappers/ToneMapperFactory.js';

import { CircleAnimator } from './animators/CircleAnimator.js';
import { CircleFocusAnimator } from './animators/CircleFocusAnimator.js';
import { OrbitCameraAnimator } from './animators/OrbitCameraAnimator.js';

const [ SHADERS, MIXINS ] = await Promise.all([
    'shaders.json',
    'mixins.json',
].map(url => fetch(url).then(response => response.json())));

export class RenderingContext extends EventTarget {

constructor(options = {}) {
    super();

    this.render = this.render.bind(this);
    this.webglcontextlostHandler = this.webglcontextlostHandler.bind(this);
    this.webglcontextrestoredHandler = this.webglcontextrestoredHandler.bind(this);

    this.canvas = document.createElement('canvas');
    this.canvas.addEventListener('webglcontextlost', this.webglcontextlostHandler);
    this.canvas.addEventListener('webglcontextrestored', this.webglcontextrestoredHandler);

    this.initGL();

    this.resolution = options.resolution ?? 1024;
    this.filter = options.filter ?? 'linear';

    this.camera = new Node();
    this.camera.transform.localTranslation = [0, 0, 2];
    this.camera.components.push(new PerspectiveCamera(this.camera));

    this.camera.transform.addEventListener('change', e => {
        if (this.renderer) {
            this.renderer.reset();
        }
    });

    //this.cameraAnimator = new CircleAnimator(this.camera, {
    //    center: new Vector(0, 0, 3),
    //    direction: new Vector(0, 0, 1),
    //    radius: 0.03,
    //    frequency: 1,
    //});
    //this.cameraAnimator = new CircleFocusAnimator(this.camera, {
    //    focus: new Vector(0, 0, 0),
    //    displacement: new Vector(0, -3, 0),
    //    up: new Vector(0, 0, 1),
    //    coneAngle: 0.1,
    //    phase: 0,
    //    frequency: 1,
    //});
    this.cameraAnimator = new OrbitCameraAnimator(this.camera, this.canvas);

    this.volume = new Volume(this.gl);
    this.scale = new Vector(1, 1, 1);
    this.translation = new Vector(0, 0, 0);
    this.rotation = new Vector(0, 0, 0);
    this.isTransformationDirty = true;
    this.updateMvpInverseMatrix();
}

// ============================ WEBGL SUBSYSTEM ============================ //

initGL() {
    const contextSettings = {
        alpha: false,
        depth: false,
        stencil: false,
        antialias: false,
        preserveDrawingBuffer: true,
    };

    this.contextRestorable = true;

    this.gl = this.canvas.getContext('webgl2', contextSettings);
    const gl = this.gl;

    this.extLoseContext = gl.getExtension('WEBGL_lose_context');
    this.extColorBufferFloat = gl.getExtension('EXT_color_buffer_float');
    this.extTextureFloatLinear = gl.getExtension('OES_texture_float_linear');

    if (!this.extColorBufferFloat) {
        console.error('EXT_color_buffer_float not supported!');
    }

    if (!this.extTextureFloatLinear) {
        console.error('OES_texture_float_linear not supported!');
    }

    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);

    this.environmentTexture = WebGL.createTexture(gl, {
        width   : 1,
        height  : 1,
        data    : new Uint8Array([255, 255, 255, 255]),
        format  : gl.RGBA,
        iformat : gl.RGBA, // TODO: HDRI & OpenEXR support
        type    : gl.UNSIGNED_BYTE,
        wrapS   : gl.CLAMP_TO_EDGE,
        wrapT   : gl.CLAMP_TO_EDGE,
        min     : gl.LINEAR,
        max     : gl.LINEAR,
    });

    this.program = WebGL.buildPrograms(gl, {
        quad: SHADERS.quad
    }, MIXINS).quad;
}

webglcontextlostHandler(e) {
    if (this.contextRestorable) {
        e.preventDefault();
    }
}

webglcontextrestoredHandler(e) {
    this.initGL();
}

resize(width, height) {
    this.canvas.width = width;
    this.canvas.height = height;
    this.camera.getComponent(PerspectiveCamera).aspect = width / height;
}

async setVolume(reader) {
    const metadata = await reader.readMetadata();
    const type = metadata.modalities.find(m => m.name === 'id') ? 'conductor' : 'normal';
    if (type === 'conductor') {
        this.volume = new ConductorVolume(this.gl, reader);
    } else if (type === 'normal') {
        this.volume = new Volume(this.gl, reader);
    }
    this.volume.addEventListener('progress', e => {
        this.dispatchEvent(new CustomEvent('progress', { detail: e.detail }));
    });
    await this.volume.load();
    if (type === 'conductor') {
        this.dispatchEvent(new CustomEvent('attributechange', {
            detail: [...this.volume.attributes]
        }));
    }
    this.volume.setFilter(this._filter);
    if (this.renderer) {
        this.renderer.setVolume(this.volume);
    }
}

setEnvironmentMap(image) {
    WebGL.createTexture(this.gl, {
        texture : this.environmentTexture,
        image   : image
    });
}

setFilter(filter) {
    this.filter = filter;
    if (this.volume) {
        this.volume.setFilter(filter);
        if (this.renderer) {
            this.renderer.reset();
        }
    }
}

chooseRenderer(renderer) {
    if (this.renderer) {
        this.renderer.destroy();
    }
    const rendererClass = RendererFactory(renderer);
    this.renderer = new rendererClass(this.gl, this.volume, this.camera, this.environmentTexture, {
        resolution: this.resolution,
    });
    this.renderer.reset();
    if (this.toneMapper) {
        this.toneMapper.setTexture(this.renderer.getTexture());
    }
    this.isTransformationDirty = true;
}

chooseToneMapper(toneMapper) {
    if (this.toneMapper) {
        this.toneMapper.destroy();
    }
    const gl = this.gl;
    let texture;
    if (this.renderer) {
        texture = this.renderer.getTexture();
    } else {
        texture = WebGL.createTexture(gl, {
            width  : 1,
            height : 1,
            data   : new Uint8Array([255, 255, 255, 255]),
        });
    }
    const toneMapperClass = ToneMapperFactory(toneMapper);
    this.toneMapper = new toneMapperClass(gl, texture, {
        resolution: this.resolution,
    });
}

render() {
    const gl = this.gl;
    if (!gl || !this.renderer || !this.toneMapper) {
        return;
    }

    this.renderer.render();
    this.toneMapper.render();

    const { program, uniforms } = this.program;
    gl.useProgram(program);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.toneMapper.getTexture());
    gl.uniform1i(uniforms.uTexture, 0);

    gl.drawArrays(gl.TRIANGLES, 0, 3);
}

getScale() {
    return this.scale;
}

setScale(x, y, z) {
    this.scale.set(x, y, z);
    this.isTransformationDirty = true;
}

getScaleMatrix() {
    return new Matrix().fromScale(
        this.scale.x, this.scale.y, this.scale.z);
}

getTranslation() {
    return this.translation;
}

setTranslation(x, y, z) {
    this.translation.set(x, y, z);
    this.isTransformationDirty = true;
}

getTranslationMatrix() {
    return new Matrix().fromTranslation(
        this.translation.x, this.translation.y, this.translation.z);
}

getRotation() {
    return this.rotation;
}

setRotation(x, y, z) {
    this.rotation.set(x, y, z);
    this.isTransformationDirty = true;
}

getRotationMatrix() {
    const volumeRotationX = new Matrix().fromRotationX(this.rotation.x);
    const volumeRotationY = new Matrix().fromRotationY(this.rotation.y);
    const volumeRotationZ = new Matrix().fromRotationZ(this.rotation.z);
    const volumeRotation = new Matrix();
    volumeRotation.multiply(volumeRotation, volumeRotationX);
    volumeRotation.multiply(volumeRotation, volumeRotationY);
    volumeRotation.multiply(volumeRotation, volumeRotationZ);
    return volumeRotation;
}

getResolution() {
    return this.resolution;
}

set resolution(resolution) {
    this.resolution = resolution;
    this.canvas.width = resolution;
    this.canvas.height = resolution;
    if (this.renderer) {
        this.renderer.setResolution(resolution);
    }
    if (this.toneMapper) {
        this.toneMapper.setResolution(resolution);
        if (this.renderer) {
            this.toneMapper.setTexture(this.renderer.getTexture());
        }
    }
}

async recordAnimation(options = {}) {
    const date = new Date();
    const timestamp = [
        date.getUTCFullYear(),
        date.getUTCMonth(),
        date.getUTCDate(),
        date.getUTCHours(),
        date.getUTCMinutes(),
        date.getUTCSeconds(),
    ].join('_');

    if (options.type === 'images') {
        const parentDirectory = await showDirectoryPicker();
        const directory = await parentDirectory.getDirectoryHandle(timestamp, { create: true });
        this.recordAnimationToImageSequence({ directory, ...options });
    } else if (options.type === 'video') {
        const outputStream = await showSaveFilePicker({
            suggestedName: timestamp + '.mp4',
        }).then(file => file.createWritable());
        this.recordAnimationToVideo({ outputStream, ...options });
    } else {
        throw new Error(`animation output type (${options.type}) not supported`);
    }
}

async recordAnimationToImageSequence(options = {}) {
    const { directory, startTime, endTime, frameTime, fps } = options;
    const frames = Math.max(Math.ceil((endTime - startTime) * fps), 1);
    const timeStep = 1 / fps;

    function wait(millis) {
        return new Promise((resolve, reject) => setTimeout(resolve, millis));
    }

    function pad(number, length) {
        const string = String(number);
        const remaining = length - string.length;
        const padding = new Array(remaining).fill('0').join('');
        return padding + string;
    }

    const canvas = this.canvas;
    function getCanvasBlob() {
        return new Promise((resolve, reject) => {
            canvas.toBlob(blob => resolve(blob));
        });
    }

    this.stopRendering();

    for (let i = 0; i < frames; i++) {
        const t = startTime + i * timeStep;
        this.cameraAnimator.update(t);

        this.renderer.reset();
        this.startRendering();
        await wait(frameTime * 1000);
        this.stopRendering();

        const filename = `frame${pad(i, 4)}.png`;
        const file = await directory.getFileHandle(filename, { create: true })
            .then(file => file.createWritable());
        const blob = await getCanvasBlob();
        file.write(blob);
        file.close();

        this.dispatchEvent(new CustomEvent('animationprogress', {
            detail: (i + 1) / frames
        }));
    }

    this.startRendering();
}

async recordAnimationToVideo(options = {}) {
    const { outputStream, startTime, endTime, frameTime, fps } = options;
    const frames = Math.max(Math.ceil((endTime - startTime) * fps), 1);
    const timeStep = 1 / fps;

    function wait(millis) {
        return new Promise((resolve, reject) => setTimeout(resolve, millis));
    }

    function pad(number, length) {
        const string = String(number);
        const remaining = length - string.length;
        const padding = new Array(remaining).fill('0').join('');
        return padding + string;
    }

    const canvasStream = this.canvas.captureStream(0);
    const videoStream = canvasStream.getVideoTracks()[0];
    const recorder = new MediaRecorder(canvasStream, {
        videoBitsPerSecond : 4 * 1024 * 1024,
    });
    recorder.addEventListener('dataavailable', e => {
        outputStream.write(e.data);
        outputStream.close();
    });

    this.stopRendering();
    recorder.start();

    for (let i = 0; i < frames; i++) {
        const t = startTime + i * timeStep;
        this.cameraAnimator.update(t);

        this.renderer.reset();
        this.startRendering();
        await wait(frameTime * 1000);
        this.stopRendering();

        videoStream.requestFrame();

        this.dispatchEvent(new CustomEvent('animationprogress', {
            detail: (i + 1) / frames
        }));
    }

    recorder.stop();
    this.startRendering();
}

startRendering() {
    Ticker.add(this.render);
}

stopRendering() {
    Ticker.remove(this.render);
}

}
