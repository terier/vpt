// #package glsl/mixins

// #section hue

#define HUE_PART 0.16666666666666
vec4 hue(float x) {
    float r = smoothstep(1.0 * HUE_PART, 2.0 * HUE_PART, x) - smoothstep(4.0 * HUE_PART, 5.0 * HUE_PART, x);
    float g = smoothstep(0.0 * HUE_PART, 1.0 * HUE_PART, x) - smoothstep(3.0 * HUE_PART, 4.0 * HUE_PART, x);
    float b = smoothstep(2.0 * HUE_PART, 3.0 * HUE_PART, x) - smoothstep(5.0 * HUE_PART, 6.0 * HUE_PART, x);
    return vec4(1.0 - r, g, b, 1.0);
}
