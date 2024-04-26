export class Sphere {

    constructor({
        center = [0, 0, 0],
        radius = 1,
    } = {}) {
        this.center = center;
        this.radius = radius;
    }

    isPointInside(point) {
        return vec3.distance(point, this.center) <= radius;
    }

    nearestPointFrom(point) {
        const direction = vec3.subtract(vec3.create(), point, this.center);
        return vec3.scaleAndAdd(vec3.create(), this.center, direction, this.radius / vec3.length(direction));
    }

}