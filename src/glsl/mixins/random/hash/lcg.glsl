// #part /glsl/mixins/random/hash/lcg

uint hash(uint x) {
    return x * 1664525u + 1013904223u;
}
