// #part /glsl/mixins/smartDeNoise3D

#define INV_SQRT_OF_2PI 0.39894228040143267793994605993439  // 1.0/SQRT_OF_2PI
#define INV_PI 0.31830988618379067153776752674503

vec4 smartDeNoise3D(sampler3D tex, sampler3D tex2, float scattering_coeff, vec3 size, vec3 position,
                    float sigma, float kSigma, float threshold)
{
    float radius = round(kSigma*sigma);
    float radQ = radius * radius;

    float invSigmaQx2 = .5 / (sigma * sigma);      // 1.0 / (sigma^2 * 2.0)
    float invSigmaQx2PI = INV_PI * invSigmaQx2;    // 1.0 / (sqrt(PI) * sigma)

    float invThresholdSqx2 = .5 / (threshold * threshold);     // 1.0 / (sigma^2 * 2.0)
    float invThresholdSqrt2PI = INV_SQRT_OF_2PI / threshold;   // 1.0 / (sqrt(2*PI) * sigma)

    float emission = texture(tex, position).r;
    float fluence = texture(tex2, position).r;
    float centrPx = (emission + scattering_coeff * fluence); // / (4.0 * PI);

    float zBuff = 0.0;
    vec4 aBuff = vec4(0.0);

    for(float z=-radius; z <= radius; z++) {
        float pt = sqrt(radQ-z*z);// pt = yRadius: have circular trend
        float ptQ = pt * pt;
        for (float x=-pt; x <= pt; x++) {
            float pt2 = sqrt(ptQ-x*x);// pt = yRadius: have circular trend
            for (float y=-pt2; y <= pt2; y++) {
                vec3 d = vec3(x, y, z);

                float blurFactor = exp(-dot(d, d) * invSigmaQx2) * invSigmaQx2PI;

                emission = texture(tex, position+d * size).r;
                fluence = texture(tex2, position+d * size).r;
                float walkPx = (emission + scattering_coeff * fluence); // / (4.0 * PI);

                float dC = walkPx-centrPx;
                float deltaFactor = exp(-dot(dC, dC) * invThresholdSqx2) * invThresholdSqrt2PI * blurFactor;

                zBuff += deltaFactor;
                aBuff += deltaFactor*walkPx;
            }
        }
    }
    return aBuff/zBuff;
}