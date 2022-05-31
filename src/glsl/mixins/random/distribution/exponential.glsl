// #part /glsl/mixins/random/distribution/exponential

float random_exponential(inout uint state, float rate) {
    return -log(random_uniform(state)) / rate;
}
