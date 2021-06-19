// #package glsl/mixins

// #section PhotonRCN

struct PhotonRCN {
    vec3 position;
    vec3 direction;
    vec3 radiance;
    float transmittance;
    float distance;
    float travelled;
    uint samples;
};
