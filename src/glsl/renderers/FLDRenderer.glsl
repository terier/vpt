// #part /glsl/shaders/renderers/FLD/generate/vertex

#version 300 es

layout (location = 0) in vec2 aPosition;

out vec2 vPosition;

void main() {
    vPosition = aPosition;
    gl_Position = vec4(aPosition, 0.0, 1.0);
}

// #part /glsl/shaders/renderers/FLD/generate/fragment

#version 300 es
precision highp float;

uniform mediump sampler3D uVolume;
uniform mediump sampler2D uTransferFunction;

uniform float uLayer;
uniform float uStepSize;
uniform float uExtinction;
uniform vec3 uLight;

in vec2 vPosition;

//layout (location = 0) out vec2 oEmission;
layout (location = 0) out float oEmission;

// #link /glsl/mixins/intersectCube.glsl
@intersectCube

vec4 sampleVolumeColor(vec3 position) {
    vec2 volumeSample = texture(uVolume, position).rg;
    vec4 transferSample = texture(uTransferFunction, volumeSample);
    return transferSample;
}

void main() {
    vec2 mappedPosition = vPosition * 0.5 + 0.5;
    vec3 from = vec3(mappedPosition, uLayer);
    float transmittance = 1.0;
    vec3 light = normalize(uLight);
    vec3 rayDirection = -light;

    vec2 tbounds = max(intersectCube(from, rayDirection), 0.0);

    vec3 vRayTo = from + rayDirection;
    vec3 to = mix(from, vRayTo, tbounds.y);
//    vec3 to = tbounds.y * from;
    float rayStepLength = distance(from, to) * uStepSize;
    float t = 0.0;

    while (t < 1.0 && transmittance > 0.0) {
        vec3 position = mix(from, to, t);
        float extinction = sampleVolumeColor(position).a * rayStepLength * uExtinction;
        transmittance -= extinction;
//        emission *= exp(-absorption);
        t += uStepSize;
    }

    if (transmittance < 0.0) {
        transmittance = 0.0;
    }

//    oEmission = vec2(transmittance, transmittance * transmittance);
    oEmission = transmittance;
}

// #part /glsl/shaders/renderers/FLD/integrate/vertex

#version 300 es

layout (location = 0) in vec2 aPosition;

out vec2 vPosition;

void main() {
    vPosition = aPosition;
    gl_Position = vec4(aPosition, 0.0, 1.0);
}

// #part /glsl/shaders/renderers/FLD/integrate/fragment

#version 300 es
precision highp float;

uniform highp sampler3D uFluenceAndDiffCoeff;
uniform highp sampler3D uEmission;
uniform mediump sampler3D uVolume;
uniform mediump sampler2D uTransferFunction;

uniform vec3 uStep;
//uniform ivec3 uSize;
uniform uint uLayer;
uniform float uLayerRelative;

//uniform float uAbsorptionCoefficient;
//uniform float uScatteringCoefficient;
uniform float uExtinction;
uniform float uAlbedo;
uniform float uVoxelSize;
uniform float uSOR;
uniform uint uRed;
uniform float uEpsilon;
uniform uint uFluxLimiter;
uniform float uMinExtinction;

in vec2 vPosition;

//layout (location = 0) out vec4 oFluence;
layout (location = 0) out vec2 oFluence;

float flux_sum(float R) {
    return 1.0 / (3.0 + R);
}

float flux_max(float R) {
    return 1.0 / max(3.0, R);
}

float flux_kershaw(float R) {
    return 2.0 * 1.0 / (3.0 + sqrt(9.0 + 4.0 * R * R));
}

float coth(float x) {
    return cosh(x) / sinh(x);
}

float flux_levermore_pomraning(float R) {
    float inv_R = 1.0 / R;
    return inv_R * (coth(R) - inv_R);
}

void main() {
//    vec2 mappedPosition = vPosition * 0.5 + 0.5;
//    vec3 position = vec3(mappedPosition, uLayerRelative);
    ivec3 position = ivec3(gl_FragCoord.x, gl_FragCoord.y, uLayer);
    ivec3 texSize = textureSize(uFluenceAndDiffCoeff, 0);

//    float max_dimension = float(max(max(uSize[0], uSize[1]), uSize[2]));
//    float mipmapLevel = log2(max_dimension) + 1.0;
//    float RMS_j = sqrt(textureLod(uEmission, position, mipmapLevel).g);
//    float RMS_R = sqrt(textureLod(uFluenceAndDiffCoeff, position, mipmapLevel).b);

//    if (RMS_R < 10e-6 * RMS_j) {
//        return;
//    }


    vec4 fluenceAndDiffCoeff = texelFetch(uFluenceAndDiffCoeff, position, 0);
    float fluence = fluenceAndDiffCoeff.r;
    float diffCoeff = fluenceAndDiffCoeff.g;
    float emission = texelFetch(uEmission, position, 0).r;


    if (position.x <= 0 || position.y <= 0 || position.z <= 0 ||
    position.x >= texSize.x - 1 || position.y >= texSize.y - 1 || position.z >= texSize.z - 1) {
        oFluence = fluenceAndDiffCoeff.rg;
        return;
    }

    int texelConsecutiveNumber = position.x + position.y + position.z;
    if ((uRed == 1u && texelConsecutiveNumber % 2 == 0) && (uRed == 0u && texelConsecutiveNumber % 2 == 1)) {
        oFluence = fluenceAndDiffCoeff.rg;
        return;
    }

    vec2 volumeSample = texelFetch(uVolume, position, 0).rg;
    vec4 colorSample = texture(uTransferFunction, volumeSample);
    float extinction = uExtinction * colorSample.a;
//    float albedo = uAlbedo;
//    float absorption = colorSample.a * uAbsorptionCoefficient;
//    float extinction = absorption + uScatteringCoefficient;
//    float albedo = uScatteringCoefficient / extinction;
//    extinction = max(extinction, 10e-3 / max_dimension);

    vec4 left      = texelFetch(uFluenceAndDiffCoeff, position + ivec3(-1,  0,  0), 0);
    vec4 right     = texelFetch(uFluenceAndDiffCoeff, position + ivec3( 1,  0,  0), 0);
    vec4 down      = texelFetch(uFluenceAndDiffCoeff, position + ivec3( 0, -1,  0), 0);
    vec4 up        = texelFetch(uFluenceAndDiffCoeff, position + ivec3( 0,  1,  0), 0);
    vec4 back      = texelFetch(uFluenceAndDiffCoeff, position + ivec3( 0,  0, -1), 0);
    vec4 forward   = texelFetch(uFluenceAndDiffCoeff, position + ivec3( 0,  0,  1), 0);

    vec3 gradient = vec3(
        right[0] - left[0],
        up[0] - down[0],
        forward[0] - back[0]
    );
    gradient = gradient / (2.0 * uVoxelSize);

//    float R = max(length(gradient), uEpsilon * RMS_j) / max(extinction * fluence, uEpsilon * RMS_j);
    float R = max(length(gradient), uEpsilon) / max(extinction * fluence, uEpsilon);

    float fluxLimiter = 0.0;
    if (uFluxLimiter == 0u) {
        fluxLimiter = flux_sum(R);
    } else if (uFluxLimiter == 1u) {
        fluxLimiter = flux_max(R);
    } else if (uFluxLimiter == 2u) {
        fluxLimiter = flux_kershaw(R);
    } else {
        fluxLimiter = flux_levermore_pomraning(R);
    }

//    float D = fluxLimiter / max(extinction, 10e-3 / max_dimension);
    float D = fluxLimiter / max(extinction, uMinExtinction);

    float DpsLeft =     (left[1] +      D) / 2.0;
    float DpsRight =    (right[1] +     D) / 2.0;
    float DpsDown =     (down[1] +      D) / 2.0;
    float DpsUp =       (up[1] +        D) / 2.0;
    float DpsBack =     (back[1] +      D) / 2.0;
    float DpsForward =  (forward[1] +   D) / 2.0;

    float voxelSizeSq = uVoxelSize * uVoxelSize;

    float sum_numerator = DpsLeft * left[0] + DpsRight * right[0] + DpsDown * down[0] +
    DpsUp * up[0] + DpsBack * back[0] + DpsForward * forward[0];
    float sum_denominator = DpsLeft + DpsRight + DpsDown + DpsUp + DpsBack + DpsForward;
    float numerator = emission * voxelSizeSq + sum_numerator;
    float denominator = (1.0 - uAlbedo) * extinction * voxelSizeSq + sum_denominator;

    float new_fluence = numerator / denominator;
    new_fluence = uSOR * new_fluence + (1.0 - uSOR) * fluence;
    new_fluence = clamp(new_fluence, 0.0, 1.0);

//    float residual = (numerator - new_fluence * denominator) / voxelSizeSq;
    float residual = 0.0;

//    oFluence = vec4(new_fluence, D, residual * residual, 0);
    oFluence = vec2(new_fluence, D);
}

// #part /glsl/shaders/renderers/FLD/render/vertex

#version 300 es

uniform mat4 uMvpInverseMatrix;

layout(location = 0) in vec2 aPosition;
out vec3 vRayFrom;
out vec3 vRayTo;
out vec2 vPosition;

// #link /glsl/mixins/unproject.glsl
@unproject

void main() {
    vPosition = aPosition;
    unproject(aPosition, uMvpInverseMatrix, vRayFrom, vRayTo);
    gl_Position = vec4(aPosition, 0, 1);
}

// #part /glsl/shaders/renderers/FLD/render/fragment

#version 300 es

precision highp float;

#define PI 3.14159265358
#define M_2PI 6.28318530718

uniform highp sampler3D uFluence;
uniform mediump sampler3D uVolume;
uniform mediump sampler2D uTransferFunction;
uniform highp sampler3D uEmission;

uniform float uStepSize;
uniform float uOffset;
uniform float uExtinction;
uniform float uAlbedo;
uniform uint uView;

uniform float uExposure;

uniform bool uAOEnabled;
uniform int uAOSamples;
uniform float uAORadius;
uniform float uAORandSeed;

in vec3 vRayFrom;
in vec3 vRayTo;
in vec2 vPosition;
out vec4 oColor;

// #link /glsl/mixins/rand
@rand

// #link /glsl/mixins/intersectCube.glsl
@intersectCube

// #link /glsl/mixins/ambientOcclusion.glsl
@ambientOcclusion

vec4 sampleVolumeColor(vec3 position) {
    vec2 volumeSample = texture(uVolume, position).rg;
    vec4 transferSample = texture(uTransferFunction, volumeSample);
    return transferSample;
}

vec3 gradient(vec3 pos, float h) {
    vec3 positive = vec3(
    texture(uVolume, pos + vec3( h, 0.0, 0.0)).r,
    texture(uVolume, pos + vec3(0.0,  h, 0.0)).r,
    texture(uVolume, pos + vec3(0.0, 0.0,  h)).r
    );
    vec3 negative = vec3(
    texture(uVolume, pos + vec3(-h, 0.0, 0.0)).r,
    texture(uVolume, pos + vec3(0.0, -h, 0.0)).r,
    texture(uVolume, pos + vec3(0.0, 0.0, -h)).r
    );
    return normalize(positive - negative);
}

void main() {
    vec3 rayDirection = vRayTo - vRayFrom;
    vec2 tbounds = max(intersectCube(vRayFrom, rayDirection), 0.0);
//    oColor = vec4(uint(gl_FragCoord.x / 512.0), 0, 0, 0);
//    return;

    if (tbounds.x >= tbounds.y) {
        oColor = vec4(0, 0, 0, 1);
//        oColor = vec4(1, 1, 1, 1);
    } else {
        vec3 from = mix(vRayFrom, vRayTo, tbounds.x);
        vec3 to = mix(vRayFrom, vRayTo, tbounds.y);
        float rayStepLength = distance(from, to) * uStepSize;

        float t = 0.0;
        vec4 accumulator = vec4(0);

        while (t < 1.0 && accumulator.a < 0.99) {
            vec3 position = mix(from, to, t);
            // scattering coeff = colorSample.rgb * uExtinction
            vec4 colorSample = sampleVolumeColor(position);
            float emission = texture(uEmission, position).r;
            float fluence = texture(uFluence, position).r;
//            vec3 factor = vec3(0.0);
//            switch (uView) {
//                case 1u:
//                    factor = vec3(emission);
//                    break;
//                case 2u:
//                    factor = vec3(fluence);
//                    break;
//                case 3u:
//                    vec3 scattering_coeff = colorSample.rgb * uExtinction * uAlbedo;
//                    factor = (emission + scattering_coeff * fluence) / (4.0 * PI);
//                    break;
//            }

            float factor = 0.0;
            switch (uView) {
                case 0u:
                factor = 1.0;
                break;
                case 1u:
                factor = emission;
                break;
                case 2u:
                factor = fluence;
                break;
                case 3u:
                float scattering_coeff = colorSample.a * uAlbedo;
                factor = (emission + scattering_coeff * fluence); // / (4.0 * PI);
                break;
            }

            colorSample.a *= rayStepLength * uExtinction;
            colorSample.rgb *= colorSample.a * factor;
            if (uAOEnabled && colorSample.a > 0. && uAOSamples > 0) {
                vec2 U = rand(vPosition * uAORandSeed);
//                vec3 grad = -gradient(position, 0.005);
                float AO = ambientOcclusion(position, uAOSamples, uAORadius, U, uVolume, uTransferFunction);
                colorSample.rgb *= (1. - AO);
            }


            // debug
//            vec4 colorSample = vec4(vec3(fluence), 1);

            accumulator += (1.0 - accumulator.a) * colorSample;
            t += uStepSize;
        }

        if (accumulator.a > 1.0) {
            accumulator.rgb /= accumulator.a;
        }

        oColor = vec4(uExposure * accumulator.rgb, 1);
//        oColor = mix(vec4(1), vec4(accumulator.rgb, 1), accumulator.a);
//        oColor = mix(vec4(0), vec4(accumulator.rgb, 1), accumulator.a);
    }
}

// #part /glsl/shaders/renderers/FLD/render_gradient/vertex

#version 300 es
precision highp float;

uniform mat4 uMvpInverseMatrix;

layout(location = 0) in vec2 aPosition;
out vec3 vRayFrom;
out vec3 vRayTo;

// #link /glsl/mixins/unproject.glsl
@unproject

void main() {
    unproject(aPosition, uMvpInverseMatrix, vRayFrom, vRayTo);
    gl_Position = vec4(aPosition, 0.0, 1.0);
}

// #part /glsl/shaders/renderers/FLD/render_gradient/fragment

#version 300 es
#define M_PI 3.141592653589793
precision highp float;

uniform mat4 uMvpInverseMatrix;

uniform highp sampler3D uFluence;
uniform mediump sampler3D uVolume;
uniform mediump sampler2D uTransferFunction;
uniform highp sampler3D uEmission;

uniform float uStepSize;
uniform float uOffset;
uniform float uExtinction;
uniform float uAlbedo;
uniform uint uView;

uniform float uGradientFactor;

uniform vec3 uLight;
uniform float uSpecularWeight;
uniform float uAlphaRoughness;
uniform float uMetallic;
uniform vec3 uF90;

in vec3 vRayFrom;
in vec3 vRayTo;
out vec4 oColor;

//debug
in vec2 vPosition;

// #link /glsl/mixins/intersectCube.glsl
@intersectCube

// #link /glsl/mixins/rand
@rand

// #link /glsl/mixins/BRDF
@BRDF

vec3 gradient(vec3 pos, float h) {
    vec3 positive = vec3(
    texture(uVolume, pos + vec3( h, 0.0, 0.0)).r,
    texture(uVolume, pos + vec3(0.0,  h, 0.0)).r,
    texture(uVolume, pos + vec3(0.0, 0.0,  h)).r
    );
    vec3 negative = vec3(
    texture(uVolume, pos + vec3(-h, 0.0, 0.0)).r,
    texture(uVolume, pos + vec3(0.0, -h, 0.0)).r,
    texture(uVolume, pos + vec3(0.0, 0.0, -h)).r
    );
    return normalize(positive - negative);
}

vec4 sampleVolumeColor(vec3 position) {
    vec2 volumeSample = texture(uVolume, position).rg;
    vec4 transferSample = texture(uTransferFunction, volumeSample);
    return transferSample;
}

void main() {
    vec3 rayDirection = vRayTo - vRayFrom;
    vec2 tbounds = max(intersectCube(vRayFrom, rayDirection), 0.0);
    if (tbounds.x >= tbounds.y) {
        oColor = vec4(0, 0, 0, 1);
    } else {
        vec3 from = mix(vRayFrom, vRayTo, tbounds.x);
        vec3 to = mix(vRayFrom, vRayTo, tbounds.y);
        float rayStepLength = distance(from, to) * uStepSize;

        float t = 0.0;
        vec4 accumulator = vec4(0);

        while (t < 1.0 && accumulator.a < 0.99) {
            vec3 position = mix(from, to, t);

            vec4 colorSample = sampleVolumeColor(position);

            // Lighting Factor
            float emission = texture(uEmission, position).r;
            float fluence = texture(uFluence, position).r;

            float lightingFactor = 0.0;
            switch (uView) {
                case 0u:
                lightingFactor = 1.0;
                break;
                case 1u:
                lightingFactor = emission;
                break;
                case 2u:
                lightingFactor = fluence;
                break;
                case 3u:
                float scatteringCoeff = colorSample.a * uAlbedo;
                lightingFactor = (emission + scatteringCoeff * fluence); // / (4.0 * PI);
                break;
            }

            vec3 grad = gradient(position, 0.005);
            float p_brdf = colorSample.a * (1.0 - exp(-25.0 * pow(uGradientFactor, 3.0) * length(grad)));
            if (p_brdf > 0.0) {
                grad = -normalize(grad);
                vec3 diffuse;
                vec3 specular;
                vec3 f0 = 0.04 * (1.0 - uMetallic) + colorSample.rgb * uMetallic;
                vec3 BRDFDiffuse = colorSample.rgb * (1.0 - uMetallic);
                BRDF(position, f0, uF90, uSpecularWeight, uAlphaRoughness, uMvpInverseMatrix, grad, uLight, diffuse, specular);

                vec3 BRDFRes = diffuse * BRDFDiffuse + specular;
                vec3 diffusionRes = colorSample.rgb * lightingFactor;
                colorSample.rgb = p_brdf * BRDFRes + (1.0 - p_brdf) * diffusionRes;
            }
            else {
                colorSample.rgb *= lightingFactor;
            }

            // Color
            colorSample.a *= rayStepLength * uExtinction;
            colorSample.rgb *= colorSample.a;

            accumulator += (1.0 - accumulator.a) * colorSample;
            t += uStepSize;
        }

        if (accumulator.a > 1.0) {
            accumulator.rgb /= accumulator.a;
        }

        oColor = vec4(accumulator.rgb, 1);
    }
}

// #part /glsl/shaders/renderers/FLD/reset/vertex

#version 300 es

layout (location = 0) in vec2 aPosition;
out vec2 vPosition;

void main() {
    vPosition = (aPosition + 1.0) * 0.5;
    gl_Position = vec4(aPosition, 0.0, 1.0);
}

// #part /glsl/shaders/renderers/FLD/reset/fragment

#version 300 es
precision highp float;

uniform highp sampler3D uEmission;

in vec2 vPosition;
uniform mat4 uMvpInverseMatrix;
uniform vec2 uInverseResolution;

uniform vec3 uStep;
uniform uvec3 uSize;
uniform float uEpsilon;
uniform float uVoxelSize;
uniform float uLayer;

uniform vec3 uLight;

layout (location = 0) out vec4 oFluence;

void main() {
    vec3 position = vec3(vPosition, uLayer);
//    float max_dimension = float(max(max(uSize[0], uSize[1]), uSize[2]));
//    float mipmapLevel = log2(max_dimension) + 1.0;
//    float RMS_j = sqrt(textureLod(uEmission, position, mipmapLevel).g);

//    float fluence = uEpsilon * RMS_j * uVoxelSize;
    float fluence = uEpsilon * uVoxelSize;
    float diff_coeff = uEpsilon * uVoxelSize;

    float source = 1.0;

    oFluence = vec4(fluence, diff_coeff, 100, 0);
}


// #part /glsl/shaders/renderers/FLD/deferred_render/vertex

#version 300 es
precision highp float;

uniform mat4 uMvpInverseMatrix;

layout(location = 0) in vec2 aPosition;
out vec3 vRayFrom;
out vec3 vRayTo;

// #link /glsl/mixins/unproject.glsl
@unproject

void main() {
    unproject(aPosition, uMvpInverseMatrix, vRayFrom, vRayTo);
    gl_Position = vec4(aPosition, 0.0, 1.0);
}

// #part /glsl/shaders/renderers/FLD/deferred_render/fragment

#version 300 es
precision highp float;

uniform highp sampler3D uFluence;
uniform mediump sampler3D uVolume;
uniform mediump sampler2D uTransferFunction;
uniform highp sampler3D uEmission;

uniform float uStepSize;
uniform float uOffset;
uniform float uExtinction;
uniform float uAlbedo;
uniform uint uView;

uniform bool uAOEnabled;
uniform float uAOThreshold;

uniform mat4 uMvMatrix;

in vec3 vRayFrom;
in vec3 vRayTo;
layout (location = 0) out vec4 oColor;
layout (location = 1) out float oLighting;
layout (location = 2) out vec4 oDepth;

// #link /glsl/mixins/intersectCube.glsl
@intersectCube

vec4 sampleVolumeColor(vec3 position) {
    vec2 volumeSample = texture(uVolume, position).rg;
    vec4 transferSample = texture(uTransferFunction, volumeSample);
    return transferSample;
}

void main() {
    vec3 rayDirection = vRayTo - vRayFrom;
    vec2 tbounds = max(intersectCube(vRayFrom, rayDirection), 0.0);

    if (tbounds.x >= tbounds.y) {
        oColor = vec4(0, 0, 0, 1);
//        oColor = vec4(1, 1, 1, 1);
        oLighting = 0.0;
        if (uAOEnabled) {
            oDepth = vec4(vec3(-10000), 42);
        }
    } else {
        vec3 from = mix(vRayFrom, vRayTo, tbounds.x);
        vec3 to = mix(vRayFrom, vRayTo, tbounds.y);

        float rayStepLength = distance(from, to) * uStepSize;

        float t = 0.0;
        vec4 accumulator = vec4(0);
        float lightingAccumulator = 0.0;
        float depthAccumulator = 0.;
        float depthDistance = -1.;

        while (t < 1.0 && accumulator.a < 0.99) {
            vec3 position = mix(from, to, t);

            vec4 colorSample = sampleVolumeColor(position);

            // Lighting Factor
            float emission = texture(uEmission, position).r;
            float fluence = texture(uFluence, position).r;

            float lightingFactor = 0.0;
            switch (uView) {
                case 0u:
                lightingFactor = 1.0;
                break;
                case 1u:
                lightingFactor = emission;
                break;
                case 2u:
                lightingFactor = fluence;
                break;
                case 3u:
                float scatteringCoeff = colorSample.a * uAlbedo;
                lightingFactor = (emission + scatteringCoeff * fluence); // / (4.0 * PI);
                break;
            }

            // Color
            colorSample.a *= rayStepLength * uExtinction;
            colorSample.rgb *= colorSample.a;

            // Lighting Accumulator
//            float lightingSample = 1.0 - lightingFactor;
//            lightingAccumulator += (1.0 - accumulator.a) * lightingSample * colorSample.a;

            float lightingSample = lightingFactor;
            lightingAccumulator += (1.0 - accumulator.a) * lightingSample * colorSample.a;

            accumulator += (1.0 - accumulator.a) * colorSample;
            t += uStepSize;

            if (uAOEnabled && depthAccumulator < uAOThreshold) {
                depthAccumulator += (1.0 - depthAccumulator) * colorSample.a * rayStepLength * uExtinction;
                depthDistance = t;
            }
        }

        if (accumulator.a > 1.0) {
            accumulator.rgb /= accumulator.a;
        }
        if (accumulator.a > 0.0) {
            lightingAccumulator /= accumulator.a;
        }
//        lightingAccumulator /= accumulator.a;

        //        oColor = vec4(accumulator.rgb, 1.0);
//        oColor = mix(vec4(1), vec4(accumulator.rgb, 1), accumulator.a);
//        oColor = mix(vec4(0), vec4(accumulator.rgb, 1), accumulator.a);
        oColor = vec4(accumulator.rgb, 1);
        oLighting = lightingAccumulator;
        if (uAOEnabled) {
            if (depthAccumulator < uAOThreshold) {
                oDepth = vec4(vec3(-1000), 42);
            } else {
                vec3 depthPos = (uMvMatrix * vec4(mix(from, to, depthDistance), 1)).xyz;
//                depthPos.z += 1.;
//                depthPos.z *= -1.;
//                depthPos.xy  = depthPos.xy * 0.5 + 0.5;
                oDepth = vec4(depthPos, depthDistance);
            }
        }
    }
}

// #part /glsl/shaders/renderers/FLD/ssao/vertex

#version 300 es
precision mediump float;

layout(location = 0) in vec2 aPosition;

out vec2 vPosition;

void main() {
    gl_Position = vec4(aPosition, 0.0, 1.0);
    vPosition = (aPosition + 1.0) * 0.5;
}

// #part /glsl/shaders/renderers/FLD/ssao/fragment

#version 300 es
precision highp float;

uniform highp sampler2D uDepth;

uniform int uAOSamples;
uniform float uAORadius;
uniform float uAORandSeed;
uniform float uAODepthBias;

uniform mat4 uPMatrix;

out float oSSAO;

in vec2 vPosition;

// #link /glsl/mixins/rand
@rand

// #link /glsl/mixins/SSAO.glsl
@SSAO

void main() {
    float aoSample = 0.;
    vec4 position = texture(uDepth, vPosition);
    if (position.w != 42.) {
        vec2 U = rand(vPosition * uAORandSeed);
        aoSample = SSAO(position.xyz, uAOSamples, uAORadius, uAODepthBias, U, uPMatrix, uDepth);
    }
    oSSAO = aoSample;
}

// #part /glsl/shaders/renderers/FLD/gauss_blur/vertex

#version 300 es
precision mediump float;

layout(location = 0) in vec2 aPosition;

out vec2 vPosition;

void main() {
    gl_Position = vec4(aPosition, 0.0, 1.0);
    vPosition = (aPosition + 1.0) * 0.5;
}

// #part /glsl/shaders/renderers/FLD/gauss_blur/fragment

#version 300 es
precision highp float;

uniform highp sampler2D uImage;

uniform vec2 uMask;
uniform vec2 uStep;
const float offset[] = float[](0.0, 1.3846153846, 3.2307692308);
const float weight[] = float[](0.2270270270, 0.3162162162, 0.0702702703);

in vec2 vPosition;

out float oBlurred;

void main() {
    float value = texture(uImage, vPosition).x * weight[0];
    for (int i=1; i<3; i++) {
        value += texture(uImage, vPosition + offset[i] * uMask * uStep).x * weight[i];
        value += texture(uImage, vPosition - offset[i] * uMask * uStep).x * weight[i];
    }
    oBlurred = value;
}

// #part /glsl/shaders/renderers/FLD/combine_render/vertex

#version 300 es
precision mediump float;

layout(location = 0) in vec2 aPosition;

out vec2 vPosition;

// #link /glsl/mixins/unproject.glsl
@unproject

void main() {
    gl_Position = vec4(aPosition, 0.0, 1.0);
    vPosition = (aPosition + 1.0) * 0.5;
}

// #part /glsl/shaders/renderers/FLD/combine_render/fragment

#version 300 es
precision highp float;

uniform highp sampler2D uColor;
uniform highp sampler2D uLighting;
uniform highp sampler2D uSSAO;
uniform int uSmartDeNoise;
uniform float uSigma;
uniform float uKSigma;
uniform float uTreshold;

uniform uint uDeferredView;

uniform bool uAOEnabled;
uniform int uAOSamples;

out vec4 oColor;

in vec2 vPosition;

// #link /glsl/mixins/smartDeNoiseF.glsl
@smartDeNoiseF

void main() {
    vec4 colorSample = texture(uColor, vPosition);
//    float lightingSample = texture(uLighting, vPosition).r;
    float lightingSample;
    if (uSmartDeNoise == 1)
        lightingSample = smartDeNoiseF(uLighting, vPosition, 5.0, 2.0, 0.1); // 5.0, 2.0, .100;
    else
        lightingSample = texture(uLighting, vPosition).r;

    float aoSample = 0.;
    if (uAOEnabled && uAOSamples > 0)
        aoSample = texture(uSSAO, vPosition).r;

    switch (uDeferredView) {
        case 0u:
            oColor = colorSample;
            break;
        case 1u:
    //        oColor = mix(vec4(vec3(lightingSample), 1), vec4(0, 0, 0, 1), lightingSample);
            oColor = vec4(vec3(lightingSample), 1);
            break;
        case 2u: default:
    //        oColor = mix(colorSample, vec4(0, 0, 0, 1), lightingSample);
    //        oColor = colorSample * (1.0 - lightingSample);
    //        oColor = mix(vec4(0, 0, 0, 1), colorSample, lightingSample);
            oColor = vec4(colorSample.rgb * lightingSample, 1);
            break;
        case 5u:
            oColor = vec4(vec3(1. - aoSample), 1);
//            oColor = vec4(vec3(texture(uDepth, vPosition).z), 1);
            break;
        case 6u:
            oColor = vec4(colorSample.rgb * lightingSample * (1. - aoSample), 1);
//            oColor = vec4(vec3(texture(uDepth, vPosition).z), 1);
            break;
    }
}

// #part /glsl/shaders/renderers/FLD/renderBright/vertex

#version 300 es
precision mediump float;

layout(location = 0) in vec2 aPosition;

out vec2 vPosition;

void main() {
    gl_Position = vec4(aPosition, 0.0, 1.0);
    vPosition = (aPosition + 1.0) * 0.5;
}

// #part /glsl/shaders/renderers/FLD/renderBright/fragment

#version 300 es
precision highp float;

uniform highp sampler2D uColor;
uniform float uBloomThreshold;
uniform float uBloomKnee;

in vec2 vPosition;

out vec4 oColor;

void main() {

    vec4 color = texture(uColor, vPosition);
    color = clamp(color, 0.0, 1.0);
//    if (any(isnan(color)) || any(greaterThan(color, vec4(1))) || any(lessThan(color, vec4(0)))) {
//        oColor = vec4(0,1,0,1);
//    }
//    else {
//        oColor = color;
//    }
//    return;
    float brightness = dot(color.rgb, vec3(0.2126, 0.7152, 0.0722));

    const float epsilon = 1e-4;
    float knee = uBloomThreshold * uBloomKnee;
    float source = brightness - uBloomThreshold + knee;
    source = clamp(source, 0.0, 2.0 * knee);
    source = source * source / (4.0 * knee + epsilon);
    float weight = max(brightness - uBloomThreshold, source) / max(brightness, epsilon);
//    color = clamp(color * weight, 0.0, 1.0);
    oColor = vec4(color.rgb * weight, 1);
}

// #part /glsl/shaders/renderers/FLD/downsampleAndBlur/vertex

#version 300 es
precision mediump float;

layout(location = 0) in vec2 aPosition;

out vec2 vPosition;

void main() {
    gl_Position = vec4(aPosition, 0.0, 1.0);
    vPosition = (aPosition + 1.0) * 0.5;
}

// #part /glsl/shaders/renderers/FLD/downsampleAndBlur/fragment

#version 300 es
precision highp float;

uniform highp sampler2D uColor;

in vec2 vPosition;

out vec4 oColor;

void main() {
    vec2 texelSize = vec2(1) / vec2(textureSize(uColor, 0));
    vec4 offset = texelSize.xyxy * vec2(-1, 1).xxyy;
    vec4 color = 0.25 * (
        texture(uColor, vPosition + offset.xy) +
        texture(uColor, vPosition + offset.zy) +
        texture(uColor, vPosition + offset.xw) +
        texture(uColor, vPosition + offset.zw));

    oColor = color;

//    if (any(isnan(color))) {
//        oColor = vec4(0,1,0,1);
//    }
//    else {
//        oColor = color;
//    }
}

// #part /glsl/shaders/renderers/FLD/upsampleAndCombine/vertex

#version 300 es
precision mediump float;

layout(location = 0) in vec2 aPosition;

out vec2 vPosition;

void main() {
    gl_Position = vec4(aPosition, 0.0, 1.0);
    vPosition = (aPosition + 1.0) * 0.5;
}

// #part /glsl/shaders/renderers/FLD/upsampleAndCombine/fragment

#version 300 es
precision highp float;

uniform highp sampler2D uColor;
uniform float uBloomIntensity;

in vec2 vPosition;

out vec4 oColor;

void main() {
    oColor = vec4(texture(uColor, vPosition).rgb, uBloomIntensity);
}

// #part /glsl/shaders/renderers/FLD/renderToCanvas/vertex

#version 300 es
precision mediump float;

layout(location = 0) in vec2 aPosition;

out vec2 vPosition;

void main() {
    gl_Position = vec4(aPosition, 0.0, 1.0);
    vPosition = (aPosition + 1.0) * 0.5;
}

// #part /glsl/shaders/renderers/FLD/renderToCanvas/fragment

#version 300 es
precision highp float;

uniform highp sampler2D uColor;
uniform highp sampler2D uLighting;
uniform highp sampler2D uBloom;

uniform int uSmartDeNoise;
uniform float uSigma;
uniform float uKSigma;
uniform float uTreshold;

uniform float uExposure;

uniform uint uDeferredView;

in vec2 vPosition;

out vec4 oColor;

// #link /glsl/mixins/smartDeNoiseF.glsl
@smartDeNoiseF

void main() {
    vec4 bloom = texture(uBloom, vPosition);
    bloom = clamp(bloom, 0.0, 1.0);

    vec4 colorSample = texture(uColor, vPosition);
    float lightingSample;
    if (uSmartDeNoise == 1)
    lightingSample = smartDeNoiseF(uLighting, vPosition, 5.0, 2.0, 0.1); // 5.0, 2.0, .100;
    else
    lightingSample = texture(uLighting, vPosition).r;

    switch (uDeferredView) {
        case 0u:
        oColor = vec4((colorSample.rgb + bloom.rgb) * uExposure, 1);
        break;
        case 1u:
        oColor = vec4((vec3(lightingSample) + bloom.rgb) * uExposure, 1);
        break;
        case 2u: default:
//        oColor = mix(vec4(0, 0, 0, 1), vec4((colorSample.rgb + bloom.rgb) * uExposure, 1), lightingSample);
        oColor = vec4((colorSample.rgb + bloom.rgb) * lightingSample * uExposure, 1);
        break;
        case 3u:
        //        oColor = mix(vec4(0, 0, 0, 1), vec4((colorSample.rgb + bloom.rgb) * uExposure, 1), lightingSample);
        oColor = vec4(bloom.rgb * uExposure, 1);
        break;
        case 4u:
        //        oColor = mix(vec4(0, 0, 0, 1), vec4((colorSample.rgb + bloom.rgb) * uExposure, 1), lightingSample);
        oColor = vec4(bloom.rgb * lightingSample * uExposure, 1);
        break;
    }
}
