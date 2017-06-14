var RenderingContext = (function() {
'use strict';

function RenderingContext() {
    this._canvas = document.createElement('canvas');
    this._gl = WebGLUtils.getContext(this._canvas, ['webgl2'], {
        alpha: false,
        depth: false,
        stencil: false,
        antialias: false,
        preserveDrawingBuffer: true
    });
    var gl = this._gl;
    this._camera = new Camera();
    this._cameraController = null;
    this._renderer = new MIPRenderer(gl);

    this._volumeTexture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
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
    this._transferFunction = null;
}

var _ = RenderingContext.prototype;

_.destroy = function() {
    if (this._canvas.parentNode) {
        this._canvas.parentNode.removeChild(this._canvas);
    }

    this._renderer.destroy();
    this._camera.destroy();

    this._canvas = null;
    this._gl = null;
    this._camera = null;
    this._cameraController = null;
    this._renderer = null;

    this._volumeTexture = null;
    this._transferFunction = null;
};

_.resize = function(w, h) {
    var gl = this._gl;
    this._canvas.width = w;
    this._canvas.height = h;
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
};

_.setVolume = function(volume) {
    var gl = this._gl;
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_3D, this._volumeTexture);
    gl.texImage3D(gl.TEXTURE_3D, 0, gl.R16F,
        volume.width, volume.height, volume.depth,
        0, gl.RED, gl.FLOAT, volume.data);
    gl.bindTexture(gl.TEXTURE_3D, null);
};

_.getCanvas = function() {
    return this._canvas;
};

_.render = function() {
};

return RenderingContext;

})();
