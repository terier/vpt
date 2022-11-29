// #part /glsl/mixins/ambientOcclusion

vec3 sampleSphere(vec2 U) {
    float theta = U.x * M_2PI;
    float phi = acos(2. * U.y - 1.);
    U = rand(U);
    float r = pow(U.x, 1./3.);
    float sinTheta = sin(theta);
    float cosTheta = cos(theta);
    float sinPhi = sin(phi);
    float cosPhi = cos(phi);
    return vec3(sinPhi * cosTheta, sinPhi * sinTheta, cosPhi);
}

float ambientOcclusion(vec3 pos, int samples, float radius, vec2 U, mediump sampler3D tex, sampler2D tf) {
    float sum = 0.;
    for (int i = 0; i < samples; i++) {
        U = rand(U);
        vec3 samplePos = sampleSphere(U) * radius + pos;
        if (any(greaterThan(samplePos, vec3(1))) || any(lessThan(samplePos, vec3(0)))) {
            continue;
        }
        vec2 volumeSample = texture(tex, samplePos).rg;
        vec4 transferSample = texture(tf, volumeSample);
        sum += transferSample.a;
    }
    return sum / float(samples);
}

