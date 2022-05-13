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

layout (location = 0) out vec2 oEmission;

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
    float emission = 1.0;
    vec3 light = normalize(uLight);
    vec3 rayDirection = -light;

    vec2 tbounds = max(intersectCube(from, rayDirection), 0.0);

    vec3 vRayTo = from + rayDirection;
    vec3 to = mix(from, vRayTo, tbounds.y);
//    vec3 to = tbounds.y * from;
    float rayStepLength = distance(from, to) * uStepSize;
    float t = 0.0;

    while (t < 1.0 && emission > 0.0) {
        vec3 position = mix(from, to, t);
        float absorption = sampleVolumeColor(position).a * rayStepLength * uExtinction;
        emission -= absorption;
        t += uStepSize;
    }

    if (emission < 0.0) {
        emission = 0.0;
    }

    oEmission = vec2(emission, emission * emission);
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

uniform highp sampler3D uFluence;
uniform highp sampler3D uEmission;
uniform mediump sampler3D uVolume;
uniform mediump sampler2D uTransferFunction;

uniform vec3 uStep;
uniform uvec3 uSize;
uniform float uLayer;

uniform float uAbsorptionCoefficient;
uniform float uScatteringCoefficient;
uniform float uVoxelSize;
uniform float uSOR;
uniform uint uRed;
uniform float uEpsilon;

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
    float inv_R = 1.0 / R;
    return inv_R * (coth(R) - inv_R);
}

void main() {
    vec2 mappedPosition = vPosition * 0.5 + 0.5;
    vec3 position = vec3(mappedPosition, uLayer);

    float max_dimension = float(max(max(uSize[0], uSize[1]), uSize[2]));
    float mipmapLevel = log2(max_dimension) + 1.0;
    float RMS_j = sqrt(textureLod(uEmission, position, mipmapLevel).g);
    float RMS_R = sqrt(textureLod(uFluence, position, mipmapLevel).b);

    if (RMS_R < 10e-6 * RMS_j) {
        return;
    }

    vec4 fluenceAndDiffCoeff = texture(uFluence, position);
    float fluence = fluenceAndDiffCoeff.r;
    float diffCoeff = fluenceAndDiffCoeff.g;
    float emission = texture(uEmission, position).r;

    if (position.x <= uStep.x || position.y <= uStep.y || position.z <= uStep.z ||
    position.x >= 1.0 - uStep.x || position.y >= 1.0 - uStep.y || position.z >= 1.0 - uStep.z) {
        oFluence = fluenceAndDiffCoeff;
        return;
    }
    uint texelConsecutiveNumber = uSize[0] + uSize[1] + uSize[2];
    if ((uRed == 1u && texelConsecutiveNumber % 2u == 0u) && (uRed == 0u && texelConsecutiveNumber % 2u == 1u)) {
        oFluence = fluenceAndDiffCoeff;
        return;
    }
    float val = texture(uVolume, position).r;
    vec4 colorSample = texture(uTransferFunction, vec2(val, 0.5));
    float absorption = colorSample.a * uAbsorptionCoefficient;
    float extinction = absorption + uScatteringCoefficient;
    float albedo = uScatteringCoefficient / extinction;
    extinction = max(extinction, 10e-3 / max_dimension);

    vec4 left      = texture(uFluence, position + vec3(-uStep.x,  0,  0));
    vec4 right     = texture(uFluence, position + vec3( uStep.x,  0,  0));
    vec4 down      = texture(uFluence, position + vec3( 0, -uStep.y,  0));
    vec4 up        = texture(uFluence, position + vec3( 0,  uStep.y,  0));
    vec4 back      = texture(uFluence, position + vec3( 0,  0, -uStep.z));
    vec4 forward   = texture(uFluence, position + vec3( 0,  0,  uStep.z));

    vec3 gradient = vec3(
        right[0] - left[0],
        up[0] - down[0],
        forward[0] - back[0]
    );
    gradient = gradient / (2.0 * uVoxelSize);

    float R = max(length(gradient), uEpsilon * RMS_j) / max(extinction * fluence, uEpsilon * RMS_j);
    float D = flux_max(R) / extinction;

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
    float denominator = (1.0 - albedo) * extinction * voxelSizeSq + sum_denominator;

    float new_fluence = numerator / denominator;
    new_fluence = uSOR * new_fluence + (1.0 - uSOR) * fluence;

    float residual = (numerator - new_fluence * denominator) / voxelSizeSq;

    oFluence = vec4(new_fluence, D, residual * residual, 0);
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

uniform highp sampler3D uFluence;
uniform mediump sampler3D uVolume;
uniform mediump sampler2D uTransferFunction;

uniform float uStepSize;
uniform float uOffset;
uniform float uExtinction;

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

            float fluence = texture(uFluence, position).r;

            vec4 colorSample = sampleVolumeColor(position);
            colorSample.a *= rayStepLength * uExtinction;
            colorSample.rgb *= colorSample.a * fluence;

            // debug
//            vec4 colorSample = vec4(vec3(fluence), 1);

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
    float max_dimension = float(max(max(uSize[0], uSize[1]), uSize[2]));
    float mipmapLevel = log2(max_dimension) + 1.0;
    float RMS_j = sqrt(textureLod(uEmission, position, mipmapLevel).g);

    float fluence = uEpsilon * RMS_j * uVoxelSize;
    float diff_coeff = uEpsilon;

//    int location = 0;
//    if (position.x < uStep.x) {
//        location = 1;
//    } else if (position.x > 1.0 - uStep.x) {
//        location = 2;
//    } else if (position.y < uStep.y) {
//        location = 3;
//    } else if (position.y > 1.0 - uStep.y) {
//        location = 4;
//    } else if (position.z < uStep.z) {
//        location = 5;
//    } else if (position.z >  1.0 - uStep.z) {
//        location = 6;
//    }
//    if (location == 1 && uLight.x > 0.0 ||
//    location == 2 && uLight.x < 0.0 ||
//    location == 3 && uLight.y > 0.0 ||
//    location == 4 && uLight.y < 0.0 ||
//    location == 5 && uLight.z > 0.0 ||
//    location == 6 && uLight.z < 0.0) {
//        fluence = 1.0;
//    }

    float source = 1.0;

    oFluence = vec4(fluence, diff_coeff, 100, 0);
}
