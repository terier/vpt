// #package glsl/mixins

// #section unproject

void unproject(in vec2 position, in mat4 inverseMvp, out vec3 from, out vec3 to) {
    vec4 nearPosition = vec4(position, -1.0, 1.0);
    vec4 farPosition = vec4(position, 1.0, 1.0);
    vec4 fromDirty = inverseMvp * nearPosition;
    vec4 toDirty = inverseMvp * farPosition;
    from = fromDirty.xyz / fromDirty.w;
    to = toDirty.xyz / toDirty.w;
}
