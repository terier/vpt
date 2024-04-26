import { solveQuadratic } from '../algebra/polynomials.js';

export function intersectsIntervalInterval([a, b], [c, d]) {
    return b >= c && a <= d;
}

export function intersectsRaySphere(ray, sphere) {
    const d = vec3.subtract(ray.origin, sphere.center);

    const a = vec3.dot(ray.direction, ray.direction);
    const b = vec3.dot(ray.direction, d) * 2;
    const c = vec3.dot(d, d) - sphere.radius * sphere.radius;

    const solutions = solveQuadratic(a, b, c);
    return solutions && Math.max(...solutions) >= 0;
}

export function rayAABBIntersection(origin, direction, min, max) {
    const tmin = vec3.divide(vec3.create(), vec3.subtract(vec3.create(), min, origin), direction);
    const tmax = vec3.divide(vec3.create(), vec3.subtract(vec3.create(), max, origin), direction);

    const t1 = Math.max(vec3.min(vec3.create(), tmin, tmax));
    const t2 = Math.min(vec3.max(vec3.create(), tmin, tmax));

    return t1 <= t2;
}

export function intersectsSphereSphere(sphereA, sphereB) {
    return vec3.distance(sphereA.center, sphereB.center) <= sphereA.radius + sphereB.radius;
}

export function intersectsAABBSphere(aabb, sphere) {
    return vec3.distance(aabb.nearestPointFrom(sphere.center), sphere.center) <= sphere.radius;
}

export function intersectsPlaneSphere(plane, sphere) {
    return vec3.distance(plane.nearestPointFrom(sphere.center), sphere.center) <= sphere.radius;
}

export function intersectsAABBAABB(aabbA, aabbB) {
    return this.intersectsIntervalInterval([aabbA.min[0], aabbA.max[0]], [aabbB.min[0], aabbB.max[0]])
        && this.intersectsIntervalInterval([aabbA.min[1], aabbA.max[1]], [aabbB.min[1], aabbB.max[1]])
        && this.intersectsIntervalInterval([aabbA.min[2], aabbA.max[2]], [aabbB.min[2], aabbB.max[2]]);
}

export function projectPoints(points, axis) {
    const projections = points.map(point => vec3.dot(point, axis));
    return [Math.min(...projections), Math.max(...projections)];
}

export function pointsCollideOnAxis(pointsA, pointsB, axis) {
    return intervalsIntersect(
        projectPoints(pointsA, axis),
        projectPoints(pointsB, axis));
}

//function separatingAxisTest(meshA, meshB) {
//    const axes = [
//        ...meshA.edges,
//        ...meshB.edges,
//        ...meshA.edges.map(a => meshB.edges.map(b => vec3.cross(vec3.create(), a, b))).flat(),
//    ];
//
//    for (const axis of axes) {
//        if (pointsCollideOnAxis(meshA.points, meshB.points, axis)) {
//            return true;
//        }
//    }
//
//    return false;
//}
