(function(global) {

global.Camera = Camera;
function Camera(options) {
    this.position = new Vector();
    this.rotation = new Quaternion();
    this.viewMatrix = new Matrix();
    this.projectionMatrix = new Matrix();

    this.fovX = 1;
    this.fovY = 1;
    this.near = 0.1;
    this.far = 100;
}

Camera.prototype.updateViewMatrix = function() {
    this.rotation.toRotationMatrix(this.viewMatrix.m);
    this.viewMatrix.m[ 3] = this.position.x;
    this.viewMatrix.m[ 7] = this.position.y;
    this.viewMatrix.m[11] = this.position.z;
};

Camera.prototype.updateProjectionMatrix = function() {
    var left = -Math.tan(this.fovX / 2) * this.near;
    var right = -left;
    var bottom = -Math.tan(this.fovY / 2) * this.near;
    var top = -bottom;
    this.projectionMatrix.fromFrustum(left, right, bottom, top, this.near, this.far);
};

})(this);