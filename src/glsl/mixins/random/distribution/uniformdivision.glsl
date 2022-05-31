// #part /glsl/mixins/random/distribution/uniformdivision

float random_uniform(inout uint state) {
    state = hash(state);
    return float(state) / float(~0u);
}
