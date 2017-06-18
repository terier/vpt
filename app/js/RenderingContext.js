var RenderingContext = (function() {
'use strict';

function RenderingContext() {
    this._canvas = null;
    this._gl = null;
    this._camera = null;
    this._cameraController = null;
    this._renderer = null;
    this._toneMapper = null;

    this._volumeTexture = null;
    this._transferFunction = null;
    this._program = null;
    this._clipQuad = null;

    this._render = this._render.bind(this);

    this._init();
}

var _ = RenderingContext.prototype;

_._init = function() {
    this._canvas = document.createElement('canvas');
    this._gl = WebGLUtils.getContext(this._canvas, ['webgl2'], {
        alpha: false,
        depth: false,
        stencil: false,
        antialias: false,
        preserveDrawingBuffer: true
    });
    var gl = this._gl;

    this._volumeTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_3D, this._volumeTexture);
    gl.texImage3D(gl.TEXTURE_3D, 0, gl.R16F,
        1, 1, 1,
        0, gl.RED, gl.FLOAT, new Float32Array([1]));
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);
    gl.bindTexture(gl.TEXTURE_3D, null);

    this._camera = new Camera();
    this._renderer = new MIPRenderer(gl, this._volumeTexture);

    this._camera.position.z = -1.5;
    this._camera.position.y = 0.5;
    this._camera.position.x = 0.5;
    this._camera.fovX = 0.3;
    this._camera.fovY = 0.3;

    this._camera.updateMatrices();
    var tr = new Matrix();
    tr.multiply(this._camera.projectionMatrix, this._camera.viewMatrix).inverse().transpose();
    this._renderer.setMvpInverseMatrix(tr);

    this._program = WebGLUtils.compileShaders(gl, {
        quad: SHADERS.quad
    }, MIXINS).quad;

    this._clipQuad = WebGLUtils.createClipQuad(gl);
};

_.destroy = function() {
    if (this._canvas.parentNode) {
        this._canvas.parentNode.removeChild(this._canvas);
    }

    this._renderer.destroy();
    this._camera.destroy();
    var gl = this._gl;
    gl.deleteProgram(this._program);
    gl.deleteBuffer(this._clipQuad);

    this._canvas = null;
    this._gl = null;
    this._camera = null;
    this._cameraController = null;
    this._renderer = null;
    this._toneMapper = null;

    this._volumeTexture = null;
    this._transferFunction = null;
    this._program = null;
};

_.resize = function(w, h) {
    var gl = this._gl;
    this._canvas.width = w;
    this._canvas.height = h;
};

_.setVolume = function(volume) {
    var gl = this._gl;
    gl.bindTexture(gl.TEXTURE_3D, this._volumeTexture);
    gl.texImage3D(gl.TEXTURE_3D, 0, gl.R16F,
        volume.width, volume.height, volume.depth,
        0, gl.RED, gl.FLOAT, volume.data);
    gl.bindTexture(gl.TEXTURE_3D, null);
};

_.getCanvas = function() {
    return this._canvas;
};

_._render = function() {
    var gl = this._gl;

    // TODO: pipeline goes here
    this._renderer.render();

    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    var program = this._program;
    gl.useProgram(program.program);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindBuffer(gl.ARRAY_BUFFER, this._clipQuad);
    var aPosition = program.attributes.aPosition;
    gl.enableVertexAttribArray(aPosition);
    gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this._renderer.getTexture());
    gl.uniform1i(program.uniforms.uTexture, 0);
    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);

    gl.disableVertexAttribArray(aPosition);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindTexture(gl.TEXTURE_2D, null);
};

_.startRendering = function() {
    Ticker.add(this._render);
};

_.stopRendering = function() {
    Ticker.remove(this._render);
};

return RenderingContext;

})();
