// #part /glsl/mixins/random/distribution/square

vec2 random_square(inout uint state) {
    float x = random_uniform(state);
    float y = random_uniform(state);
    return vec2(x, y);
}
