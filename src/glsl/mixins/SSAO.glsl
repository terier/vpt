// #part /glsl/mixins/SSAO

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

float SSAO(vec3 pos, int samples, float radius, float depthBias, vec2 U, mat4 P, mediump sampler2D depth) {
    float sum = 0.;
    for (int i = 0; i < samples; i++) {
        U = rand(U);
        vec3 samplePos = sampleSphere(U) * radius + pos.xyz;
//        vec3 samplePos = pos;
//        if (any(greaterThan(samplePos.xy, vec3(1))) || any(lessThan(samplePos.xy, vec3(0)))) {
//            continue;
//        }
        vec4 offset = vec4(samplePos, 1.0);
//        return offset.x;
        offset      = P * offset;
        offset.xyz /= offset.w;
        offset.xyz  = offset.xyz * 0.5 + 0.5;
        float sampleDepth = texture(depth, offset.xy).z;

        float rangeCheck = smoothstep(0.0, 1.0, radius / abs(pos.z - sampleDepth));
        sum       += (sampleDepth >= samplePos.z + depthBias ? 1.0 : 0.0) * rangeCheck;
    }
    return sum / float(samples);
}