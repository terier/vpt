// #package glsl/mixins

// #section rgbaToFloat

float rgbaToFloat(vec4 x) {
    const vec4 decoder = 1.0 / vec4(1.0, 255.0, 255.0 * 255.0, 255.0 * 255.0 * 255.0);
    return dot(x, decoder);
}
