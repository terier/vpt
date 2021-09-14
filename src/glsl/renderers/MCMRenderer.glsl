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
precision mediump float;
precision mediump sampler2D;
precision mediump sampler3D;

#define M_INVPI 0.31830988618
#define M_2PI 6.28318530718
#define EPS 1e-5

// #link /glsl/mixins/Photon
@Photon
// #link /glsl/mixins/rand
@rand
// #link /glsl/mixins/unprojectRand
@unprojectRand
// #link /glsl/mixins/intersectCube
@intersectCube

uniform sampler2D uPosition;
uniform sampler2D uDirectionAndBounces;
uniform sampler2D uWeight;
uniform sampler2D uRadianceAndSamples;

uniform sampler3D uVolume;
uniform sampler2D uAbsorptionTransferFunction;
uniform sampler2D uScatteringTransferFunction;
uniform sampler2D uEnvironment;

uniform mat4 uMvpInverseMatrix;
uniform vec2 uInverseResolution;
uniform float uRandSeed;
uniform float uBlur;

uniform float uAbsorptionScale;
uniform float uScatteringScale;
uniform float uScatteringBias;
uniform float uMajorant;
uniform uint uMaxBounces;
uniform uint uSteps;

in vec2 vPosition;

layout (location = 0) out vec4 oPosition;
layout (location = 1) out vec4 oDirectionAndBounces;
layout (location = 2) out vec4 oWeight;
layout (location = 3) out vec4 oRadianceAndSamples;

void resetPhoton(inout vec2 randState, inout Photon photon) {
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

void sampleVolume(vec3 position, out vec3 absorptionCoefficient, out vec3 scatteringCoefficient) {
    vec2 volumeSample = texture(uVolume, position).rg;
    vec4 absorptionSample = texture(uAbsorptionTransferFunction, volumeSample);
    vec4 scatteringSample = texture(uScatteringTransferFunction, volumeSample);
    absorptionCoefficient = absorptionSample.rgb * absorptionSample.a * uAbsorptionScale;
    scatteringCoefficient = scatteringSample.rgb * scatteringSample.a * uScatteringScale;
}

vec3 randomDirection(vec2 U) {
    float phi = U.x * M_2PI;
    float z = U.y * 2.0 - 1.0;
    float k = sqrt(1.0 - z * z);
    return vec3(k * cos(phi), k * sin(phi), z);
}

float sampleHenyeyGreensteinAngleCosine(float g, float U) {
    float g2 = g * g;
    float c = (1.0 - g2) / (1.0 - g + 2.0 * g * U);
    return (1.0 + g2 - c * c) / (2.0 * g);
}

vec3 sampleHenyeyGreenstein(float g, vec2 U, vec3 direction) {
    // generate random direction and adjust it so that the angle is HG-sampled
    vec3 u = randomDirection(U);
    if (abs(g) < EPS) {
        return u;
    }
    float hgcos = sampleHenyeyGreensteinAngleCosine(g, fract(sin(U.x * 12345.6789) + 0.816723));
    float lambda = hgcos - dot(direction, u);
    return normalize(u + lambda * direction);
}

void normalizeProbabilities(inout float PA, inout float PB, inout float PC) {
    float c = 1.0 / (PA + PB + PC);
    PA *= c;
    PB *= c;
    PC *= c;
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

    vec2 randState = rand(vPosition * uRandSeed);
    for (uint i = 0u; i < uSteps; i++) {
        randState = rand(randState);
        float t = -log(randState.x) / uMajorant;
        photon.position += t * photon.direction;

        vec3 absorptionCoefficient, scatteringCoefficient, nullCoefficient;
        sampleVolume(photon.position, absorptionCoefficient, scatteringCoefficient);
        nullCoefficient = vec3(uMajorant) - absorptionCoefficient - scatteringCoefficient;

        float absorptionProbability = dot(abs(absorptionCoefficient) * photon.weight, vec3(1));
        float nullProbability = dot(abs(nullCoefficient) * photon.weight, vec3(1));
        float scatteringProbability = dot(abs(scatteringCoefficient) * photon.weight, vec3(1));
        if (photon.bounces >= fMaxBounces) {
            scatteringProbability = 0.0;
        }

        normalizeProbabilities(absorptionProbability, scatteringProbability, nullProbability);

        if (any(greaterThan(photon.position, vec3(1))) || any(lessThan(photon.position, vec3(0)))) {
            // out of volume, sample environment radiance
            vec3 sampleRadiance = sampleEnvironmentMap(photon.direction).rgb;
            photon.weight *= sampleRadiance * absorptionCoefficient / (uMajorant * absorptionProbability);
            samples += 1.0;
            radiance += (sampleRadiance - radiance) / samples;
            resetPhoton(randState, photon);
        } else if (randState.y < absorptionProbability) {
            // absorption
            vec3 sampleRadiance = vec3(0);
            photon.weight *= sampleRadiance * absorptionCoefficient / (uMajorant * absorptionProbability);
            samples += 1.0;
            radiance += (sampleRadiance - radiance) / samples;
            resetPhoton(randState, photon);
        } else if (randState.y < absorptionProbability + scatteringProbability) {
            // scattering
            randState = rand(randState);
            photon.weight *= scatteringCoefficient / (uMajorant * scatteringProbability);
            photon.direction = sampleHenyeyGreenstein(uScatteringBias, randState, photon.direction);
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

// #link /glsl/mixins/rand
@rand
// #link /glsl/mixins/unprojectRand
@unprojectRand
// #link /glsl/mixins/intersectCube
@intersectCube

uniform mat4 uMvpInverseMatrix;
uniform vec2 uInverseResolution;
uniform float uRandSeed;
uniform float uBlur;

in vec2 vPosition;

layout (location = 0) out vec4 oPosition;
layout (location = 1) out vec4 oDirectionAndBounces;
layout (location = 2) out vec4 oWeight;
layout (location = 3) out vec4 oRadianceAndSamples;

void main() {
    vec3 from, to;
    vec2 randState = rand(vPosition * uRandSeed);
    unprojectRand(randState, vPosition, uMvpInverseMatrix, uInverseResolution, uBlur, from, to);
    vec3 direction = normalize(to - from);
    vec2 tbounds = max(intersectCube(from, direction), 0.0);
    oPosition = vec4(from + tbounds.x * direction, 0);
    oDirectionAndBounces = vec4(direction, 0);
    oWeight = vec4(vec3(1), 0);
    oRadianceAndSamples = vec4(vec3(1), 0);
}
