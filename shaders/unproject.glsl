void unproject(in vec2 position, in mat4 inverseMvp, out vec3 from, out vec3 to) {
    vec4 nearPosition = vec4(position, -1.0, 1.0);
    vec4 farPosition = vec4(position, 1.0, 1.0);
    vec4 fromDirty = uMvpInverseMatrix * nearPosition;
    vec4 toDirty = uMvpInverseMatrix * farPosition;
    from = fromDirty.xyz / fromDirty.w;
    to = toDirty.xyz / toDirty.w;
}
