// #part /glsl/shaders/renderers/FDO/generate/vertex

#version 300 es

layout (location = 0) in vec2 aPosition;

out vec2 vPosition;

void main() {
    vPosition = aPosition;
    gl_Position = vec4(aPosition, 0.0, 1.0);
}

// #part /glsl/shaders/renderers/FDO/generate/fragment

#version 300 es
#define PI 3.14159265358

precision highp float;

uniform mediump sampler3D uVolume;
uniform mediump sampler2D uTransferFunction;

uniform float uLayer;
uniform float uStepSize;
uniform float uExtinction;
uniform float uAlbedo;
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

//
//    while (t < 1.0 && transmittance > 0.0) {
//        vec3 position = mix(from, to, t);
//        float extinction = sampleVolumeColor(position).a * rayStepLength * uExtinction;
//        transmittance -= extinction;
//        t += uStepSize;
//    }
//
//    if (transmittance < 0.0) {
//        transmittance = 0.0;
//    }

//
//    while (t < 1.0) {
//        vec3 position = mix(from, to, t);
//        vec4 colorSample = sampleVolumeColor(position);
//        colorSample.a *= rayStepLength * uExtinction;
//        transmittance = (1. - colorSample.a) * transmittance;
//        t += uStepSize;
//    }

    while (t < 1.0) {
        vec3 position = mix(from, to, t);
        vec4 colorSample = sampleVolumeColor(position);
        colorSample.a *= rayStepLength * uExtinction;
//        transmittance *= exp(-colorSample.a);
        transmittance *= 1. - colorSample.a;
        t += uStepSize;
    }
//    oEmission = transmittance;


    float extinction = sampleVolumeColor(from).a * uExtinction;
//    oEmission = transmittance * extinction * uAlbedo * (1. / (4. * PI)) * sqrt(4. * PI);
    oEmission = transmittance * extinction * uAlbedo;
//    oEmission = transmittance;
}

// #part /glsl/shaders/renderers/FDO/integrate/vertex

#version 300 es

layout (location = 0) in vec2 aPosition;

out vec2 vPosition;

void main() {
    vPosition = aPosition;
    gl_Position = vec4(aPosition, 0.0, 1.0);
}

// #part /glsl/shaders/renderers/FDO/integrate/fragment

#version 300 es
#define SOBEL_SAMPLES 27
precision highp float;

uniform highp sampler3D uFluenceAndDiffCoeff;
uniform highp sampler3D uEmission;
uniform mediump sampler3D uVolume;
uniform mediump sampler2D uTransferFunction;

uniform vec3 uStep;
uniform ivec3 uSize;
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

layout (location = 0) out vec4 oFluence;

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
//    float inv_R = 1.0 / R;
//    return inv_R * (coth(R) - inv_R);
    return (2.+R) / (6. + 3. * R + R * R);
}

//vec3 sobel(vec3 pos, float h) {
//    vec3 sobel = vec3(0);
//    for (int i = 0; i < SOBEL_SAMPLES; i++) {
//        vec3 samplePosition = pos + sobel_offsets[i] * h;
//        float volumeSample = sampleVolumeColor(samplePosition).a;
//        sobel += vec3(volumeSample) * sobel_kernel[i];
//    }
//    return sobel;
//}

void main() {
    ivec3 position = ivec3(gl_FragCoord.x, gl_FragCoord.y, uLayer);
    ivec3 texSize = textureSize(uFluenceAndDiffCoeff, 0);

    float voxelSize = uVoxelSize;
    // float voxelSize = 1. / float(texSize.x);

//    float max_dimension = float(max(max(uSize[0], uSize[1]), uSize[2]));
//    int mipmapLevel = int(log2(max_dimension) + 1.0);
//    float RMS_j = sqrt(texelFetch(uEmission, position, mipmapLevel).g);
//    float RMS_R = sqrt(texelFetch(uFluenceAndDiffCoeff, position, mipmapLevel).b);
//
//    if (RMS_R < 10e-6 * RMS_j) {
//        return;
//    }


    vec4 fluenceAndDiffCoeff = texelFetch(uFluenceAndDiffCoeff, position, 0);
    float fluence = fluenceAndDiffCoeff.r;
    float diffCoeff = fluenceAndDiffCoeff.g;


    if (position.x <= 0 || position.y <= 0 || position.z <= 0 ||
    position.x >= texSize.x - 1 || position.y >= texSize.y - 1 || position.z >= texSize.z - 1) {
        oFluence = fluenceAndDiffCoeff.rgba;
        return;
    }

    int texelConsecutiveNumber = position.x + position.y + position.z;
    if ((uRed == 1u && texelConsecutiveNumber % 2 == 0) || (uRed == 0u && texelConsecutiveNumber % 2 == 1)) {
        oFluence = fluenceAndDiffCoeff.rgba;
        return;
    }

    vec2 volumeSample = texelFetch(uVolume, position, 0).rg;
    vec4 colorSample = texture(uTransferFunction, volumeSample);
    float extinction = uExtinction * colorSample.a;
    extinction = max(extinction, uMinExtinction);

    float emission = texelFetch(uEmission, position, 0).r;

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
    gradient = gradient / (2.0 * voxelSize);

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
    float D = fluxLimiter / extinction;

    float DpsLeft =     (left[1] +      D) / 2.0;
    float DpsRight =    (right[1] +     D) / 2.0;
    float DpsDown =     (down[1] +      D) / 2.0;
    float DpsUp =       (up[1] +        D) / 2.0;
    float DpsBack =     (back[1] +      D) / 2.0;
    float DpsForward =  (forward[1] +   D) / 2.0;

    float voxelSizeSq = voxelSize * voxelSize;

    float sum_numerator = DpsLeft * left[0] + DpsRight * right[0] + DpsDown * down[0] +
    DpsUp * up[0] + DpsBack * back[0] + DpsForward * forward[0];
    float sum_denominator = DpsLeft + DpsRight + DpsDown + DpsUp + DpsBack + DpsForward;
    float numerator = emission * voxelSizeSq + sum_numerator;
    float denominator = (1.0 - uAlbedo) * extinction * voxelSizeSq + sum_denominator;

    float new_fluence = numerator / denominator;
    new_fluence = uSOR * new_fluence + (1.0 - uSOR) * fluence;
    // new_fluence = clamp(new_fluence, 0.0, 10000000.0);

    oFluence = vec4(new_fluence, D, sum_numerator, sum_denominator);
}

// #part /glsl/shaders/renderers/FDO/render/vertex

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

// #part /glsl/shaders/renderers/FDO/render/fragment

#version 300 es

precision highp float;

#define PI 3.14159265358
#define M_2PI 6.28318530718

uniform highp sampler3D uFluence;
uniform mediump sampler3D uVolume;
uniform mediump sampler2D uTransferFunction;
uniform highp sampler3D uEmission;
//uniform highp sampler3D uResidual;

uniform float uStepSize;
uniform float uOffset;
uniform float uExtinction;
uniform float uAlbedo;
uniform uint uView;

uniform vec3 uCutplane;

in vec3 vRayFrom;
in vec3 vRayTo;
in vec2 vPosition;
out vec4 oColor;

// #link /glsl/mixins/rand
@rand

// #link /glsl/mixins/intersectCube.glsl
@intersectCube

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
       //  oColor = vec4(0, 0, 0, 1);
        oColor = vec4(1, 1, 1, 1);
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
            float emission = textureLod(uEmission, position, 0.).r;
            vec4 fluenceAndDiff = textureLod(uFluence, position, 0.);
            float fluence = fluenceAndDiff.r;
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
            colorSample.a *= rayStepLength * uExtinction;

            switch (uView) {
                case 0u:
                factor = 1.0;
                colorSample.rgb *= colorSample.a * factor;
                break;
                case 1u:
                  factor = emission;
//                  colorSample.rgb *= vec3(factor) * colorSample.a;
                   colorSample.rgb *= (vec3(factor) / uAlbedo) * rayStepLength;
//                colorSample.rgb *= (vec3(factor)) * colorSample.a / (4. * PI);
                break;
                case 2u:
                factor = fluence / (4. * PI);
                if (isnan(factor) || isinf(factor))
                    colorSample.rgb = vec3(0,0,1) * rayStepLength * uExtinction;
                else if (factor >= 0.)
                    colorSample.rgb = vec3(factor, 0 , 0) * rayStepLength * uExtinction;
                else
                    colorSample.rgb = vec3(0, -factor , 0) * rayStepLength * uExtinction;
                break;
                case 3u:
                factor = fluenceAndDiff.g;
                if (isnan(factor) || isinf(factor)) {
                    colorSample.rgb = vec3(1,0,0) * rayStepLength * uExtinction * colorSample.a;
                }
                else {
                    colorSample.rgb = vec3(factor) * rayStepLength * uExtinction * colorSample.a;
                }
                break;
                case 4u:
//                float residual = textureLod(uResidual, position, 0.).r;
                float residual = 0.;
                factor = residual;
                if (isnan(factor) || isinf(factor))
                    colorSample.rgb = vec3(0,0,1);
                else if (factor >= 0.)
                    colorSample.rgb = vec3(factor, 0 , 0) * rayStepLength * uExtinction;
                else
                    colorSample.rgb = vec3(0, -factor , 0) * rayStepLength * uExtinction;
                break;
                case 5u:
                factor = fluenceAndDiff.b / 1000.;
                colorSample.rgb = vec3(factor) * rayStepLength * uExtinction;
                break;
                case 6u:
                factor = fluenceAndDiff.a / 1000.;
                colorSample.rgb = vec3(factor) * rayStepLength * uExtinction;
                break;
                case 7u:
//                factor = emission + (emission * colorSample.a * uExtinction * uAlbedo + scattering_coeff * fluence) / (4.0 * PI);

                  colorSample.rgb *= colorSample.a * uAlbedo * fluence + rayStepLength * emission;

//                float scattering_coeff = uAlbedo * uExtinction * colorSample.a;
//                factor =  (scattering_coeff * fluence + emission) / (4.0 * PI);
//                colorSample.rgb *= colorSample.a * factor;
                break;
            }


            // debug
//            vec4 colorSample = vec4(vec3(fluence), 1);
            if (position.x > uCutplane.x && position.y > uCutplane.y && position.z > uCutplane.z) {
                accumulator += (1.0 - accumulator.a) * colorSample;
            }

            t += uStepSize;
        }

        if (accumulator.a > 1.0) {
            accumulator.rgb /= accumulator.a;
        }

//        oColor = vec4(accumulator.rgb, 1);
        oColor = mix(vec4(1), vec4(accumulator.rgb, 1), accumulator.a);
//        oColor = mix(vec4(0), vec4(accumulator.rgb, 1), accumulator.a);
    }
}

// #part /glsl/shaders/renderers/FDO/reset/vertex

#version 300 es

layout (location = 0) in vec2 aPosition;
out vec2 vPosition;

void main() {
    vPosition = (aPosition + 1.0) * 0.5;
    gl_Position = vec4(aPosition, 0.0, 1.0);
}

// #part /glsl/shaders/renderers/FDO/reset/fragment

#version 300 es
precision highp float;

uniform highp sampler3D uEmission;

in vec2 vPosition;

uniform vec3 uStep;
uniform ivec3 uSize;
uniform float uEpsilon;
uniform float uVoxelSize;
uniform float uLayer;

uniform vec3 uLight;

layout (location = 0) out vec2 oFluence;
void main() {
    vec3 position = vec3(vPosition, uLayer);

    float voxelSize = uVoxelSize;
    // float voxelSize = 1. / float(uSize.x);

    float max_dimension = float(max(max(uSize[0], uSize[1]), uSize[2]));
    float mipmapLevel = log2(max_dimension);
    float RMS_j = sqrt(textureLod(uEmission, position, mipmapLevel).r);

    float fluence = uEpsilon * RMS_j * voxelSize;

    // float fluence = uEpsilon * voxelSize;
    float diff_coeff = uEpsilon * voxelSize;

    oFluence = vec2(0, 0);
}

// #part /glsl/shaders/renderers/FDO/computeResidual/vertex

#version 300 es

layout (location = 0) in vec2 aPosition;
out vec2 vPosition;

void main() {
    vPosition = (aPosition + 1.0) * 0.5;
    gl_Position = vec4(aPosition, 0.0, 1.0);
}

// #part /glsl/shaders/renderers/FDO/computeResidual/fragment

#version 300 es
precision highp float;

uniform highp sampler3D uFluenceAndDiffCoeff;
uniform highp sampler3D uEmission;
uniform mediump sampler3D uVolume;
uniform mediump sampler2D uTransferFunction;

uniform uint uLayer;
uniform float uExtinction;
uniform float uAlbedo;
uniform float uVoxelSize;
uniform float uMinExtinction;

in vec2 vPosition;

layout (location = 0) out float oResidual;

void main() {
    ivec3 position = ivec3(gl_FragCoord.x, gl_FragCoord.y, uLayer);
    ivec3 texSize = textureSize(uFluenceAndDiffCoeff, 0);

    float voxelSize = uVoxelSize;
    // float voxelSize = 1. / float(texSize.x);

    vec4 fluenceAndDiffCoeff = texelFetch(uFluenceAndDiffCoeff, position, 0);
    float fluence = fluenceAndDiffCoeff.r;
    float diffCoeff = fluenceAndDiffCoeff.g;

    if (position.x <= 0 || position.y <= 0 || position.z <= 0 ||
    position.x >= texSize.x - 1 || position.y >= texSize.y - 1 || position.z >= texSize.z - 1) {
        oResidual = 0.;
        return;
    }

    vec2 volumeSample = texelFetch(uVolume, position, 0).rg;
    vec4 colorSample = texture(uTransferFunction, volumeSample);
    float extinction = uExtinction * colorSample.a;
    extinction = max(extinction, uMinExtinction);
    float emission = texelFetch(uEmission, position, 0).r;

    vec4 left      = texelFetch(uFluenceAndDiffCoeff, position + ivec3(-1,  0,  0), 0);
    vec4 right     = texelFetch(uFluenceAndDiffCoeff, position + ivec3( 1,  0,  0), 0);
    vec4 down      = texelFetch(uFluenceAndDiffCoeff, position + ivec3( 0, -1,  0), 0);
    vec4 up        = texelFetch(uFluenceAndDiffCoeff, position + ivec3( 0,  1,  0), 0);
    vec4 back      = texelFetch(uFluenceAndDiffCoeff, position + ivec3( 0,  0, -1), 0);
    vec4 forward   = texelFetch(uFluenceAndDiffCoeff, position + ivec3( 0,  0,  1), 0);

    float DpsLeft =     (left[1] +      diffCoeff) / 2.0;
    float DpsRight =    (right[1] +     diffCoeff) / 2.0;
    float DpsDown =     (down[1] +      diffCoeff) / 2.0;
    float DpsUp =       (up[1] +        diffCoeff) / 2.0;
    float DpsBack =     (back[1] +      diffCoeff) / 2.0;
    float DpsForward =  (forward[1] +   diffCoeff) / 2.0;

    float voxelSizeSq = voxelSize * voxelSize;

    float sum_numerator = DpsLeft * left[0] + DpsRight * right[0] + DpsDown * down[0] +
    DpsUp * up[0] + DpsBack * back[0] + DpsForward * forward[0];
    float sum_denominator = DpsLeft + DpsRight + DpsDown + DpsUp + DpsBack + DpsForward;
    float numerator = emission * voxelSizeSq + sum_numerator;
    float denominator = (1.0 - uAlbedo) * extinction * voxelSizeSq + sum_denominator;

    float residual = (numerator - fluence * denominator) / voxelSizeSq;
    oResidual = residual * residual;
}