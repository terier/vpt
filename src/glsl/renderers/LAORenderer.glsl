// #part /glsl/shaders/renderers/LAO/generate/vertex

#version 300 es

uniform mat4 uMvpInverseMatrix;
uniform vec3 uLightPosition;

out vec3 vRayFrom;
out vec3 vRayTo;
out vec3 vLight;
out vec2 vPosition;

// #link /glsl/mixins/unproject.glsl
@unproject

const vec2 vertices[] = vec2[](
    vec2(-1, -1),
    vec2( 3, -1),
    vec2(-1,  3)
);

void main() {
    vec2 position = vertices[gl_VertexID];
    unproject(position, uMvpInverseMatrix, vRayFrom, vRayTo);
	vLight = vec3(uMvpInverseMatrix * vec4(uLightPosition, 1.0)).rgb;
    vPosition = position;
    gl_Position = vec4(position, 0, 1);
}

// #part /glsl/shaders/renderers/LAO/generate/fragment

#version 300 es
precision mediump float;
precision mediump sampler2D;
precision mediump sampler3D;

uniform sampler3D uVolume;
uniform sampler2D uTransferFunction;
uniform float uStepSize;
uniform float uOffset;
uniform float uExtinction;
uniform bool uLocalAmbientOcclusion; // = true;
uniform int uNumLAOSamples; // = 1;
uniform float uLAOStepSize; // = 0.05;
uniform float uLAOWeight; // = 0.69;
uniform bool uSoftShadows; // = true;
uniform int uNumShadowSamples; // = 10;
uniform float uShadowsWeight; // = 0.54;
uniform float uLightRadious; // = 0.19;
uniform float uLightCoeficient; // = 1.0;

in vec3 vRayFrom;
in vec3 vRayTo;
in vec3 vLight;
in vec2 vPosition;

out vec4 oColor;

vec3 voxelSize = 1.0 / vec3(32.0); // TODO: calculate size from volume dimensions
vec2 seed = vec2(3.14, 2.71);

// #link /glsl/mixins/rand.glsl
@rand

// #link /glsl/mixins/intersectCube.glsl
@intersectCube

float sampleVolume(vec3 position) {
    vec4 value = texture(uVolume, position);
    return value.r;
}

vec3 gradient(vec3 position) {
    vec3 grad = vec3(0.0);
    grad.x = sampleVolume(position - vec3(voxelSize.x, 0, 0)) - sampleVolume(position + vec3(voxelSize.x, 0, 0));
    grad.y = sampleVolume(position - vec3(0, voxelSize.y, 0)) - sampleVolume(position + vec3(0, voxelSize.y, 0));
    grad.z = sampleVolume(position - vec3(0, 0, voxelSize.z)) - sampleVolume(position + vec3(0, 0, voxelSize.z));

    return grad;
}

float gradientMagnitude(vec3 grad) {
    return length(grad);
}

vec4 getColor(float value, float gradientMagnitude) {
    vec4 color = texture(uTransferFunction, vec2(value, gradientMagnitude));
    return color;
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

        vec4 color = vec4(0.0);
        vec3 grad = vec3(0.0);
        vec3 n = vec3(0.0);
        vec3 halfVector = vec3(0.0);
        float nDotL = 0.0;
        float value = 0.0;

        float t = 0.0;
        t = rand(vPosition * seed).r * uStepSize * 1.5;
        t = clamp(t, 0.0, 1.0);
        vec4 accumulator = vec4(0.00);

        while (t < 1.0 && accumulator.a < 0.99) {
            if (accumulator.a > 0.98) break;

            vec3 position = mix(from, to, t);
            t += uStepSize;

            grad = gradient(position);
            n = normalize(grad);

            value = sampleVolume(position);

            halfVector = normalize(vLight - position);

            vec4 LAOContribution = vec4(0.0);
            vec4 uSoftShadowsContribution = vec4(0.0);

            if (uLocalAmbientOcclusion) {
                vec4 accumuLAOContribution = vec4(0.0);
                for (int samp = 0; samp < uNumLAOSamples; samp++) {
                    for (float t = 0.001; t < 1.0; t += uLAOStepSize) {
                        vec3 randomDirection = -1.0 + 2.0 * vec3(rand(vPosition * seed).x, rand(vPosition * seed).x, rand(vPosition * seed).x);
                        randomDirection = normalize(randomDirection) * rand(vPosition * seed).x;
                        vec3 laoHalfVector = normalize(vLight + randomDirection * mix(0.0, uLightRadious, t) - position);
                        vec3 samplePos = position + laoHalfVector * t;
                        float laoSample = sampleVolume(samplePos);
                        accumuLAOContribution += laoSample * pow(1.0 - t, 2.0);
                    }
                    accumuLAOContribution /= uLightCoeficient;
                    accumuLAOContribution = clamp(accumuLAOContribution, 0.0, 1.0);
                    LAOContribution += accumuLAOContribution;
                }
                LAOContribution /= float(uNumLAOSamples);
            }

            if (uSoftShadows) {
                vec4 accumulatedShadowContribution = vec4(0.0);
                for (int samp = 0; samp < uNumShadowSamples; samp++) {
                    vec3 randomDirection = vec3(-1.0 + vLight.x * rand(vPosition * seed).x, vLight.y + rand(vPosition * seed).x * vLight.z, -1.0 + 2.0 * rand(seed).x);
                    randomDirection = normalize(randomDirection) * rand(vPosition * seed).x;

                    float volumeShadowSample = sampleVolume(position + randomDirection * uLightRadious) * 0.2;
                    accumulatedShadowContribution += sampleVolume(position + randomDirection * uLightRadious) * volumeShadowSample * pow(length(randomDirection), 1.0);
                }
                accumulatedShadowContribution = pow(accumulatedShadowContribution, vec4(1.0));
                accumulatedShadowContribution /= float(uNumShadowSamples);
                accumulatedShadowContribution *= 20.0;
                accumulatedShadowContribution = clamp(accumulatedShadowContribution, 0.0, 1.0);
                uSoftShadowsContribution = mix(1.0 - uSoftShadowsContribution, accumulatedShadowContribution, 1.2);
            }

            uSoftShadowsContribution /= 1.3;
            uSoftShadowsContribution = clamp(uSoftShadowsContribution, 0.0, 1.0);

            nDotL = max(dot(n, halfVector), 0.0);

            color = getColor(value, gradientMagnitude(grad));

			color = mix(color, color * vec4(0.15, 0.18, 0.32, 1.0), LAOContribution.r * uLAOWeight);
			color = mix(color, color * vec4(0.15, 0.18, 0.22, 1.0), uSoftShadowsContribution.r * uShadowsWeight);

			accumulator.rgb += (1.0 - accumulator.a) * color.rgb * value;
			accumulator.a += (1.0 - accumulator.a) * value * uExtinction / 100.0;

			if (accumulator.a > 0.9) break;
        }

        if (accumulator.a > 1.0) {
            accumulator.rgb /= accumulator.a;
        }

        oColor = vec4(accumulator.rgb, 1);
    }
}

// #part /glsl/shaders/renderers/LAO/integrate/vertex

#version 300 es

const vec2 vertices[] = vec2[](
    vec2(-1, -1),
    vec2( 3, -1),
    vec2(-1,  3)
);

out vec2 vPosition;

void main() {
    vec2 position = vertices[gl_VertexID];
    vPosition = position * 0.5 + 0.5;
    gl_Position = vec4(position, 0, 1);
}

// #part /glsl/shaders/renderers/LAO/integrate/fragment

#version 300 es
precision mediump float;
precision mediump sampler2D;
precision mediump sampler3D;

uniform sampler2D uAccumulator;
uniform sampler2D uFrame;

in vec2 vPosition;

out vec4 oColor;

void main() {
    oColor = texture(uFrame, vPosition);
}

// #part /glsl/shaders/renderers/LAO/render/vertex

#version 300 es

const vec2 vertices[] = vec2[](
    vec2(-1, -1),
    vec2( 3, -1),
    vec2(-1,  3)
);

out vec2 vPosition;

void main() {
    vec2 position = vertices[gl_VertexID];
    vPosition = position * 0.5 + 0.5;
    gl_Position = vec4(position, 0, 1);
}

// #part /glsl/shaders/renderers/LAO/render/fragment

#version 300 es
precision mediump float;
precision mediump sampler2D;

uniform sampler2D uAccumulator;

in vec2 vPosition;

out vec4 oColor;

void main() {
    oColor = texture(uAccumulator, vPosition);
}

// #part /glsl/shaders/renderers/LAO/reset/vertex

#version 300 es

const vec2 vertices[] = vec2[](
    vec2(-1, -1),
    vec2( 3, -1),
    vec2(-1,  3)
);

void main() {
    vec2 position = vertices[gl_VertexID];
    gl_Position = vec4(position, 0, 1);
}

// #part /glsl/shaders/renderers/LAO/reset/fragment

#version 300 es
precision mediump float;

out vec4 oColor;

void main() {
    oColor = vec4(0, 0, 0, 1);
}
