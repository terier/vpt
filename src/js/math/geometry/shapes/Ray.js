export class Ray {

    constructor({
        origin = [0, 0, 0],
        direction = [1, 0, 0],
    } = {}) {
        this.origin = origin;
        this.direction = direction;
    }

    pointAt(t) {
        return vec3.scaleAndAdd(vec3.create(), this.origin, this.direction, t);
    }

    nearestPointFrom(point) {
        // TODO
    }

}
