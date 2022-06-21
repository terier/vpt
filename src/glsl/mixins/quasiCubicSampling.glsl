// #part /glsl/mixins/quasiCubicSampling

vec4 quasiCubicSampling(sampler3D volume, vec3 u) {
    vec3 R = vec3(textureSize(volume, 0));
    vec3 U = u * R + 0.5,
    vec3 F = fract(U);
    U = floor(U) + F * F * (3.0 - 2.0 * F);
    return texture(volume, (U - 0.5) / R);
}
