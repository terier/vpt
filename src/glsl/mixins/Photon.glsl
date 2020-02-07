// #package glsl/mixins

// #section Photon

struct Photon {
    vec3 position;
    vec3 direction;
    vec3 transmittance;
    vec3 radiance;
    uint bounces;
    uint samples;
};
