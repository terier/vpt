// #part /glsl/mixins/hashrand

uint hash(uint x) {
    x += (x << 10u);
    x ^= (x >>  6u);
    x += (x <<  3u);
    x ^= (x >> 11u);
    x += (x << 15u);
    return x;
}

uint hash(uvec2 v) {
    return hash(v.x ^ hash(v.y));
}

uint hash(uvec3 v) {
    return hash(v.x ^ hash(v.y) ^ hash(v.z));
}

uint hash(uvec4 v) {
    return hash(v.x ^ hash(v.y) ^ hash(v.z) ^ hash(v.w));
}

float random(float f) {
    const uint mantissaMask = 0x007FFFFFu;
    const uint one          = 0x3F800000u;

    uint h = hash(floatBitsToUint(f));
    h &= mantissaMask;
    h |= one;

    float  r2 = uintBitsToFloat(h);
    return r2 - 1.0;
}
