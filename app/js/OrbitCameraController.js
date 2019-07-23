//@@math/Vector.js
//@@math/Quaternion.js
//@@Ticker.js

(function(global) {
'use strict';

var Class = global.OrbitCameraController = OrbitCameraController;
var _ = Class.prototype;

// ========================== CLASS DECLARATION ============================ //

function OrbitCameraController(camera, domElement, options) {
    CommonUtils.extend(this, Class.defaults, options);

    this._camera = camera;
    this._domElement = domElement;

    this._update = this._update.bind(this);

    this._handleMouseDown = this._handleMouseDown.bind(this);
    this._handleMouseUp = this._handleMouseUp.bind(this);
    this._handleMouseMove = this._handleMouseMove.bind(this);
    this._handleMouseWheel = this._handleMouseWheel.bind(this);
    this._handleKeyDown = this._handleKeyDown.bind(this);
    this._handleKeyUp = this._handleKeyUp.bind(this);

    _._init.call(this);
};

Class.defaults = {
    rotationSpeed    : 0.01,
    translationSpeed : 0.002,
    moveSpeed        : 0.01,
    zoomSpeed        : 0.001
};

// ======================= CONSTRUCTOR & DESTRUCTOR ======================== //

_._nullify = function() {
    this._startX = null;
    this._startY = null;
    this._isMoving = null;
};

_._init = function() {
    _._nullify.call(this);

    this._focus = this._camera.position.len();

    this._forward = false;
    this._backward = false;
    this._left = false;
    this._right = false;

    this._isTranslating = false;
    this._isRotating = false;

    this._time = Date.now();

    this._addEventListeners();
    Ticker.add(this._update);
};

_.destroy = function() {
    Ticker.remove(this._update);
    this._removeEventListeners();

    _._nullify.call(this);
};

// =========================== INSTANCE METHODS ============================ //

_._addEventListeners = function() {
    this._domElement.addEventListener('mousedown', this._handleMouseDown);
    this._domElement.addEventListener('touchstart', this._handleMouseDown);
    this._domElement.addEventListener('mouseup', this._handleMouseUp);
    this._domElement.addEventListener('touchend', this._handleMouseUp);
    this._domElement.addEventListener('mousemove', this._handleMouseMove);
    this._domElement.addEventListener('touchmove', this._handleMouseMove);
    this._domElement.addEventListener('mousewheel', this._handleMouseWheel);
    document.addEventListener('keydown', this._handleKeyDown);
    document.addEventListener('keyup', this._handleKeyUp);
};

_._removeEventListeners = function() {
    this._domElement.removeEventListener('mousedown', this._handleMouseDown);
    this._domElement.removeEventListener('touchstart', this._handleMouseDown);
    this._domElement.removeEventListener('mouseup', this._handleMouseUp);
    this._domElement.removeEventListener('touchend', this._handleMouseUp);
    this._domElement.removeEventListener('mousemove', this._handleMouseMove);
    this._domElement.removeEventListener('touchmove', this._handleMouseMove);
    this._domElement.removeEventListener('mousewheel', this._handleMouseWheel);
    document.removeEventListener('keydown', this._handleKeyDown);
    document.removeEventListener('keyup', this._handleKeyUp);
};

_._handleMouseDown = function(e) {
    e.preventDefault();
    if (typeof e.touches === 'object') {
        this._startX = e.touches[0].pageX;
        this._startY = e.touches[0].pageY;
        this._isRotating = true;
    } else if (e.button === 0) {
        this._startX = e.pageX;
        this._startY = e.pageY;
        this._isRotating = true;
    } else if (e.button === 1) {
        this._startX = e.pageX;
        this._startY = e.pageY;
        this._isTranslating = true;
    }
};

_._handleMouseUp = function(e) {
    e.preventDefault();
    this._isTranslating = false;
    this._isRotating = false;
};

_._handleMouseMove = function(e) {
    e.preventDefault();

    var x = typeof e.pageX !== 'undefined' ? e.pageX : e.touches[0].pageX;
    var y = typeof e.pageY !== 'undefined' ? e.pageY : e.touches[0].pageY;
    var dx = x - this._startX;
    var dy = y - this._startY;

    if (this._isRotating) {
        var angleX = dx * this.rotationSpeed;
        var angleY = dy * this.rotationSpeed;

        if (e.shiftKey) {
            this._rotateAroundSelf(angleX, angleY);
        } else {
            this._rotateAroundFocus(angleX, angleY);
        }
    }

    if (this._isTranslating) {
        this._move(-dx * this.translationSpeed * this._focus, dy * this.translationSpeed * this._focus, 0);
    }

    this._startX = x;
    this._startY = y;
};

_._handleMouseWheel = function(e) {
    e.preventDefault();
    var amount = e.deltaY * this.zoomSpeed;
    var keepScale = e.shiftKey;
    this._zoom(amount, keepScale);
};

_._handleKeyDown = function(e) {
    switch (e.key.toLowerCase()) {
        case 'w': this._forward  = true; break;
        case 'a': this._left     = true; break;
        case 's': this._backward = true; break;
        case 'd': this._right    = true; break;
    }
};

_._handleKeyUp = function(e) {
    switch (e.key.toLowerCase()) {
        case 'w': this._forward  = false; break;
        case 'a': this._left     = false; break;
        case 's': this._backward = false; break;
        case 'd': this._right    = false; break;
    }
};

_._rotateAroundFocus = function(dx, dy) {
    var angle = Math.sqrt(dx * dx + dy * dy);
    var rotation = new Quaternion(dy / angle, dx / angle, 0, angle);
    rotation.fromAxisAngle();

    // get focus point
    // TODO: refactor this and positioning
    var cp = this._camera.position.clone();
    var cr = this._camera.rotation.clone();
    var f = new Quaternion(0, 0, -this._focus, 0);
    f.multiply(f, cr);
    f.multiply(cr.inverse(), f);

    // rotate camera around self
    this._camera.rotation.multiply(rotation, this._camera.rotation);
    this._camera.rotation.normalize();

    // position camera around focus
    // TODO: find out how this works
    var positionQuat = new Quaternion(0, 0, this._focus, 0);
    positionQuat.multiply(positionQuat, this._camera.rotation);
    positionQuat.multiply(this._camera.rotation.clone().inverse(), positionQuat);
    this._camera.position.set(positionQuat.x, positionQuat.y, positionQuat.z, 1);
    this._camera.position.add(new Vector(cp.x + f.x, cp.y + f.y, cp.z + f.z, 0));

    this._camera.isDirty = true;
};

_._rotateAroundSelf = function(dx, dy) {
    var angle = Math.sqrt(dx * dx + dy * dy);
    var rotation = new Quaternion(dy / angle, dx / angle, 0, angle);
    rotation.fromAxisAngle();

    this._camera.rotation.multiply(rotation, this._camera.rotation);
    this._camera.rotation.normalize();

    this._camera.isDirty = true;
};

_._move = function(dx, dy, dz) {
    var v = new Quaternion(dx, dy, dz, 0);
    var r = this._camera.rotation.clone();
    v.multiply(v, r);
    v.multiply(r.inverse(), v);
    this._camera.position.add(v);
    this._camera.isDirty = true;
};

_._zoom = function(amount, keepScale) {
    this._camera.zoom(amount);
    if (keepScale) {
        var scale = Math.exp(-amount);
        this._camera.position.mul(new Vector(scale, scale, scale, 1));
        this._focus *= scale;
    }
    this._camera.isDirty = true;
};

_._update = function() {
    var t = Date.now();
    var dt = t - this._time;
    this._time = t;

    var dx = 0;
    var dz = 0;

    if (this._forward) {
        dz -= this.moveSpeed * this._focus;
    }
    if (this._backward) {
        dz += this.moveSpeed * this._focus;
    }
    if (this._left) {
        dx -= this.moveSpeed * this._focus;
    }
    if (this._right) {
        dx += this.moveSpeed * this._focus;
    }

    if (dx !== 0 || dz !== 0) {
        this._move(dx, 0, dz);
    }
};

// ============================ STATIC METHODS ============================= //

})(this);
