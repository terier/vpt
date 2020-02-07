// #package glsl/mixins

// #section rand

vec2 rand(vec2 p) {
    const mat2 M = mat2(
        23.14069263277926, 2.665144142690225,
        12.98987893203892, 78.23376739376591);
    const vec2 D = vec2(
        1235.6789,
        4378.5453);
    vec2 dotted = M * p;
    vec2 mapped = vec2(cos(dotted.x), sin(dotted.y));
    return fract(mapped * D);
}
