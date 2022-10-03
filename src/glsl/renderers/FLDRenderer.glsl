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

// #link /glsl/mixins/unproject.glsl
@unproject

void main() {
    unproject(aPosition, uMvpInverseMatrix, vRayFrom, vRayTo);
    gl_Position = vec4(aPosition, 0, 1);
}

// #part /glsl/shaders/renderers/FLD/render/fragment

#version 300 es

precision highp float;

#define PI 3.14159265358

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
out vec4 oColor;

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
//                case 0u:
//                    factor = vec3(emission);
//                    break;
//                case 1u:
//                    factor = vec3(fluence);
//                    break;
//                case 2u:
//                    vec3 scattering_coeff = colorSample.rgb * uExtinction * uAlbedo;
//                    factor = (emission + scattering_coeff * fluence) / (4.0 * PI);
//                    break;
//            }

            float factor = 0.0;
            switch (uView) {
                case 0u:
                factor = emission;
                break;
                case 1u:
                factor = fluence;
                break;
                case 2u:
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

in vec3 vRayFrom;
in vec3 vRayTo;
layout (location = 0) out vec4 oColor;
layout (location = 1) out float oLighting;

//debug
in vec2 vPosition;

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
    } else {
        vec3 from = mix(vRayFrom, vRayTo, tbounds.x);
        vec3 to = mix(vRayFrom, vRayTo, tbounds.y);
        float rayStepLength = distance(from, to) * uStepSize;

        float t = 0.0;
        vec4 accumulator = vec4(0);
        float lightingAccumulator = 0.0;

        while (t < 1.0 && accumulator.a < 0.99) {
            vec3 position = mix(from, to, t);

            vec4 colorSample = sampleVolumeColor(position);

            // Lighting Factor
            float emission = texture(uEmission, position).r;
            float fluence = texture(uFluence, position).r;

            float lightingFactor = 0.0;
            switch (uView) {
                case 0u:
                lightingFactor = emission;
                break;
                case 1u:
                lightingFactor = fluence;
                break;
                case 2u:
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
        }

        if (accumulator.a > 1.0) {
            accumulator.rgb /= accumulator.a;
        }
        lightingAccumulator /= accumulator.a;

        //        oColor = vec4(accumulator.rgb, 1.0);
//        oColor = mix(vec4(1), vec4(accumulator.rgb, 1), accumulator.a);
//        oColor = mix(vec4(0), vec4(accumulator.rgb, 1), accumulator.a);
        oColor = vec4(accumulator.rgb, 1);
        oLighting = lightingAccumulator;
    }
}

// #part /glsl/shaders/renderers/FLD/combine_render/vertex

#version 300 es
precision mediump float;

uniform mat4 uMvpInverseMatrix;

layout(location = 0) in vec2 aPosition;
out vec3 vRayFrom;
out vec3 vRayTo;

out vec2 vPosition;

// #link /glsl/mixins/unproject.glsl
@unproject

void main() {
    unproject(aPosition, uMvpInverseMatrix, vRayFrom, vRayTo);
    gl_Position = vec4(aPosition, 0.0, 1.0);
    vPosition = (aPosition + 1.0) * 0.5;
}

// #part /glsl/shaders/renderers/FLD/combine_render/fragment

#version 300 es
precision highp float;

uniform highp sampler2D uColor;
uniform highp sampler2D uLighting;
uniform int uSmartDeNoise;
uniform float uSigma;
uniform float uKSigma;
uniform float uTreshold;

uniform uint uDeferredView;

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

    switch (uDeferredView) {
        case 0u:
        oColor = colorSample;
        break;
        case 1u:
//        oColor = mix(vec4(vec3(lightingSample), 1), vec4(0, 0, 0, 1), lightingSample);
        oColor = vec4(vec3(lightingSample), 1);
        break;
        case 2u:
//        oColor = mix(colorSample, vec4(0, 0, 0, 1), lightingSample);
//        oColor = colorSample * (1.0 - lightingSample);
        oColor = mix(vec4(0, 0, 0, 1), colorSample, lightingSample);
//        oColor = colorSample * lightingSample;

        break;
    }
}