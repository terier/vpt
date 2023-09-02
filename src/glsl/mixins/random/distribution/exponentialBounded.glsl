// #part /glsl/mixins/random/distribution/exponentialBounded

float random_exponential_bounded(inout uint state, float rate, float b) {
    return -log(1. - random_uniform(state) * (1. - exp(-rate * b))) / rate;
}