var Camera = (function() {
'use strict';

function Camera(options) {
    this.position = new Vector();
    this.rotation = new Quaternion();
    this.viewMatrix = new Matrix();
    this.projectionMatrix = new Matrix();

    this.fovX = 1;
    this.fovY = 1;
    this.near = 0.1;
    this.far = 1;
}

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

_.updateTransformation = function() {
    this.updateViewMatrix();
    this.updateProjectionMatrix();
};

return Camera;

})();
