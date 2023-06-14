import { vec3, mat4, quat } from '../../lib/gl-matrix-module.js';

export class CircleFocusAnimator extends EventTarget {

constructor(node, options) {
    super();

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
    const angle = (this.frequency * t + this.phase) * 2 * Math.PI;
    const rotation = quat.setAxisAngle(quat.create(), [0, 0, 1], angle);

    const displacementLength = vec3.length(this.displacement);
    const displacementNormalized = vec3.normalize(vec3.create(), this.displacement);
    const pointOnCone = [Math.tan(this.coneAngle / 2), 0, 1];
    vec3.scale(pointOnCone, pointOnCone, displacementLength);

    const alignment = quat.rotationTo(quat.create(), [0, 0, 1], displacementNormalized);
    vec3.transformQuat(pointOnCone, pointOnCone, rotation);
    vec3.transformQuat(pointOnCone, pointOnCone, alignment);

    const targetTo = mat4.targetTo(mat4.create(), pointOnCone, [0, 0, 0], this.up);
    const newRotation = mat4.getRotation(quat.create(), targetTo);

    const newTranslation = vec3.add(vec3.create(), this.focus, pointOnCone);

    this.node.transform.translation = newTranslation;
    this.node.transform.rotation = newRotation;
}

}
