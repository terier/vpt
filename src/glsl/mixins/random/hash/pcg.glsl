// #part /glsl/mixins/random/hash/pcg

uint hash(uint x) {
    x = x * 747796405u + 2891336453u;
    x = ((x >> ((x >> 28u) + 4u)) ^ x) * 277803737u;
    return (x >> 22u) ^ x;
}
