var OrbitCameraController = (function() {

function OrbitCameraController(camera, element, options) {
    this._opts = $.extend({}, this.constructor.defaults, options);

    this._camera = camera;
    this._element = element;

    this._rotationSpeed = this._opts.rotationSpeed;
    this._zoomSpeed = this._opts.zoomSpeed;

    this._startX = 0;
    this._startY = 0;
    this._isMoving = false;

    this._handleMouseDown = this._handleMouseDown.bind(this);
    this._handleMouseUp = this._handleMouseUp.bind(this);
    this._handleMouseMove = this._handleMouseMove.bind(this);
    this._handleMouseWheel = this._handleMouseWheel.bind(this);

    this._addEventListeners();
}

OrbitCameraController.defaults = {
    rotationSpeed: 0.03,
    zoomSpeed: 0.01
};

var _ = OrbitCameraController.prototype;

_.destroy = function() {
    this._removeEventListeners();
};

_._addEventListeners = function() {
    this._element.addEventListener('mousedown', this._handleMouseDown);
    this._element.addEventListener('mouseup', this._handleMouseUp);
    this._element.addEventListener('mousemove', this._handleMouseMove);
    this._element.addEventListener('mousewheel', this._handleMouseWheel);
};

_._removeEventListeners = function() {
    this._element.removeEventListener('mousedown', this._handleMouseDown);
    this._element.removeEventListener('mouseup', this._handleMouseUp);
    this._element.removeEventListener('mousemove', this._handleMouseMove);
    this._element.removeEventListener('mousewheel', this._handleMouseWheel);
};

_._handleMouseDown = function(e) {
    e.preventDefault();
    this._startX = e.pageX;
    this._startY = e.pageY;
    this._isMoving = true;
};

_._handleMouseUp = function(e) {
    e.preventDefault();
    this._isMoving = false;
};

_._handleMouseMove = function(e) {
    e.preventDefault();
    if (this._isMoving) {
        var x = e.pageX;
        var y = e.pageY;
        var dx = x - this._startX;
        var dy = y - this._startY;

        var angleX = dx * this._rotationSpeed;
        var angleY = dy * this._rotationSpeed;
        var angle = angleX * angleX + angleY * angleY;
        var movement = new Vector(-angleX, angleY, 0);
        var axis = new Vector().cross(new Vector(0, 0, 1), movement).normalize();
        var camRot = this._camera.rotation.clone();
        var rotation = new Quaternion(axis.x, axis.y, axis.z, 0);
        rotation.multiply(rotation, camRot);
        camRot.inverse();
        rotation.multiply(camRot, rotation);
        rotation.w = angle;
        rotation.fromAxisAngle();
        this._camera.rotation.multiply(this._camera.rotation, rotation);
        this._camera.rotation.normalize();
        var position = this._camera.position;
        var positionQuat = new Quaternion(position.x, position.y, position.z, 0);
        rotation.inverse();
        positionQuat.multiply(rotation, positionQuat);
        rotation.inverse();
        positionQuat.multiply(positionQuat, rotation);
        this._camera.position.set(positionQuat.x, positionQuat.y, positionQuat.z);
        this._camera.isDirty = true;

        this._startX = x;
        this._startY = y;
    }
};

_._handleMouseWheel = function(e) {
    e.preventDefault();
    var amount = e.deltaY * this._zoomSpeed;
    this._camera.zoom(amount);
    if (e.shiftKey) {
        var scale = Math.exp(-amount);
        this._camera.position.mul(new Vector(scale, scale, scale, 1));
    }
};

return OrbitCameraController;

})();
