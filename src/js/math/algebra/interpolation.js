export function clamp(x, min, max) {
    return Math.min(Math.max(x, min), max);
}

export function lerp(a, b, x) {
    return a + x * (b - a);
}

export function step(edge, x) {
    return x < edge ? 0 : 1;
}

export function linstep(edge0, edge1, x) {
    const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
    return t;
}

export function smoothstep(edge0, edge1, x) {
    const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
    return t * t * (3 - 2 * t);
}

export function smootherstep(edge0, edge1, x) {
    const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
    return t * t * t * (t * (t * 6 - 15) + 10);
}

export function remap(x, minA, maxA, minB, maxB) {
    return minB + (x - minA) * (maxB - minB) / (maxA - minA);
}
