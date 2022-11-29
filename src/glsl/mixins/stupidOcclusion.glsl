// #part /glsl/mixins/stupidOcclusion

float stupidOcclusion(vec3 pos, vec3 normal, int steps, float stepSize, mediump sampler3D tex, sampler2D tf)
{
//    float sum    = 0.;
//    float maxSum = 0.;
//    for (int i = 0; i < steps; i++) {
//        vec3 p = pos + normal * float(i+1) * stepSize;
//        if (any(greaterThan(p, vec3(1))) || any(lessThan(p, vec3(0)))) {
//            continue;
//        }
//        vec2 volumeSample = texture(tex, p).rg;
//        vec4 transferSample = texture(tf, volumeSample);
//        sum    += 1. / pow(2., float(i)) * transferSample.a;
//        maxSum += 1. / pow(2., float(i));
//    }
//    return sum / maxSum;

    float sum = 0.;
    for (int i = 0; i < steps; i++)  {
        vec3 p = pos + normal * float(i+1) * stepSize;
        if (any(greaterThan(p, vec3(1))) || any(lessThan(p, vec3(0)))) {
            continue;
        }
        vec2 volumeSample = texture(tex, p).rg;
        vec4 transferSample = texture(tf, volumeSample);
        sum += transferSample.a;
    }
    return sum / float(steps);
}

//vec3 randomDirection(vec2 U) {
//    float phi = U.x * M_2PI;
//    float z = U.y * 2.0 - 1.0;
//    float k = sqrt(1.0 - z * z);
//    return vec3(k * cos(phi), k * sin(phi), z);
//}