// #part /glsl/mixins/random/hash/xorshift

uint hash(uint x) {
    x ^= x << 13u;
    x ^= x >> 17u;
    x ^= x << 5u;
    return x;
}
