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
    float extinction = sampleVolumeColor(from).a * uExtinction;
    oEmission = transmittance * extinction * uAlbedo;
}

// #part /glsl/shaders/renderers/FDM/integrate/vertex

#version 300 es

layout (location = 0) in vec2 aPosition;

out vec2 vPosition;

void main() {
    vPosition = (aPosition + 1.0) * 0.5;
    gl_Position = vec4(aPosition, 0.0, 1.0);
}

// #part /glsl/shaders/renderers/FDM/integrate/fragment

#version 300 es
precision highp float;

uniform highp sampler3D uFluenceAndDiffCoeff;
uniform highp sampler3D uEmission;
uniform mediump sampler3D uVolume;
uniform mediump sampler2D uTransferFunction;
// uniform mediump sampler3D uF;

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
uniform uint uTop;

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

void main() {
    ivec3 position = ivec3(gl_FragCoord.x, gl_FragCoord.y, uLayer);
    vec3 relPosition = vec3(vPosition.x, vPosition.y, uLayerRelative);
    ivec3 texSize = textureSize(uFluenceAndDiffCoeff, 0);

    vec4 fluenceAndDiffCoeff = texelFetch(uFluenceAndDiffCoeff, position, 0);
    float fluence = fluenceAndDiffCoeff.r;
    float diffCoeff = fluenceAndDiffCoeff.g;

    float voxelSize = uVoxelSize;
    // float voxelSize = 1. / float(texSize.x);

    if (position.x <= 0 || position.y <= 0 || position.z <= 0 ||
    position.x >= texSize.x - 1 || position.y >= texSize.y - 1 || position.z >= texSize.z - 1) {
        oFluence = fluenceAndDiffCoeff.rg;
        return;
    }

    int texelConsecutiveNumber = position.x + position.y + position.z;
    if ((uRed == 1u && texelConsecutiveNumber % 2 == 0) || (uRed == 0u && texelConsecutiveNumber % 2 == 1)) {
        oFluence = fluenceAndDiffCoeff.rg;
        return;
    }

    vec2 volumeSample = texture(uVolume, relPosition).rg;
    //vec2 volumeSample = texture(uVolume, vec3(vPosition, uLayerRelative)).rg;
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
    float numerator;
    float denominator;
//    if (uTop == 1u) {
        numerator = emission * voxelSizeSq + sum_numerator;
        denominator = (1.0 - uAlbedo) * extinction * voxelSizeSq + sum_denominator;
//    }
//    else {
//        numerator = sum_numerator - emission * voxelSizeSq;
//        denominator = sum_denominator;
//    }

    float new_fluence = numerator / denominator;
    new_fluence = uSOR * new_fluence + (1.0 - uSOR) * fluence;
    // new_fluence = clamp(new_fluence, 0.0, 1.0);

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
uniform highp sampler3D uResidual;
uniform highp sampler3D uError;

uniform float uStepSize;
uniform float uOffset;
uniform float uExtinction;
uniform float uAlbedo;
uniform vec3 uCutplane;
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
        oColor = vec4(1, 1, 1, 1);
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
//                if (factor >= 0.)
//                colorSample.rgb = colorSample.a * vec3(factor, 0 , 0);
//                else
//                colorSample.rgb = colorSample.a * vec3(0, -factor , 0);
                if (isnan(factor) || isinf(factor))
                colorSample.rgb = vec3(0,0,1);
                else if (factor >= 0.)
                colorSample.rgb = vec3(factor, 0 , 0) * rayStepLength * uExtinction;
                else
                colorSample.rgb = vec3(0, -factor , 0) * rayStepLength * uExtinction;
                break;
                case 2u:
                factor = fluence;
                if (factor >= 0.)
                colorSample.rgb = vec3(factor, 0 , 0) * rayStepLength * uExtinction;
                else
                colorSample.rgb = vec3(0, -factor , 0) * rayStepLength * uExtinction;
                break;
                case 3u:
                factor = fluenceAndDiff.g;
                if (isnan(factor) || isinf(factor)) {
                    colorSample.rgb = vec3(1,0,0) * rayStepLength * uExtinction;
                }
                else {
                    colorSample.rgb = vec3(factor) * rayStepLength * uExtinction;
                }
                break;
                case 4u:
                factor = textureLod(uResidual, position, 0.).r;
                if (isnan(factor) || isinf(factor))
                    colorSample.rgb = vec3(0,0,1);
                else if (factor >= 0.)
                    colorSample.rgb = vec3(factor, 0 , 0) * rayStepLength * uExtinction;
                else
                    colorSample.rgb = vec3(0, -factor , 0) * rayStepLength * uExtinction;
                break;
                case 5u:
                factor = textureLod(uError, position, 0.).r;
                if (factor >= 0.)
                colorSample.rgb = vec3(factor, 0 , 0) * rayStepLength * uExtinction;
                else
                colorSample.rgb = vec3(0, -factor , 0) * rayStepLength * uExtinction;
                break;
                case 6u:
                float scattering_coeff = uAlbedo;
                factor = scattering_coeff * fluence;
                colorSample.rgb *= colorSample.a * factor + rayStepLength * emission;
                break;
            }

            if (position.x > uCutplane.x && position.y > uCutplane.y && position.z > uCutplane.z) {
                accumulator += (1.0 - accumulator.a) * colorSample;
            }

//            colorSample.a *= rayStepLength * uExtinction;
//            colorSample.rgb *= colorSample.a * factor;

            // debug
//            vec4 colorSample = vec4(vec3(fluence), 1);


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
uniform ivec3 uSize;
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

    float voxelSize = uVoxelSize;
    // float voxelSize = 1. / float(uSize.x);

    float fluence = uEpsilon * voxelSize;
    float diff_coeff = uEpsilon * voxelSize;

    float source = 1.0;

    oFluence = vec2(0, 0);
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
uniform highp sampler3D uEmission;
uniform mediump sampler3D uVolume;
uniform mediump sampler2D uTransferFunction;

in vec2 vPosition;

uniform uint uLayer;
uniform ivec3 uSize;
uniform float uExtinction;
uniform float uAlbedo;
uniform float uVoxelSize;
uniform float uMinExtinction;
uniform float uLayerRelative;

uniform uint uTop;

layout (location = 0) out float oResidual;

void main() {
//    ivec3 position = ivec3(gl_FragCoord.x, gl_FragCoord.y, uLayer);
//    float h = 1.;
//
//    if (position.x <= 0 || position.y <= 0 || position.z <= 0 ||
//    position.x >= uSize.x - 1 || position.y >= uSize.y - 1 || position.z >= uSize.z - 1) {
//        oRC = 0.;
//        return;
//    }
//
//    vec4 c         = texelFetch(uFluenceAndDiffCoeff, position, 0);
//    vec4 f         = texelFetch(uF, position, 0);
//    vec4 left      = texelFetch(uFluenceAndDiffCoeff, position + ivec3(-1,  0,  0), 0);
//    vec4 right     = texelFetch(uFluenceAndDiffCoeff, position + ivec3( 1,  0,  0), 0);
//    vec4 down      = texelFetch(uFluenceAndDiffCoeff, position + ivec3( 0, -1,  0), 0);
//    vec4 up        = texelFetch(uFluenceAndDiffCoeff, position + ivec3( 0,  1,  0), 0);
//    vec4 back      = texelFetch(uFluenceAndDiffCoeff, position + ivec3( 0,  0, -1), 0);
//    vec4 forward   = texelFetch(uFluenceAndDiffCoeff, position + ivec3( 0,  0,  1), 0);
//
//    oResidual = f.r - (left.r + right.r + down.r + up.r + back.r + forward.r - 6. * c.r) / (h*h);

    ivec3 position = ivec3(gl_FragCoord.x, gl_FragCoord.y, uLayer);
    vec3 relPosition = vec3(vPosition.x, vPosition.y, uLayerRelative);

    float voxelSize = uVoxelSize;
    // float voxelSize = 1. / float(uSize.x);

    vec4 fluenceAndDiffCoeff = texelFetch(uFluenceAndDiffCoeff, position, 0);
    float fluence = fluenceAndDiffCoeff.r;
    float diffCoeff = fluenceAndDiffCoeff.g;


    if (position.x <= 0 || position.y <= 0 || position.z <= 0 ||
    position.x >= uSize.x - 1 || position.y >= uSize.y - 1 || position.z >= uSize.z - 1) {
        oResidual = 0.;
        return;
    }

    // vec2 volumeSample = texture(uVolume, relPosition).rg;
    // vec2 volumeSample = texture(uVolume, vec3(position) / vec3(uSize)).rg;
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

//    if (uTop == 1u) {
        // residual = ((1.0 - uAlbedo) * max(extinction, uMinExtinction) * fluence - emission) - ((sum_numerator - fluence * sum_denominator) / voxelSizeSq);
        // residual = ((sum_numerator - fluence * sum_denominator) / voxelSizeSq) - ((1.0 - uAlbedo) * extinction * fluence - emission);
        float numerator = emission * voxelSizeSq + sum_numerator;
        float denominator = (1.0 - uAlbedo) * extinction * voxelSizeSq + sum_denominator;
        float residual = (numerator - fluence * denominator) / voxelSizeSq;
//    }
//    else {
//        residual = emission - ((sum_numerator - fluence * sum_denominator) / voxelSizeSq);
//    }

    oResidual = residual;
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

//    oFluenceAndDiffCoeff.g = fluenceAndDiffCoeff.g;
//    oFluenceAndDiffCoeff.r = fluenceAndDiffCoeff.r + correction.r;
    oFluenceAndDiffCoeff.rg = fluenceAndDiffCoeff.rg + correction.rg;
}

// #part /glsl/shaders/renderers/FDM/augmentF/vertex

#version 300 es

layout (location = 0) in vec2 aPosition;
out vec2 vPosition;

void main() {
    vPosition = (aPosition + 1.0) * 0.5;
    gl_Position = vec4(aPosition, 0.0, 1.0);
}

// #part /glsl/shaders/renderers/FDM/augmentF/fragment

#version 300 es
precision highp float;

uniform highp sampler3D uFluenceAndDiffCoeff;
uniform highp sampler3D uResidual;
uniform mediump sampler3D uVolume;
uniform mediump sampler2D uTransferFunction;

in vec2 vPosition;

uniform float uLayerRelative;
uniform vec3 uStep;
uniform ivec3 uSize;
uniform float uVoxelSize;
uniform float uExtinction;
uniform float uAlbedo;
uniform float uMinExtinction;

layout (location = 0) out float oF;

void main() {
    vec3 position = vec3(vPosition.x, vPosition.y, uLayerRelative);

    if (position.x < uStep.x || position.y < uStep.y || position.z < uStep.z ||
    position.x >= 1. - uStep.x || position.y >= 1. - uStep.y || position.z >= 1. - uStep.z) {
        oF = 0.;
        return;
    }

    float voxelSize = uVoxelSize;
    // float voxelSize = 1. / float(uSize.x);

    vec4 fluenceAndDiffCoeff = texture(uFluenceAndDiffCoeff, position);
    float fluence = fluenceAndDiffCoeff.r;
    float diffCoeff = fluenceAndDiffCoeff.g;

    vec2 volumeSample = texture(uVolume, position).rg;
    vec4 colorSample = texture(uTransferFunction, volumeSample);
    float extinction = uExtinction * colorSample.a;
    extinction = max(extinction, uMinExtinction);

    vec4 left      = texture(uFluenceAndDiffCoeff, position + vec3(-uStep.x,  0,  0));
    vec4 right     = texture(uFluenceAndDiffCoeff, position + vec3( uStep.x,  0,  0));
    vec4 down      = texture(uFluenceAndDiffCoeff, position + vec3( 0, -uStep.y,  0));
    vec4 up        = texture(uFluenceAndDiffCoeff, position + vec3( 0,  uStep.y,  0));
    vec4 back      = texture(uFluenceAndDiffCoeff, position + vec3( 0,  0, -uStep.z));
    vec4 forward   = texture(uFluenceAndDiffCoeff, position + vec3( 0,  0,  uStep.z));

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

    vec4 residual = texture(uResidual, position);

//    oF = ((sum_numerator - fluence * sum_denominator) / voxelSizeSq) + residual.r;
    oF = ((sum_numerator - fluence * sum_denominator) / voxelSizeSq) - (1. - uAlbedo) * extinction * fluence + residual.r;
}

// #part /glsl/shaders/renderers/FDM/computeError/vertex

#version 300 es

layout (location = 0) in vec2 aPosition;
out vec2 vPosition;

void main() {
    vPosition = (aPosition + 1.0) * 0.5;
    gl_Position = vec4(aPosition, 0.0, 1.0);
}

// #part /glsl/shaders/renderers/FDM/computeError/fragment

#version 300 es
precision highp float;

uniform highp sampler3D uSolution;
uniform highp sampler3D uSolutionUp;

in vec2 vPosition;

uniform float uLayerRelative;
uniform vec3 uStep;

layout (location = 0) out float oError;

void main() {
    vec3 position = vec3(vPosition.x, vPosition.y, uLayerRelative);

    if (position.x < uStep.x || position.y < uStep.y || position.z < uStep.z ||
    position.x >= 1. - uStep.x || position.y >= 1. - uStep.y || position.z >= 1. - uStep.z) {
        oError = 0.;
        return;
    }

    vec4 solution = texture(uSolution, position);
    vec4 solutionUp = texture(uSolutionUp, position);

    oError = solution.r - solutionUp.r;
}