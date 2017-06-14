var RendererController = (function() {
'use strict';

function RendererController(renderer) {
    this._renderer = renderer;
    var canvas = renderer.getCanvas();
    this._camera = new Camera();
    this._camera.position.z = -2;
    this._camera.fovX = canvas.width * 0.001;
    this._camera.fovY = canvas.height * 0.001;

    this._volumeRotation = new Quaternion();

    this._mvpInverseMatrix = new Matrix();
    this._volumeTransformation = new Matrix();
    this._volumeTranslation = new Matrix().fromTranslation(-0.5, -0.5, -0.5);
    this._volumeScale = new Matrix().fromScale(1, 1, 1);

    this.resizeScale = 0;
    this.zoomSpeed = 0.01;

    this._sx = 1;
    this._sy = 1;
    this._sz = 1;

    this._lastX = 0;
    this._lastY = 0;
    this._isMoving = false;

    this._handleMouseDown = this._handleMouseDown.bind(this);
    this._handleMouseUp = this._handleMouseUp.bind(this);
    this._handleMouseMove = this._handleMouseMove.bind(this);
    this._handleMouseWheel = this._handleMouseWheel.bind(this);

    canvas.addEventListener('mousedown', this._handleMouseDown);
    canvas.addEventListener('touchstart', this._handleMouseDown);
    canvas.addEventListener('mouseup', this._handleMouseUp);
    canvas.addEventListener('touchend', this._handleMouseUp);
    canvas.addEventListener('mousemove', this._handleMouseMove);
    canvas.addEventListener('touchmove', this._handleMouseMove);
    canvas.addEventListener('wheel', this._handleMouseWheel);
}

var _ = RendererController.prototype;

_.resize = function(w, h) {
    var canvas = this._renderer.getCanvas();
    var camera = this._camera;
    var w0 = canvas.width;
    var h0 = canvas.height;
    var fxa = camera.fovX;
    var fya = camera.fovY;
    var fxb = fxa * (w / w0);
    var fyb = fya * (h / h0);
    var areaScale = (w / w0) * (h / h0);
    var fxc = fxb / Math.sqrt(areaScale);
    var fyc = fyb / Math.sqrt(areaScale);
    camera.fovX = fxb + this.resizeScale * (fxc - fxb);
    camera.fovY = fyb + this.resizeScale * (fyc - fyb);
    this._renderer.resize(w, h);
};

_.zoom = function(amount, shouldChangeFov) {
    var camera = this._camera;
    var scale = Math.exp(amount * this.zoomSpeed);
    if (shouldChangeFov) {
        camera.fovX *= scale;
        camera.fovY *= scale;
    } else {
        camera.position.mul(new Vector(scale, scale, scale, 1));
    }
};

_.render = function() {
    this._camera.updateTransformation();
    this._volumeRotation.toRotationMatrix(this._volumeTransformation.m);
    this._volumeScale.fromScale(this._sx, this._sy, this._sz);
    this._volumeTransformation.multiply(this._volumeTransformation, this._volumeScale);
    this._volumeTransformation.multiply(this._volumeTransformation, this._volumeTranslation);

    this._mvpInverseMatrix.multiply(this._camera.projectionMatrix, this._camera.viewMatrix);
    this._mvpInverseMatrix.multiply(this._mvpInverseMatrix, this._volumeTransformation);

    this._mvpInverseMatrix.inverse().transpose();
    this._renderer.setMvpInverseMatrix(this._mvpInverseMatrix);
    this._renderer.render();
};

_.setScale = function(sx, sy, sz) {
    this._sx = sx;
    this._sy = sy;
    this._sz = sz;
};

_.setVolume = function(volume) {
    this._renderer.setVolume(volume);
};

_._handleMouseDown = function(e) {
    e.preventDefault();
    this._isMoving = true;
    this._lastX = e.clientX || e.touches[0].clientX;
    this._lastY = e.clientY || e.touches[0].clientY;
};

_._handleMouseUp = function(e) {
    e.preventDefault();
    this._isMoving = false;
};

_._handleMouseMove = function(e) {
    e.preventDefault();
    if (this._isMoving) {
        var x = e.clientX || e.touches[0].clientX;
        var y = e.clientY || e.touches[0].clientY;
        var dx = x - this._lastX;
        var dy = y - this._lastY;

        var speed = 0.005;
        var camera = this._camera;

        var qx = new Quaternion(0, 1, 0, dx * speed).fromAxisAngle();
        var qy = new Quaternion(1, 0, 0, dy * speed).fromAxisAngle();
        var rot = this._volumeRotation;
        rot.multiply(rot, qx);
        rot.multiply(rot, qy);
    }

    this._lastX = x;
    this._lastY = y;
};

_._handleMouseWheel = function(e) {
    this.zoom(e.deltaY, e.shiftKey);
};

return RendererController;

})();
