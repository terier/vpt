import { Matrix } from '../math/Matrix.js';
import { Vector } from '../math/Vector.js';
import { Quaternion } from '../math/Quaternion.js';

export class CircleFocusAnimator {

constructor(node, options) {
    this.node = node;

    Object.assign(this, {
        focus: new Vector(),
        displacement: new Vector(0, 0, 1),
        up: new Vector(0, 1, 0),
        coneAngle: 0.2,
        phase: 0,
        frequency: 1,
    }, options);
}

update(t) {
    const pointOnCone = this.displacement.clone();
    const axis = this.up.clone().normalize();
    new Matrix().fromAxisAngle(
        axis.x,
        axis.y,
        axis.z,
        this.coneAngle / 2)
    .transform(pointOnCone);

    const displacementNormalized = this.displacement.clone().normalize();
    const angle = (this.frequency * t + this.phase) * 2 * Math.PI;
    new Matrix().fromAxisAngle(
        displacementNormalized.x,
        displacementNormalized.y,
        displacementNormalized.z,
        angle)
    .transform(pointOnCone);

    const newPosition = new Vector().add(this.focus, pointOnCone);
    const newZ = pointOnCone.clone().normalize();
    const newX = new Vector().cross(newZ, this.up).neg().normalize();
    const newY = new Vector().cross(newX, newZ).neg().normalize();

    const newRotationMatrix = new Matrix([
        newX.x, newY.x, newZ.x, 0,
        newX.y, newY.y, newZ.y, 0,
        newX.z, newY.z, newZ.z, 0,
             0,      0,      0, 1,
    ]);
    const newRotation = newRotationMatrix.toQuaternion(new Quaternion());

    this.node.position = newPosition;
    this.node.rotation = newRotation;
    this.node.isDirty = true;
}

}
