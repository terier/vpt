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

    // far: 5
    // fovX: 0.5956131078378062
    // fovY: 0.45732411742332574
    // isDirty: false
    // near: 0.1
    // position: Vector {x: 0.16786287078113077, y: -1.4724574858478703, z: 0.23171320416343458, w: 1}
    // projectionMatrix: Matrix {m: Float32Array(16)}
    // rotation: Quaternion {x: -0.6492959663748419, y: -0.034307627843022194, z: -0.046106418244761124, w: 0.7583613471939245}
    // transformationMatrix: Matrix {m: Float32Array(16)}
    // viewMatrix: Matrix {m: Float32Array(16)}
    // zoomFactor: 0.0006065306597126336

    // this.fovX = 0.5956131078378062
    // this.fovY = 0.5956131078378062
    this.zoomFactor = 0.0003065306597126336

    this.position = new Vector(0.16786287078113077, -1.4724574858478703, 0.23171320416343458, 1)
    this.rotation = new Quaternion(-0.6492959663748419, -0.034307627843022194, -0.046106418244761124, 0.7583613471939245)

    this.viewMatrix = new Matrix();
    this.projectionMatrix = new Matrix();
    this.transformationMatrix = new Matrix();
    this.updateMatrices()
    this.isDirty = false;
}

updateViewMatrix() {
    this.rotation.toRotationMatrix(this.viewMatrix.m);
    this.viewMatrix.m[ 3] = this.position.x;
    this.viewMatrix.m[ 7] = this.position.y;
    this.viewMatrix.m[11] = this.position.z;
    this.viewMatrix.inverse();
    // console.log(this.position)
    // console.log(this.rotation)
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
