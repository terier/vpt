// #package glsl/mixins

// #section floatToRgba

vec4 floatToRgba(float x) {
    const vec4 encoder = vec4(1.0, 255.0, 255.0 * 255.0, 255.0 * 255.0 * 255.0);
    const vec4 corrector = vec4(1.0 / 255.0, 1.0 / 255.0, 1.0 / 255.0, 0.0);
    vec4 enc = fract(x * encoder);
    return enc - enc.yzww * corrector;
}
