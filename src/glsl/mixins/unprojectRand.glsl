// #package glsl/mixins

// #section unprojectRand

void unprojectRand(
        inout vec2 randState,
        in vec2 position,
        in mat4 inverseMvp,
        in vec2 inverseResolution,
        in float blur,
        out vec3 from, out vec3 to)
{
    // sample a disk on the near plane (depth of field)
    const float TWOPI = 2.0 * 3.14159265358979323;
    randState = rand(randState);
    float u1 = TWOPI * randState.x;
    float u2 = sqrt(randState.y);
    vec2 offset = vec2(cos(u1), sin(u1)) * u2 * blur;
    vec4 nearPosition = vec4(position + offset, -1.0, 1.0);

    // sample a square on the far plane (antialiasing)
    randState = rand(randState);
    vec2 antialiasing = (randState * 2.0 - 1.0) * inverseResolution;
    vec4 farPosition = vec4(position + antialiasing, 1.0, 1.0);

    // map to world space
    vec4 fromDirty = inverseMvp * nearPosition;
    vec4 toDirty = inverseMvp * farPosition;
    from = fromDirty.xyz / fromDirty.w;
    to = toDirty.xyz / toDirty.w;
}
