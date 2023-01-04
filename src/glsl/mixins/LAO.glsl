// #part /glsl/mixins/LAO

float LAO(vec3 position, int samples, float stepSize, vec2 U, vec3 light, mediump sampler3D tex, sampler2D tf) {
    float LAOContribution = 0.;
    float accumuLAOContribution = 0.;
    for (int samp = 0; samp < samples; samp++) {
        for (float t = 0.001; t < 1.0; t += stepSize) {
            U = rand(U);
            float randX = U.x;
            float randY = U.y;
            U = rand(U);
            float randZ = U.x;
            float randDir = U.y;
            vec3 randomDirection = -1.0 + 2.0 * vec3(randX, randY, randZ);
            randomDirection = normalize(randomDirection) * randDir;
            vec3 laoHalfVector = normalize(-light + randomDirection);
            vec3 samplePos = position + laoHalfVector * t;

            vec2 volumeSample = texture(tex, samplePos).rg;
            vec4 transferSample = texture(tf, volumeSample);

            float laoSample = transferSample.a;

            accumuLAOContribution += laoSample * pow(1.0 - t, 2.0);
        }
        // accumuLAOContribution /= uLightCoeficient;
        accumuLAOContribution = clamp(accumuLAOContribution, 0.0, 1.0);
        LAOContribution += accumuLAOContribution;
    }
    return LAOContribution /= float(samples);
}

