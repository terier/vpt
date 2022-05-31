// #part /glsl/mixins/random/distribution/circle

vec2 random_circle(inout uint state) {
    float angle = TWOPI * random_uniform(state);
    return vec2(cos(angle), sin(angle));
}
