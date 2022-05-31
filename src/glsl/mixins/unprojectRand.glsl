// #part /glsl/mixins/unprojectRand

void unprojectRand(
        inout uint state,
        in vec2 position,
        in mat4 inverseMvp,
        in vec2 inverseResolution,
        in float blur,
        out vec3 from, out vec3 to)
{
    // sample a disk on the near plane (depth of field)
    vec2 offset = random_disk(state) * blur;
    vec4 nearPosition = vec4(position + offset, -1.0, 1.0);

    // sample a square on the far plane (antialiasing)
    vec2 antialiasing = (random_square(state) * 2.0 - 1.0) * inverseResolution;
    vec4 farPosition = vec4(position + antialiasing, 1.0, 1.0);

    // map to world space
    vec4 fromDirty = inverseMvp * nearPosition;
    vec4 toDirty = inverseMvp * farPosition;
    from = fromDirty.xyz / fromDirty.w;
    to = toDirty.xyz / toDirty.w;
}
