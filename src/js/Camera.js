// #package js/main

// #include math

class Camera {

constructor(options) {
    Object.assign(this, {
        fovX       : 1,
        fovY       : 1,
        near       : 0.1,
        far        : 5,
        zoomFactor : 0.001
    }, options);

    this.position = new Vector();
    this.rotation = new Quaternion();
    this.viewMatrix = new Matrix();
    this.projectionMatrix = new Matrix();
    this.transformationMatrix = new Matrix();
    this.isDirty = false;
}

updateViewMatrix() {
    this.rotation.toRotationMatrix(this.viewMatrix.m);
    this.viewMatrix.m[ 3] = this.position.x;
    this.viewMatrix.m[ 7] = this.position.y;
    this.viewMatrix.m[11] = this.position.z;
    this.viewMatrix.inverse();
}

updateProjectionMatrix() {
    const w = this.fovX * this.near;
    const h = this.fovY * this.near;
    this.projectionMatrix.fromFrustum(-w, w, -h, h, this.near, this.far);
}

updateMatrices() {
    this.updateViewMatrix();
    this.updateProjectionMatrix();
    this.transformationMatrix.multiply(this.projectionMatrix, this.viewMatrix);
}

resize(width, height) {
    this.fovX = width * this.zoomFactor;
    this.fovY = height * this.zoomFactor;
    this.isDirty = true;
}

zoom(amount) {
    const scale = Math.exp(amount);
    this.zoomFactor *= scale;
    this.fovX *= scale;
    this.fovY *= scale;
    this.isDirty = true;
}

}
