import { quat, vec3, mat4 } from '../../lib/gl-matrix-module.js';

export class CircleAnimator {

constructor(node, options = {}) {
    this.node = node;

    Object.assign(this, {
        center: [0, 0, 0],
        direction: [1, 0, 0],
        radius: 1,
        frequency: 1,
    }, options);
}

update(t) {
    const scale = mat4.fromScaling(mat4.create(), [this.radius, this.radius, this.radius]);

    const angle = this.frequency * t * 2 * Math.PI;
    const phase = mat4.fromRotation(mat4.create(), angle, [0, 0, 1]);

    const from = [0, 0, 1];
    const to = vec3.normalize(vec3.create(), this.direction);
    const axis = vec3.cross(vec3.create(), from, to);
    const slant = vec3.dot(from, to);
    const orientationQuat = [...axis, slant];
    const orientation = mat4.fromQuat(mat4.create(), orientationQuat);

    const translation = mat4.fromTranslation(mat4.create(), this.center);

    const composite = mat4.create();
    mat4.multiply(composite, composite, translation);
    mat4.multiply(composite, composite, orientation);
    mat4.multiply(composite, composite, phase);
    mat4.multiply(composite, composite, scale);

    const position = [1, 0, 0];
    this.node.transform.localTranslation = vec3.transformMat4(position, position, composite);
    this.node.transform.localRotation = orientationQuat;
}

}
