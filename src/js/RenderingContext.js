// #package js/main

// #include math
// #include WebGL.js
// #include Ticker.js
// #include Camera.js
// #include OrbitCameraController.js
// #include Volume.js
// #include renderers
// #include tonemappers

class RenderingContext {

constructor(options) {
    this._render = this._render.bind(this);
    this._webglcontextlostHandler = this._webglcontextlostHandler.bind(this);
    this._webglcontextrestoredHandler = this._webglcontextrestoredHandler.bind(this);

    Object.assign(this, {
        _resolution : 1024,
        _filter     : 'linear'
    }, options);

    this._canvas = document.createElement('canvas');
    this._canvas.addEventListener('webglcontextlost', this._webglcontextlostHandler);
    this._canvas.addEventListener('webglcontextrestored', this._webglcontextrestoredHandler);

    this._initGL();

    this._camera = new Camera();
    this._camera.position.z = 1.5;
    this._camera.fovX = 0.3;
    this._camera.fovY = 0.3;
    this._camera.updateMatrices();

    this._cameraController = new OrbitCameraController(this._camera, this._canvas);

    this._volume = new Volume(this._gl);
    this._scale = new Vector(1, 1, 1);
    // this._scale = new Vector(1, 1, 0.5); // Hardcoded, couse why not
    this._translation = new Vector(0, 0, 0);
    // this._translation = new Vector(0, 0, 1.3);
    this._rotation = new Vector(0, 0, 0)

    this._isTransformationDirty = true;
    this._updateMvpInverseMatrix();
}

// ============================ WEBGL SUBSYSTEM ============================ //

_initGL() {
    const contextSettings = {
        alpha                 : false,
        depth                 : false,
        stencil               : false,
        antialias             : false,
        preserveDrawingBuffer : true,
    };

    this._contextRestorable = true;

    this._gl = this._canvas.getContext('webgl2-compute', contextSettings);
    if (this._gl) {
        this._hasCompute = true;
    } else {
        this._hasCompute = false;
        this._gl = this._canvas.getContext('webgl2', contextSettings);
    }
    const gl = this._gl;
    this._extLoseContext = gl.getExtension('WEBGL_lose_context');
    this._extColorBufferFloat = gl.getExtension('EXT_color_buffer_float');

    gl.getExtension('OES_texture_float_linear');

    if (!this._extColorBufferFloat) {
        console.error('EXT_color_buffer_float not supported!');
    }

    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);

    this._environmentTexture = WebGL.createTexture(gl, {
        width          : 1,
        height         : 1,
        data           : new Uint8Array([255, 255, 255, 255]),
        format         : gl.RGBA,
        internalFormat : gl.RGBA, // TODO: HDRI & OpenEXR support
        type           : gl.UNSIGNED_BYTE,
        wrapS          : gl.CLAMP_TO_EDGE,
        wrapT          : gl.CLAMP_TO_EDGE,
        min            : gl.LINEAR,
        max            : gl.LINEAR
    });

    this._program = WebGL.buildPrograms(gl, {
        quad: SHADERS.quad
    }, MIXINS).quad;

    this._clipQuad = WebGL.createClipQuad(gl);
}

_webglcontextlostHandler(e) {
    if (this._contextRestorable) {
        e.preventDefault();
    }
}

_webglcontextrestoredHandler(e) {
    this._initGL();
}

resize(width, height) {
    this._canvas.width = width;
    this._canvas.height = height;
    this._camera.resize(width, height);
}

setVolume(reader) {
    this._volume = new Volume(this._gl, reader);
    this._volume.readMetadata({
        onData: () => {
            this._volume.readModality('default', {
                onLoad: () => {
                    this._volume.setFilter(this._filter);
                    if (this._renderer) {
                        this._renderer.setVolume(this._volume);
                        this.startRendering();
                    }
                }
            });
        }
    });
}

setEnvironmentMap(image) {
    WebGL.createTexture(this._gl, {
        texture : this._environmentTexture,
        image   : image
    });
}

setFilter(filter) {
    this._filter = filter;
    if (this._volume) {
        this._volume.setFilter(filter);
        if (this._renderer) {
            this._renderer.reset();
        }
    }
}

chooseRenderer(renderer) {
    if (this._renderer) {
        this._renderer.destroy();
    }
    const rendererClass = this._getRendererClass(renderer);
    this._renderer = new rendererClass(this._gl, this._volume, this._environmentTexture);
    if (this._toneMapper) {
        this._toneMapper.setTexture(this._renderer.getTexture());
    }
    this._isTransformationDirty = true;
}

chooseToneMapper(toneMapper) {
    if (this._toneMapper) {
        this._toneMapper.destroy();
    }
    const gl = this._gl;
    let texture;
    if (this._renderer) {
        texture = this._renderer.getTexture();
    } else {
        texture = WebGL.createTexture(gl, {
            width  : 1,
            height : 1,
            data   : new Uint8Array([255, 255, 255, 255]),
        });
    }
    const toneMapperClass = this._getToneMapperClass(toneMapper);
    this._toneMapper = new toneMapperClass(gl, texture);
}

getCanvas() {
    return this._canvas;
}

getRenderer() {
    return this._renderer;
}

getToneMapper() {
    return this._toneMapper;
}

_updateMvpInverseMatrix() {
    if (!this._camera.isDirty && !this._isTransformationDirty) {
        return;
    }
    this._camera.isDirty = false;
    this._isTransformationDirty = false;
    this._camera.updateMatrices();

    const centerTranslation = new Matrix().fromTranslation(-0.5, -0.5, -0.5);
    const volumeTranslation = new Matrix().fromTranslation(
        this._translation.x, this._translation.y, this._translation.z);
    const volumeScale = new Matrix().fromScale(this._scale.x, this._scale.y, this._scale.z);
    // Lesar bo jezen
    const volumeRotationX = new Matrix().fromRotationX(this._rotation.x);
    const volumeRotationY = new Matrix().fromRotationY(this._rotation.y);
    const volumeRotationZ = new Matrix().fromRotationZ(this._rotation.z);

    const tr = new Matrix();
    tr.multiply(volumeScale, centerTranslation);

    tr.multiply(volumeRotationX, tr);
    tr.multiply(volumeRotationY, tr);
    tr.multiply(volumeRotationZ, tr);

    tr.multiply(volumeTranslation, tr);
    tr.multiply(this._camera.transformationMatrix, tr);

    tr.inverse().transpose();
    if (this._renderer) {
        // this._renderer._pauseRendering();
        this._renderer.setMvpInverseMatrix(tr);
        this._renderer.reset();
    }
}

startSequence(testingTime= 30, intervals= 1000, saveAs) {
    // VISMAE
    // this.setScale(1, 0.792, 0.783);
    // this.setRotation(-87, 177, 0);
    // this.setTranslation(0, 0, 0.7);
    // this.sequence = [[0, 60, 0, 2000, 1, 15000], [-80, -55, 0, 2000, 1, 15000]];

    // BABY
    this.setScale(1, 1, 0.5);
    this.setRotation(90, 0, 0);
    // this.setTranslation(0, 0, 0.8);
    this._camera.zoom(-0.8)
    this.sequence = [[0, 60, 0, 4000, 1, 30000], [80, -55, 0, 4000, 1, 30000]];


    this._camera.isDirty = true;
    this._isTransformationDirty = true;
    this._updateMvpInverseMatrix();
    this.startRotate(...this.sequence[0]);
    this.sequence.shift();
    this._renderer.startTesting(testingTime, intervals, saveAs);
}

startRotate(dx, dy, dz, duration, step, delay= 0) {
    // const rotationSpeed = 2
    // const camera = rc._camera
    // const cameraController = rc._cameraController
    // const angleX = dx * rotationSpeed * cameraController._focus * camera.zoomFactor;
    // const angleY = dy * rotationSpeed * cameraController._focus * camera.zoomFactor;
    //
    // cameraController._rotateAroundSelf(angleX, angleY)
    this.targetRotation = new Vector(dx * Math.PI / 180, dy * Math.PI / 180, dz * Math.PI / 180);

    this.rotationTimer = new Date();
    this.rotationDuration = duration;
    this.rotationRemaining = duration;
    this.rotationStep = step;
    this.delay = delay;

    // this._isTransformationDirty = true;
    // this._updateMvpInverseMatrix()
    this.isRotating = true;
}

setRotation(x, y, z) {
    this._rotation.set(x * Math.PI / 180, y * Math.PI / 180, z * Math.PI / 180);
    this._isTransformationDirty = true;
}

rotate() {
    if (!this.isRotating)
        return
    const currentTime = new Date()
    const timeDiff = currentTime - this.rotationTimer;

    if (this.delay > 0) {
        this.delay -= timeDiff
        this.rotationTimer = currentTime
        return
    }

    if (timeDiff > this.rotationStep) {
        this.rotationRemaining -= timeDiff
        const completion = timeDiff / this.rotationDuration
        this._rotation.x += this.targetRotation.x * completion
        this._rotation.y += this.targetRotation.y * completion
        this._rotation.z += this.targetRotation.z * completion
        this.rotationTimer = currentTime
        this._isTransformationDirty = true;
        if (this.rotationRemaining <= 0) {
            this.isRotating = false
            if (this.sequence.length > 0) {
                this.startRotate(...this.sequence[0])
                this.sequence.shift()
            }
        }
    }
}

_render() {
    const gl = this._gl;
    if (!gl || !this._renderer || !this._toneMapper) {
        return;
    }
    this.rotate()
    this._updateMvpInverseMatrix();

    this._renderer.render();
    this._toneMapper.render();

    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    const program = this._program;
    gl.useProgram(program.program);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindBuffer(gl.ARRAY_BUFFER, this._clipQuad);
    const aPosition = program.attributes.aPosition;
    gl.enableVertexAttribArray(aPosition);
    gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this._toneMapper.getTexture());
    gl.uniform1i(program.uniforms.uTexture, 0);
    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);

    gl.disableVertexAttribArray(aPosition);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindTexture(gl.TEXTURE_2D, null);
}

getScale() {
    return this._scale;
}

setScale(x, y, z) {
    this._scale.set(x, y, z);
    this._isTransformationDirty = true;
}

getTranslation() {
    return this._translation;
}

setTranslation(x, y, z) {
    this._translation.set(x, y, z);
    this._isTransformationDirty = true;
}

getResolution() {
    return this._resolution;
}

setResolution(resolution) {
    if (this._renderer) {
        this._renderer.setResolution(resolution);
    }
    if (this._toneMapper) {
        this._toneMapper.setResolution(resolution);
        if (this._renderer) {
            this._toneMapper.setTexture(this._renderer.getTexture());
        }
    }
}

startRendering() {
    Ticker.add(this._render);
}

stopRendering() {
    Ticker.remove(this._render);
}

hasComputeCapabilities() {
    return this._hasCompute;
}

_getRendererClass(renderer) {
    switch (renderer) {
        case 'mip' : return MIPRenderer;
        case 'iso' : return ISORenderer;
        case 'eam' : return EAMRenderer;
        case 'mcs' : return MCSRenderer;
        case 'mcm' : return MCMRenderer;
        case 'mcc' : return MCCRenderer;
        case 'fcd' : return FCDRenderer;
        case 'fcn' : return FCNRenderer;
        case 'rcd' : return RCDRenderer;
        case 'rcn' : return RCNRenderer;
        case 'mcd' : return MCDRenderer;
        default    : return MIPRenderer;
    }
}

_getToneMapperClass(toneMapper) {
    switch (toneMapper) {
        case 'range'    : return RangeToneMapper;
        case 'reinhard' : return ReinhardToneMapper;
        case 'artistic' : return ArtisticToneMapper;
        case 'de_noise' : return SmartDeNoiseToneMapper;
    }
}

}
