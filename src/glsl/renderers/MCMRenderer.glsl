// #part /glsl/shaders/renderers/MCM/integrate/vertex

#version 300 es

layout (location = 0) in vec2 aPosition;

out vec2 vPosition;

void main() {
    vPosition = aPosition;
    gl_Position = vec4(aPosition, 0.0, 1.0);
}

// #part /glsl/shaders/renderers/MCM/integrate/fragment

#version 300 es
precision highp float;
precision highp sampler2D;
precision highp sampler3D;

#define M_INVPI 0.31830988618
#define M_2PI 6.28318530718
#define EPS 1e-5

uniform sampler2D uPosition;
uniform sampler2D uDirectionAndBounces;
uniform sampler2D uWeight;
uniform sampler2D uRadianceAndSamples;

uniform sampler3D uVolume;
uniform sampler2D uTransferFunction;
uniform sampler2D uEnvironment;

uniform mat4 uMvpInverseMatrix;
uniform vec2 uInverseResolution;
uniform float uRandSeed;
uniform float uBlur;

uniform float uExtinctionScale;
uniform float uScatteringBias;
uniform float uMajorant;
uniform uint uMaxBounces;
uniform uint uSteps;

uniform vec4 uLight;

in vec2 vPosition;

layout (location = 0) out vec4 oPosition;
layout (location = 1) out vec4 oDirectionAndBounces;
layout (location = 2) out vec4 oWeight;
layout (location = 3) out vec4 oRadianceAndSamples;

// #link /glsl/mixins/PhotonW
@PhotonW
// #link /glsl/mixins/rand
@intersectCube
// #link /glsl/mixins/hashRand
@hashRand
// #link /glsl/mixins/unprojectHashRand
@unprojectHashRand

void resetPhoton(inout float randState, inout Photon photon) {
    vec3 from, to;
    unprojectRand(randState, vPosition, uMvpInverseMatrix, uInverseResolution, uBlur, from, to);
    photon.direction = normalize(to - from);
    photon.bounces = 0.0;
    vec2 tbounds = max(intersectCube(from, photon.direction), 0.0);
    photon.position = from + tbounds.x * photon.direction;
    photon.weight = vec3(1);
}

vec4 sampleEnvironmentMap(vec3 d) {
    vec2 texCoord = vec2(atan(d.x, -d.z), asin(-d.y) * 2.0) * M_INVPI * 0.5 + 0.5;
    return texture(uEnvironment, texCoord);
}

vec4 sampleVolumeColor(vec3 position) {
    vec2 volumeSample = texture(uVolume, position).rg;
    vec4 transferSample = texture(uTransferFunction, volumeSample);
    return transferSample;
}

vec3 randomDirection(inout float randState) {
    float phi = rand(randState) * M_2PI;
    float z = rand(randState) * 2.0 - 1.0;
    float k = sqrt(1.0 - z * z);
    return vec3(k * cos(phi), k * sin(phi), z);
}

float sampleHenyeyGreensteinAngleCosine(inout float randState, float g) {
    float g2 = g * g;
    float c = (1.0 - g2) / (1.0 - g + 2.0 * g * rand(randState));
    return (1.0 + g2 - c * c) / (2.0 * g);
}

vec3 sampleHenyeyGreenstein(inout float randState, float g, vec3 direction) {
    // generate random direction and adjust it so that the angle is HG-sampled
    vec3 u = randomDirection(randState);
    if (abs(g) < EPS) {
        return u;
    }
    float hgcos = sampleHenyeyGreensteinAngleCosine(randState, g);
    float lambda = hgcos - dot(direction, u);
    return normalize(u + lambda * direction);
}

void normalizeProbabilities(inout float PA, inout float PB, inout float PC) {
    float c = 1.0 / (PA + PB + PC);
    PA *= c;
    PB *= c;
    PC *= c;
}

float HenyeyGreensteinPhaseFunction(float g, vec3 inDirection, vec3 outDirection) {
    float g2 = g * g;
    float cosTheta = max(dot(inDirection, outDirection), 0.0);
    return (1.0 - g2) / pow(1.0 + g2 - 2.0 * g * cosTheta, 1.5);
}

void main() {
    Photon photon;
    vec2 texelPosition = vPosition * 0.5 + 0.5;
    photon.position = texture(uPosition, texelPosition).xyz;
    vec4 directionAndBounces = texture(uDirectionAndBounces, texelPosition);
    photon.direction = directionAndBounces.rgb;
    photon.bounces = directionAndBounces.a;
    photon.weight = texture(uWeight, texelPosition).rgb;
    vec4 radianceAndSamples = texture(uRadianceAndSamples, texelPosition);
    vec3 radiance = radianceAndSamples.rgb;
    float samples = radianceAndSamples.a;
    float fMaxBounces = float(uMaxBounces);

    float randState = uRandSeed;
    for (uint i = 0u; i < uSteps; i++) {
        float t = -log(rand(randState)) / uMajorant;
        photon.position += t * photon.direction;

        //        vec4 volumeSample = sampleVolumeColor(photon.position);

        vec2 volumeSample = texture(uVolume, photon.position).rg;
        vec4 transferSample = texture(uTransferFunction, volumeSample);

        float extinction = transferSample.a * uExtinctionScale;
        vec3 scatteringCoefficient = transferSample.rgb * extinction;
        vec3 absorptionCoefficient = (vec3(1) - transferSample.rgb) * extinction;
        vec3 nullCoefficient = vec3(uMajorant - extinction);

        float absorptionProbability = dot(abs(absorptionCoefficient /* * photon.weight */), vec3(1));
        float scatteringProbability = dot(abs(scatteringCoefficient /* * photon.weight */), vec3(1));
        float nullProbability = dot(abs(nullCoefficient /* * photon.weight */), vec3(1));
        if (photon.bounces >= fMaxBounces) {
            scatteringProbability = 0.0;
        }
        normalizeProbabilities(absorptionProbability, scatteringProbability, nullProbability);

        float fortuneWheel = rand(randState);

        if (any(greaterThan(photon.position, vec3(1))) || any(lessThan(photon.position, vec3(0)))) {
            // out of volume, sample environment radiance
            vec3 sampleRadiance = photon.weight * sampleEnvironmentMap(photon.direction).rgb;
            samples += 1.0;
            radiance += (sampleRadiance - radiance) / samples;
            resetPhoton(randState, photon);
        }
        else if (fortuneWheel < absorptionProbability) {
            // absorption
            vec3 sampleRadiance = vec3(0);
            samples += 1.0;
            radiance += (sampleRadiance - radiance) / samples;
            resetPhoton(randState, photon);
        } else if (fortuneWheel < absorptionProbability + scatteringProbability) {
            // scattering
            if (uLight.w < 0.5) {
                photon.weight *= scatteringCoefficient / (uMajorant * scatteringProbability);
                photon.direction = sampleHenyeyGreenstein(randState, uScatteringBias, photon.direction);
            }
            else {
                vec3 weightS = scatteringCoefficient / (uMajorant * scatteringProbability);
                vec3 outDirection = -normalize(uLight.xyz);
                photon.weight *= weightS * HenyeyGreensteinPhaseFunction(uScatteringBias, photon.direction, outDirection);
                photon.direction = outDirection;
            }
            photon.bounces += 1.0;
        } else {
            // null collision
            photon.weight *= nullCoefficient / (uMajorant * nullProbability);
        }
    }

    oPosition = vec4(photon.position, 0);
    oDirectionAndBounces = vec4(photon.direction, photon.bounces);
    oWeight = vec4(photon.weight, 0);
    oRadianceAndSamples = vec4(radiance, samples);
}

// #part /glsl/shaders/renderers/MCM/render/vertex

#version 300 es

layout (location = 0) in vec2 aPosition;
out vec2 vPosition;

void main() {
    vPosition = (aPosition + 1.0) * 0.5;
    gl_Position = vec4(aPosition, 0.0, 1.0);
}

// #part /glsl/shaders/renderers/MCM/render/fragment

#version 300 es
precision mediump float;

uniform mediump sampler2D uColor;

in vec2 vPosition;
out vec4 oColor;

void main() {
    oColor = vec4(texture(uColor, vPosition).rgb, 1);
}

// #part /glsl/shaders/renderers/MCM/reset/vertex

#version 300 es

layout (location = 0) in vec2 aPosition;

out vec2 vPosition;

void main() {
    vPosition = aPosition;
    gl_Position = vec4(aPosition, 0.0, 1.0);
}

// #part /glsl/shaders/renderers/MCM/reset/fragment

#version 300 es
precision mediump float;

uniform mat4 uMvpInverseMatrix;
uniform vec2 uInverseResolution;
uniform float uRandSeed;
uniform float uBlur;

in vec2 vPosition;

layout (location = 0) out vec4 oPosition;
layout (location = 1) out vec4 oDirectionAndBounces;
layout (location = 2) out vec4 oWeight;
layout (location = 3) out vec4 oRadianceAndSamples;

// #link /glsl/mixins/hashRand
@hashRand
// #link /glsl/mixins/unprojectHashRand
@unprojectHashRand
// #link /glsl/mixins/intersectCube
@intersectCube

void main() {
    vec3 from, to;
    float randState = uRandSeed;
    unprojectRand(randState, vPosition, uMvpInverseMatrix, uInverseResolution, uBlur, from, to);
    vec3 direction = normalize(to - from);
    vec2 tbounds = max(intersectCube(from, direction), 0.0);
    oPosition = vec4(from + tbounds.x * direction, 0);
    oDirectionAndBounces = vec4(direction, 0);
    oWeight = vec4(vec3(1), 0);
    oRadianceAndSamples = vec4(vec3(1), 0);
}
