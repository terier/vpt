// #part /glsl/mixins/random/distribution/uniformcast

float random_uniform(inout uint state) {
    state = hash(state);
    return uintBitsToFloat((state & 0x007fffffu) | 0x3f800000u) - 1.0;
}
