// #package glsl/mixins

// #section PhotonRCD

struct PhotonRCD {
    vec3 position;
    vec3 direction;
    float radiance;
    float transmittance;
    float distance;
    float travelled;
    uint samples;
};
