// #part /glsl/mixins/random/distribution/hemisphere

vec3 random_hemisphere(inout uint state) {
    float u = random_uniform(state);
    float radius = sqrt(1.0 - u * u);
    float angle = TWOPI * random_uniform(state);
    return vec3(radius * vec2(cos(angle), sin(angle)), u);
}
