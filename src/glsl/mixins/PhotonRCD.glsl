// #package glsl/mixins

// #section PhotonRCD

struct PhotonRCD {
    vec3 position;
    vec3 direction;
    float transmittance;
    float radiance;
    float distance;
    float travelled;
    uint samples;
};
