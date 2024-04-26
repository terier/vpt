export class AABB {

    constructor({
        min = [0, 0, 0],
        max = [1, 1, 1],
    } = {}) {
        this.min = min;
        this.max = max;
    }

    isPointInside(point) {
        return
    }

    nearestPointFrom(point) {
        const result = vec3.create();
        return vec3.min(result, vec3.max(result, point, this.min), this.max);
    }

}
