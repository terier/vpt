// #part /glsl/mixins/random/distribution/normal

float random_normal(inout uint state) {
    float radius = sqrt(-2.0 * log(random_uniform(state)));
    float angle = TWOPI * random_uniform(state);
    return radius * cos(angle);
}
