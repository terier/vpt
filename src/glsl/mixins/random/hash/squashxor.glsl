// #part /glsl/mixins/random/hash/squashxor

uint hash(uvec2 v) {
    return hash(v.x ^ hash(v.y));
}

uint hash(uvec3 v) {
    return hash(v.x ^ hash(v.y) ^ hash(v.z));
}

uint hash(uvec4 v) {
    return hash(v.x ^ hash(v.y) ^ hash(v.z) ^ hash(v.w));
}
