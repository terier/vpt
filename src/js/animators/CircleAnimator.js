// #part /js/animators/CircleAnimator

// #link ../math

class CircleAnimator {

constructor(node, options) {
    this.node = node;

    Object.assign(this, {
        center: new Vector(),
        direction: new Vector(1, 0, 0),
        radius: 1,
        frequency: 1,
    }, options);
}

update(t) {
    const scale = new Matrix().fromScale(this.radius, this.radius, this.radius);

    const angle = this.frequency * t;
    const phase = new Matrix().fromRotationZ(angle);

    const from = new Vector(0, 0, 1);
    const to = this.direction.clone().normalize();
    const axis = new Vector().cross(from, to);
    const slant = from.dot(to);
    const orientationQuat = new Quaternion(axis.x, axis.y, axis.z, slant);
    const orientation = new Matrix();
    orientationQuat.toRotationMatrix(orientation.m);

    const translation = new Matrix().fromTranslation(this.center.x, this.center.y, this.center.z);

    const composite = new Matrix();
    composite.multiply(composite, translation);
    composite.multiply(composite, orientation);
    composite.multiply(composite, phase);
    composite.multiply(composite, scale);

    const position = new Vector(1, 0, 0);
    this.node.position = composite.transform(position);
    this.node.rotation = orientationQuat.clone();
    this.node.updateMatrices();
}

}
