import { mat4 } from '../lib/gl-matrix-module.js';

export class Camera {

    constructor({
        orthographic = 0,
        aspect = 1,
        fovy = 1,
        halfy = 1,
        near = 0.01,
        far = 1000,
    } = {}) {
        this.orthographic = orthographic;
        this.aspect = aspect;
        this.fovy = fovy;
        this.halfy = halfy;
        this.near = near;
        this.far = far;
    }

    get matrix() {
        if (this.orthographic === 0) {
            return this.perspectiveMatrix;
        } else if (this.orthographic === 1) {
            return this.orthographicMatrix;
        } else {
            const a = this.orthographicMatrix;
            const b = this.perspectiveMatrix;
            return mat4.add(mat4.create(),
                mat4.multiplyScalar(a, a, this.orthographic),
                mat4.multiplyScalar(b, b, 1 - this.orthographic));
        }
    }

    get orthographicMatrix() {
        const { halfy, aspect, near, far } = this;
        const halfx = halfy * aspect;
        return mat4.ortho(mat4.create(), -halfx, halfx, -halfy, halfy, near, far);
    }

    get perspectiveMatrix() {
        const { fovy, aspect, near, far } = this;
        return mat4.perspective(mat4.create(), fovy, aspect, near, far);
    }

}
