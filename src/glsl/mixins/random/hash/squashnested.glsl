// #part /glsl/mixins/random/hash/squashnested

uint hash(uvec2 x) {
    return hash(hash(x.x) + x.y);
}

uint hash(uvec3 x) {
    return hash(hash(hash(x.x) + x.y) + x.z);
}

uint hash(uvec4 x) {
    return hash(hash(hash(hash(x.x) + x.y) + x.z) + x.w);
}
