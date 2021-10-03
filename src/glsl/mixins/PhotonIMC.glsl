// #part /glsl/mixins/PhotonIMC

struct PhotonIMC {
    vec3 position;
    vec3 direction;
    vec3 transmittance;
    vec3 radiance;
    float traveled;
    uint bounces;
    uint samples;
};
