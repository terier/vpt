(function(global) {
'use strict';

var Class = global.Camera = Camera;
var _ = Class.prototype;

// ========================== CLASS DECLARATION ============================ //

function Camera(options) {
    this._opts = $.extend(this._opts || {}, Class.defaults, options);

    // option variables
    this.fovX = this._opts.fovX;
    this.fovY = this._opts.fovY;
    this.near = this._opts.near;
    this.far = this._opts.far;
    this.zoomFactor = this._opts.zoomFactor;

    // instance variables
    this.position = null;
    this.rotation = null;
    this.viewMatrix = null;
    this.projectionMatrix = null;
    this.transformationMatrix = null;
    this.isDirty = null;

    // function binds

    _._init.call(this);
};

Class.defaults = {
    fovX: 1,
    fovY: 1,
    near: 1,
    far: 10,
    zoomFactor: 0.001
};

// ======================= CONSTRUCTOR & DESTRUCTOR ======================== //

_._init = function() {
    this.position = new Vector();
    this.rotation = new Quaternion();
    this.viewMatrix = new Matrix();
    this.projectionMatrix = new Matrix();
    this.transformationMatrix = new Matrix();
    this.isDirty = false;
};

_.destroy = function() {
};

// =========================== INSTANCE METHODS ============================ //

_.updateViewMatrix = function() {
    this.rotation.toRotationMatrix(this.viewMatrix.m);
    this.viewMatrix.m[ 3] = this.position.x;
    this.viewMatrix.m[ 7] = this.position.y;
    this.viewMatrix.m[11] = this.position.z;
    this.viewMatrix.inverse();
};

_.updateProjectionMatrix = function() {
    var w = this.fovX * this.near;
    var h = this.fovY * this.near;
    this.projectionMatrix.fromFrustum(-w, w, -h, h, this.near, this.far);
};

_.updateMatrices = function() {
    this.updateViewMatrix();
    this.updateProjectionMatrix();
    this.transformationMatrix.multiply(this.projectionMatrix, this.viewMatrix);
};

_.resize = function(width, height) {
    this.fovX = width * this.zoomFactor;
    this.fovY = height * this.zoomFactor;
    this.isDirty = true;
};

_.zoom = function(amount) {
    var scale = Math.exp(amount);
    this.zoomFactor *= scale;
    this.fovX *= scale;
    this.fovY *= scale;
    this.isDirty = true;
};

// ============================ STATIC METHODS ============================= //

})(this);
