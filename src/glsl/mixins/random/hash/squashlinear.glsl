// #part /glsl/mixins/random/hash/squashlinear

uint hash(uvec2 x) {
    return hash(19u * x.x + 47u * x.y + 101u);
}

uint hash(uvec3 x) {
    return hash(19u * x.x + 47u * x.y + 101u * x.z + 131u);
}

uint hash(uvec4 x) {
    return hash(19u * x.x + 47u * x.y + 101u * x.z + 131u * x.w + 173u);
}
