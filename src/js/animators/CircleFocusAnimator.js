import { vec3, mat4, quat } from '../../lib/gl-matrix-module.js';

export class CircleFocusAnimator {

constructor(node, options) {
    this.node = node;

    Object.assign(this, {
        focus: [0, 0, 0],
        displacement: [0, 0, 1],
        up: [0, 1, 0],
        coneAngle: 0.2,
        phase: 0,
        frequency: 1,
    }, options);
}

update(t) {
    // TODO fix this after introduction of gl-matrix
    const rotateCone = mat4.fromRotation(mat4.create(), this.coneAngle / 2, this.up);
    const pointOnCone = vec3.transformMat4(vec3.create(), this.displacement, rotateCone);

    const displacementNormalized = vec3.normalize(vec3.create(), this.displacement);
    const angle = (this.frequency * t + this.phase) * 2 * Math.PI;
    const rotateDisplacement = mat4.fromRotation(mat4.create(), displacementNormalized, angle);
    vec3.transformMat4(pointOnCone, pointOnCone, rotateDisplacement);

    const newPosition = vec3.add(vec3.create(), this.focus, pointOnCone);
    const newZ = vec3.normalize(pointOnCone, pointOnCone);
    const newX = vec3.normalize(vec3.create(), vec3.negate(vec3.create(), vec3.cross(vec3.create(), newZ, this.up)));
    const newY = vec3.normalize(vec3.create(), vec3.negate(vec3.create(), vec3.cross(vec3.create(), newX, newZ)));

    const newRotationMatrix = mat4.fromValues(
        ...newX, 0,
        ...newY, 0,
        ...newZ, 0,
        0, 0, 0, 1,
    );
    const newRotation = mat4.getRotation(quat.create(), newRotationMatrix);

    this.node.transform.localPosition = newPosition;
    this.node.transform.localRotation = newRotation;
}

}
