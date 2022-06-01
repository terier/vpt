// #part /glsl/mixins/random/hash/bbs

uint hash(uint x) {
    x = x % 65521u;
    x = (x * x) % 65521u;
    x = (x * x) % 65521u;
    return x;
}
