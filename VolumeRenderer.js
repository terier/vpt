(function(global) {

global.VolumeRenderer = VolumeRenderer;
function VolumeRenderer(canvas) {
    this._raycaster = new VolumeRaycaster();
    this._camera = new Camera();
    this._camera.position.z = -5;
    this._volumeRotation = new Quaternion();
    this._resizeHorizontally = true;

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

    var canvas = this.getCanvas();
    canvas.addEventListener('mousedown', this._handleMouseDown);
    canvas.addEventListener('mouseup', this._handleMouseUp);
    canvas.addEventListener('mousemove', this._handleMouseMove);
    canvas.addEventListener('wheel', this._handleMouseWheel);
}

var _ = VolumeRenderer.prototype;

_.resize = function(width, height) {
    this._raycaster.resize(width, height);
    var camera = this._camera;
    if (this._resizeHorizontally) {
        var scale = width / height;
        camera.fovX = Math.atan(Math.tan(camera.fovY / 2) * scale) * 2;
    } else {
        var scale = height / width;
        camera.fovY = Math.atan(Math.tan(camera.fovX / 2) * scale) * 2;
    }
    this.render();
};

_.zoom = function(amount) {
    var k = 0.01;
    var scale = Math.exp(amount * k);
    var camera = this._camera;
    camera.fovX = Math.atan(Math.tan(camera.fovX / 2) * scale) * 2;
    camera.fovY = Math.atan(Math.tan(camera.fovY / 2) * scale) * 2;
    this.render();
};

_.render = function() {
    var mvpInverseMatrix = new Matrix();
    var volumeTransformation = new Matrix();
    var volumeTranslation = new Matrix().fromTranslation(-0.5, -0.5, -0.5);
    var volumeScale = new Matrix().fromScale(1, 1, 1);

    return function() {
        this._camera.updateTransformation();
        this._volumeRotation.toRotationMatrix(volumeTransformation.m);
        volumeScale.fromScale(this._sx, this._sy, this._sz);
        volumeTransformation.multiply(volumeTransformation, volumeScale);
        volumeTransformation.multiply(volumeTransformation, volumeTranslation);

        mvpInverseMatrix.multiply(this._camera.projectionMatrix, this._camera.viewMatrix);
        mvpInverseMatrix.multiply(mvpInverseMatrix, volumeTransformation);

        mvpInverseMatrix.inverse().transpose();
        this._raycaster.setMvpInverseMatrix(mvpInverseMatrix);
        this._raycaster.render();
    };
}();

_.setScale = function(sx, sy, sz) {
    this._sx = sx;
    this._sy = sy;
    this._sz = sz;
    this.render();
};

_.setVolume = function(volume) {
    this._raycaster.setVolume(volume);
};

_.getCanvas = function() {
    return this._raycaster.getCanvas();
};

_._handleMouseDown = function(e) {
    this._isMoving = true;
    this._lastX = e.clientX;
    this._lastY = e.clientY;
};

_._handleMouseUp = function(e) {
    this._isMoving = false;
};

_._handleMouseMove = function(e) {
    if (this._isMoving) {
        var x = e.clientX;
        var y = e.clientY;
        var dx = x - this._lastX;
        var dy = y - this._lastY;

        var speed = 0.005;
        var camera = this._camera;
        var scale = speed * Math.min(camera.fovX, camera.fovY);

        var qx = new Quaternion(0, 1, 0, dx * scale).fromAxisAngle();
        var qy = new Quaternion(1, 0, 0, dy * scale).fromAxisAngle();
        var rot = this._volumeRotation;
        rot.multiply(rot, qx);
        rot.multiply(rot, qy);

        this.render();
    }

    this._lastX = x;
    this._lastY = y;
};

_._handleMouseWheel = function(e) {
    this.zoom(e.deltaY);
};

})(this);