export class Plane {

    constructor({
        origin = [0, 0, 0],
        normal = [1, 0, 0],
    } = {}) {
        this.origin = origin;
        this.normal = normal;
    }

    isPointInFront(point) {
        return vec3.dot(vec3.subtract(vec3.create(), point, this.origin), this.normal) > 0;
    }

    nearestPointFrom(point) {
        const d = vec3.subtract(vec3.create(), point, this.origin);
        const ddotn = vec3.dot(d, this.normal);
        const ndotn = vec3.dot(this.normal, this.normal);
        const projectionLength = ddotn / ndotn;
        return point.scaleAndAdd(d, point, this.normal, -projectionLength);
    }

}
