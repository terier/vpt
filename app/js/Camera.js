var Camera = (function() {
'use strict';

function Camera(options) {
    this._opts = $.extend({}, this.constructor.defaults, options);

    this.position = new Vector();
    this.rotation = new Quaternion();
    this.viewMatrix = new Matrix();
    this.projectionMatrix = new Matrix();
    this.transformationMatrix = new Matrix();

    this.fovX = this._opts.fovX;
    this.fovY = this._opts.fovY;
    this.near = this._opts.near;
    this.far = this._opts.far;
    this.zoomFactor = this._opts.zoomFactor;

    this.isDirty = false;
}

Camera.defaults = {
    fovX: 1,
    fovY: 1,
    near: 1,
    far: 10,
    zoomFactor: 0.001
};

var _ = Camera.prototype;

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

return Camera;

})();
