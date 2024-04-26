export function solveQuadratic(a, b, c) {
    const D = b * b - 4 * a * c;
    if (D < 0) {
        return null;
    } else {
        return [
            (-b - Math.sqrt(D)) / (2 * a),
            (-b + Math.sqrt(D)) / (2 * a),
        ];
    }
}
