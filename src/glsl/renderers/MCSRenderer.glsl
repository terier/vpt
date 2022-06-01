// #part /glsl/shaders/renderers/MCS/generate/vertex

#version 300 es
precision mediump float;

uniform mat4 uMvpInverseMatrix;

layout (location = 0) in vec2 aPosition;
out vec3 vRayFrom;
out vec3 vRayTo;
out vec2 vPosition;

// #link /glsl/mixins/unproject
@unproject

void main() {
    unproject(aPosition, uMvpInverseMatrix, vRayFrom, vRayTo);
    vPosition = aPosition * 0.5 + 0.5;
    gl_Position = vec4(aPosition, 0, 1);
}

// #part /glsl/shaders/renderers/MCS/generate/fragment

#version 300 es
precision mediump float;

#define M_INVPI 0.31830988618

uniform mediump sampler3D uVolume;
uniform mediump sampler2D uTransferFunction;
uniform mediump sampler2D uEnvironment;
uniform float uRandSeed;
uniform float uExtinction;
uniform vec3 uScatteringDirection;

in vec3 vRayFrom;
in vec3 vRayTo;
in vec2 vPosition;
out vec4 oColor;

// #link /glsl/mixins/intersectCube
@intersectCube

@constants
@random/hash/pcg
@random/hash/squashlinear
@random/distribution/uniformdivision
@random/distribution/exponential

vec4 sampleEnvironmentMap(vec3 d) {
    vec2 texCoord = vec2(atan(d.x, -d.z), asin(-d.y) * 2.0) * INVPI * 0.5 + 0.5;
    return texture(uEnvironment, texCoord);
}

vec4 sampleVolumeColor(vec3 position) {
    vec2 volumeSample = texture(uVolume, position).rg;
    vec4 transferSample = texture(uTransferFunction, volumeSample);
    return transferSample;
}

float sampleDistance(inout uint state, vec3 from, vec3 to) {
    float maxDistance = distance(from, to);
    float dist = 0.0;

    do {
        dist += random_exponential(state, uExtinction);
        if (dist > maxDistance) {
            break;
        }
        vec3 samplingPosition = mix(from, to, dist / maxDistance);
        vec4 transferSample = sampleVolumeColor(samplingPosition);
        if (random_uniform(state) < transferSample.a) {
            break;
        }
    } while (true);

    return dist;
}

float sampleTransmittance(inout uint state, vec3 from, vec3 to) {
    float maxDistance = distance(from, to);
    float dist = 0.0;
    float transmittance = 1.0;

    do {
        dist += random_exponential(state, uExtinction);
        if (dist > maxDistance) {
            break;
        }
        vec3 samplingPosition = mix(from, to, dist / maxDistance);
        vec4 transferSample = sampleVolumeColor(samplingPosition);
        transmittance *= 1.0 - transferSample.a;
    } while (true);

    return transmittance;
}

void main() {
    vec3 rayDirection = vRayTo - vRayFrom;
    vec3 rayDirectionUnit = normalize(rayDirection);
    vec2 tbounds = max(intersectCube(vRayFrom, rayDirection), 0.0);

    if (tbounds.x >= tbounds.y) {
        oColor = sampleEnvironmentMap(rayDirectionUnit);
        return;
    }

    vec3 from = mix(vRayFrom, vRayTo, tbounds.x);
    vec3 to = mix(vRayFrom, vRayTo, tbounds.y);
    float maxDistance = distance(from, to);

    uint state = hash(uvec3(floatBitsToUint(vPosition.x), floatBitsToUint(vPosition.y), floatBitsToUint(uRandSeed)));
    float dist = sampleDistance(state, from, to);

    if (dist > maxDistance) {
        oColor = sampleEnvironmentMap(rayDirectionUnit);
        return;
    }

    from = mix(from, to, dist / maxDistance);
    tbounds = max(intersectCube(from, uScatteringDirection), 0.0);
    to = from + uScatteringDirection * tbounds.y;
    vec4 diffuseColor = sampleVolumeColor(from);
    vec4 lightColor = sampleEnvironmentMap(uScatteringDirection);
    float transmittance = sampleTransmittance(state, from, to);

    oColor = diffuseColor * lightColor * transmittance;
}

// #part /glsl/shaders/renderers/MCS/integrate/vertex

#version 300 es
precision mediump float;

layout (location = 0) in vec2 aPosition;
out vec2 vPosition;

void main() {
    vPosition = aPosition * 0.5 + 0.5;
    gl_Position = vec4(aPosition, 0, 1);
}

// #part /glsl/shaders/renderers/MCS/integrate/fragment

#version 300 es
precision mediump float;

uniform mediump sampler2D uAccumulator;
uniform mediump sampler2D uFrame;
uniform float uInvFrameNumber;

in vec2 vPosition;
out vec4 oColor;

void main() {
    vec4 acc = texture(uAccumulator, vPosition);
    vec4 frame = texture(uFrame, vPosition);
    oColor = acc + (frame - acc) * uInvFrameNumber;
}

// #part /glsl/shaders/renderers/MCS/render/vertex

#version 300 es
precision mediump float;

layout (location = 0) in vec2 aPosition;
out vec2 vPosition;

void main() {
    vPosition = aPosition * 0.5 + 0.5;
    gl_Position = vec4(aPosition, 0, 1);
}

// #part /glsl/shaders/renderers/MCS/render/fragment

#version 300 es
precision mediump float;

uniform mediump sampler2D uAccumulator;

in vec2 vPosition;
out vec4 oColor;

void main() {
    vec4 acc = texture(uAccumulator, vPosition);
    oColor = acc;
}

// #part /glsl/shaders/renderers/MCS/reset/vertex

#version 300 es
precision mediump float;

layout (location = 0) in vec2 aPosition;

void main() {
    gl_Position = vec4(aPosition, 0, 1);
}

// #part /glsl/shaders/renderers/MCS/reset/fragment

#version 300 es
precision mediump float;

out vec4 oColor;

void main() {
    oColor = vec4(0, 0, 0, 1);
}
