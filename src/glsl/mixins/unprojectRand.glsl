// #part /glsl/mixins/unprojectRand

#define M_2PI 6.28318530718

void unprojectRand(
        inout float randState,
        in vec2 position,
        in mat4 inverseMvp,
        in vec2 inverseResolution,
        in float blur,
        out vec3 from, out vec3 to)
{
    // sample a disk on the near plane (depth of field)
    float angle = rand(randState) * M_2PI;
    float radius = sqrt(rand(randState));
    vec2 diskPosition = vec2(cos(angle), sin(angle)) * radius * blur;
    vec4 nearPosition = vec4(position + diskPosition, -1, 1);

    // sample a square on the far plane (antialiasing)
    vec2 squarePosition = (vec2(rand(randState), rand(randState)) * 2.0 - 1.0) * inverseResolution;
    vec4 farPosition = vec4(position + squarePosition, 1, 1);

    // map to world space
    vec4 fromDirty = inverseMvp * nearPosition;
    vec4 toDirty = inverseMvp * farPosition;
    from = fromDirty.xyz / fromDirty.w;
    to = toDirty.xyz / toDirty.w;
}
