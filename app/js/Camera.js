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
    this.far = 1;
}

Camera.prototype.updateViewMatrix = function() {
    this.rotation.toRotationMatrix(this.viewMatrix.m);
    this.viewMatrix.m[ 3] = this.position.x;
    this.viewMatrix.m[ 7] = this.position.y;
    this.viewMatrix.m[11] = this.position.z;
    this.viewMatrix.inverse();
};

Camera.prototype.updateProjectionMatrix = function() {
    var w = Math.tan(this.fovX / 2) * this.near;
    var h = Math.tan(this.fovY / 2) * this.near;
    this.projectionMatrix.fromFrustum(-w, w, -h, h, this.near, this.far);
};

Camera.prototype.updateTransformation = function() {
    this.updateViewMatrix();
    this.updateProjectionMatrix();
};

})(this);