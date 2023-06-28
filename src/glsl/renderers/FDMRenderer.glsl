// #part /glsl/shaders/renderers/FDM/generate/vertex

#version 300 es

layout (location = 0) in vec2 aPosition;

out vec2 vPosition;

void main() {
    vPosition = aPosition;
    gl_Position = vec4(aPosition, 0.0, 1.0);
}

// #part /glsl/shaders/renderers/FDM/generate/fragment

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

// #part /glsl/shaders/renderers/FDM/integrate/vertex

#version 300 es

layout (location = 0) in vec2 aPosition;

out vec2 vPosition;

void main() {
    vPosition = aPosition;
    gl_Position = vec4(aPosition, 0.0, 1.0);
}

// #part /glsl/shaders/renderers/FDM/integrate/fragment

#version 300 es
#define SOBEL_SAMPLES 27
precision highp float;

const vec3 sobel_offsets[SOBEL_SAMPLES] = vec3[SOBEL_SAMPLES](
vec3(-1, -1, -1),
vec3( 0, -1, -1),
vec3( 1, -1, -1),
vec3(-1,  0, -1),
vec3( 0,  0, -1),
vec3( 1,  0, -1),
vec3(-1,  1, -1),
vec3( 0,  1, -1),
vec3( 1,  1, -1),

vec3(-1, -1,  0),
vec3( 0, -1,  0),
vec3( 1, -1,  0),
vec3(-1,  0,  0),
vec3( 0,  0,  0),
vec3( 1,  0,  0),
vec3(-1,  1,  0),
vec3( 0,  1,  0),
vec3( 1,  1,  0),

vec3(-1, -1,  1),
vec3( 0, -1,  1),
vec3( 1, -1,  1),
vec3(-1,  0,  1),
vec3( 0,  0,  1),
vec3( 1,  0,  1),
vec3(-1,  1,  1),
vec3( 0,  1,  1),
vec3( 1,  1,  1)
);

const vec3 sobel_kernel[SOBEL_SAMPLES] = vec3[SOBEL_SAMPLES](
vec3(-1, -1, -1),
vec3( 0, -2, -2),
vec3( 1, -1, -1),
vec3(-2,  0, -2),
vec3( 0,  0, -4),
vec3( 2,  0, -2),
vec3(-1,  1, -1),
vec3( 0,  2, -2),
vec3( 1,  1, -1),

vec3(-2, -2,  0),
vec3( 0, -4,  0),
vec3( 2, -2,  0),
vec3(-4,  0,  0),
vec3( 0,  0,  0),
vec3( 4,  0,  0),
vec3(-2,  2,  0),
vec3( 0,  4,  0),
vec3( 2,  2,  0),

vec3(-1, -1,  1),
vec3( 0, -2,  2),
vec3( 1, -1,  1),
vec3(-2,  0,  2),
vec3( 0,  0,  4),
vec3( 2,  0,  2),
vec3(-1,  1,  1),
vec3( 0,  2,  2),
vec3( 1,  1,  1)
);

uniform highp sampler3D uFluenceAndDiffCoeff;
uniform highp sampler3D uResidual;
uniform highp sampler3D uEmission;
uniform mediump sampler3D uVolume;
uniform mediump sampler2D uTransferFunction;
uniform mediump sampler3D uF;

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

    oFluence = vec2(new_fluence, D);
}

// #part /glsl/shaders/renderers/FDM/render/vertex

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

// #part /glsl/shaders/renderers/FDM/render/fragment

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
            float emission = textureLod(uEmission, position, 0.).r;
            float fluence = textureLod(uFluence, position, 0.).r;
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

            // debug
//            vec4 colorSample = vec4(vec3(fluence), 1);

            accumulator += (1.0 - accumulator.a) * colorSample;
            t += uStepSize;
        }

        if (accumulator.a > 1.0) {
            accumulator.rgb /= accumulator.a;
        }

        oColor = vec4(accumulator.rgb, 1);
//        oColor = mix(vec4(1), vec4(accumulator.rgb, 1), accumulator.a);
//        oColor = mix(vec4(0), vec4(accumulator.rgb, 1), accumulator.a);
    }
}

// #part /glsl/shaders/renderers/FDM/reset/vertex

#version 300 es

layout (location = 0) in vec2 aPosition;
out vec2 vPosition;

void main() {
    vPosition = (aPosition + 1.0) * 0.5;
    gl_Position = vec4(aPosition, 0.0, 1.0);
}

// #part /glsl/shaders/renderers/FDM/reset/fragment

#version 300 es
precision highp float;

uniform highp sampler3D uEmission;

in vec2 vPosition;

uniform vec3 uStep;
uniform uvec3 uSize;
uniform float uEpsilon;
uniform float uVoxelSize;
uniform float uLayer;

uniform vec3 uLight;

layout (location = 0) out vec2 oFluence;
void main() {
    vec3 position = vec3(vPosition, uLayer);

//    float max_dimension = float(max(max(uSize[0], uSize[1]), uSize[2]));
//    float mipmapLevel = log2(max_dimension) + 1.0;
//    float RMS_j = sqrt(textureLod(uEmission, position, mipmapLevel).g);

//    float fluence = uEpsilon * RMS_j * uVoxelSize;

    float fluence = uEpsilon * uVoxelSize;
    float diff_coeff = uEpsilon * uVoxelSize;

    float source = 1.0;

    oFluence = vec2(fluence, diff_coeff);
}

// #part /glsl/shaders/renderers/FDM/computeResidual/vertex

#version 300 es

layout (location = 0) in vec2 aPosition;
out vec2 vPosition;

void main() {
    vPosition = (aPosition + 1.0) * 0.5;
    gl_Position = vec4(aPosition, 0.0, 1.0);
}

// #part /glsl/shaders/renderers/FDM/computeResidual/fragment

#version 300 es
precision highp float;

uniform highp sampler3D uFluenceAndDiffCoeff;
uniform highp sampler3D uF;

in vec2 vPosition;

uniform uint uLayer;
uniform ivec3 uSize;

layout (location = 0) out float oRC;

void main() {
    ivec3 position = ivec3(gl_FragCoord.x, gl_FragCoord.y, uLayer);
    float h = 1.;

    if (position.x <= 0 || position.y <= 0 || position.z <= 0 ||
    position.x >= uSize.x - 1 || position.y >= uSize.y - 1 || position.z >= uSize.z - 1) {
        oRC = 0.;
        return;
    }

    vec4 c         = texelFetch(uFluenceAndDiffCoeff, position, 0);
    vec4 f         = texelFetch(uF, position, 0);
    vec4 left      = texelFetch(uFluenceAndDiffCoeff, position + ivec3(-1,  0,  0), 0);
    vec4 right     = texelFetch(uFluenceAndDiffCoeff, position + ivec3( 1,  0,  0), 0);
    vec4 down      = texelFetch(uFluenceAndDiffCoeff, position + ivec3( 0, -1,  0), 0);
    vec4 up        = texelFetch(uFluenceAndDiffCoeff, position + ivec3( 0,  1,  0), 0);
    vec4 back      = texelFetch(uFluenceAndDiffCoeff, position + ivec3( 0,  0, -1), 0);
    vec4 forward   = texelFetch(uFluenceAndDiffCoeff, position + ivec3( 0,  0,  1), 0);

    oRC = f.r - (left.r + right.r + down.r + up.r + back.r + forward.r - 6. * c.r) / (h*h);
}

// #part /glsl/shaders/renderers/FDM/restrict/vertex

#version 300 es

layout (location = 0) in vec2 aPosition;
out vec2 vPosition;

void main() {
    vPosition = (aPosition + 1.0) * 0.5;
    gl_Position = vec4(aPosition, 0.0, 1.0);
}

// #part /glsl/shaders/renderers/FDM/restrict/fragment

#version 300 es
precision highp float;

uniform highp sampler3D uResidual;

in vec2 vPosition;

uniform uint uLayer;
uniform float uLayerRelative;
uniform ivec3 uSize;

layout (location = 0) out float oCoaseResidual;

void main() {
    vec3 position = vec3(vPosition.x, vPosition.y, uLayerRelative);
    ivec3 exactPosition = ivec3(gl_FragCoord.x, gl_FragCoord.y, uLayer);

    if (exactPosition.x <= 0 || exactPosition.y <= 0 || exactPosition.z <= 0 ||
    exactPosition.x >= uSize.x - 1 || exactPosition.y >= uSize.y - 1 || exactPosition.z >= uSize.z - 1) {
        oCoaseResidual = 0.;
        return;
    }
    oCoaseResidual = texture(uResidual, position).r;
}

// #part /glsl/shaders/renderers/FDM/correction/vertex

#version 300 es

layout (location = 0) in vec2 aPosition;
out vec2 vPosition;

void main() {
    vPosition = (aPosition + 1.0) * 0.5;
    gl_Position = vec4(aPosition, 0.0, 1.0);
}

// #part /glsl/shaders/renderers/FDM/correction/fragment

#version 300 es
precision highp float;

uniform highp sampler3D uFluenceAndDiffCoeff;
uniform highp sampler3D uCorrection;

in vec2 vPosition;

uniform float uLayerRelative;
uniform vec3 uStep;

layout (location = 0) out vec2 oFluenceAndDiffCoeff;

void main() {
    vec3 position = vec3(vPosition.x, vPosition.y, uLayerRelative);

    if (position.x < uStep.x || position.y < uStep.y || position.z < uStep.z ||
    position.x >= 1. - uStep.x || position.y >= 1. - uStep.y || position.z >= 1. - uStep.z) {
        oFluenceAndDiffCoeff = vec2(0);
        return;
    }

    vec4 fluenceAndDiffCoeff = texture(uFluenceAndDiffCoeff, position);
    vec4 correction = texture(uCorrection, position);

    oFluenceAndDiffCoeff = fluenceAndDiffCoeff.rg + correction.rg;
}