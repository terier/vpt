(function(global) {
'use strict';

var Class = global.OrbitCameraController = OrbitCameraController;
var _ = Class.prototype;

// ========================== CLASS DECLARATION ============================ //

function OrbitCameraController(camera, domElement, options) {
    this._opts = $.extend(this._opts || {}, Class.defaults, options);

    // option variables
    this._rotationSpeed = this._opts.rotationSpeed;
    this._zoomSpeed = this._opts.zoomSpeed;

    // instance variables
    this._camera = camera;
    this._domElement = domElement;
    this._startX = null;
    this._startY = null;
    this._isMoving = null;

    // function binds
    this._handleMouseDown = this._handleMouseDown.bind(this);
    this._handleMouseUp = this._handleMouseUp.bind(this);
    this._handleMouseMove = this._handleMouseMove.bind(this);
    this._handleMouseWheel = this._handleMouseWheel.bind(this);

    _._init.call(this);
};

Class.defaults = {
    rotationSpeed: 0.01,
    zoomSpeed: 0.003
};

// ======================= CONSTRUCTOR & DESTRUCTOR ======================== //

_._init = function() {
    this._addEventListeners();
};

_.destroy = function() {
    this._removeEventListeners();
};

// =========================== INSTANCE METHODS ============================ //

_._addEventListeners = function() {
    this._domElement.addEventListener('mousedown', this._handleMouseDown);
    this._domElement.addEventListener('mouseup', this._handleMouseUp);
    this._domElement.addEventListener('mousemove', this._handleMouseMove);
    this._domElement.addEventListener('mousewheel', this._handleMouseWheel);
};

_._removeEventListeners = function() {
    this._domElement.removeEventListener('mousedown', this._handleMouseDown);
    this._domElement.removeEventListener('mouseup', this._handleMouseUp);
    this._domElement.removeEventListener('mousemove', this._handleMouseMove);
    this._domElement.removeEventListener('mousewheel', this._handleMouseWheel);
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

        // magic. TODO: find out how this works
        var angleX = dx * this._rotationSpeed;
        var angleY = dy * this._rotationSpeed;
        var angle = Math.sqrt(angleX * angleX + angleY * angleY);
        var movement = new Vector(angleX, -angleY, 0);
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

// ============================ STATIC METHODS ============================= //

})(this);
