// #part /glsl/shaders/renderers/MCD/integrate/vertex

#version 300 es

layout (location = 0) in vec2 aPosition;

out vec2 vPosition;

void main() {
    vPosition = aPosition;
    gl_Position = vec4(aPosition, 0.0, 1.0);
}

// #part /glsl/shaders/renderers/MCD/integrate/fragment

#version 300 es
precision mediump float;

#define M_INVPI 0.31830988618
#define M_2PI 6.28318530718
#define EPS 1e-5

uniform mediump sampler2D uPosition;
uniform mediump sampler2D uDirection;
uniform mediump sampler2D uTransmittance;
uniform mediump sampler2D uRadiance;
uniform mediump sampler2D uLightDirection;

uniform mediump sampler3D uVolume;
uniform mediump sampler2D uLights;
uniform mediump sampler2D uTransferFunction;

uniform mat4 uMvpInverseMatrix;
uniform vec2 uInverseResolution;
uniform float uRandSeed;
uniform float uBlur;

uniform float uAbsorptionCoefficient;
uniform float uScatteringCoefficient;
uniform float uScatteringBias;
uniform float uMajorant;
uniform uint uMaxBounces;
uniform uint uSteps;
uniform uint uNLights;

in vec2 vPosition;

layout (location = 0) out vec4 oPosition;
layout (location = 1) out vec4 oDirection;
layout (location = 2) out vec4 oTransmittance;
layout (location = 3) out vec4 oRadiance;
layout (location = 4) out vec4 oLightDirection;

// #link /glsl/mixins/PhotonMCD
@PhotonMCD

// #link /glsl/mixins/rand
@rand
// #link /glsl/mixins/unprojectRand
@unprojectRand
// #link /glsl/mixins/intersectCube
@intersectCube

vec4 getRandomLight(vec2 randState) {
    randState = rand(randState);
    return texture(uLights, vec2(randState.x, 0.5));
}

void resetPhoton(inout vec2 randState, inout PhotonMCD photon) {
    vec3 from, to;
    unprojectRand(randState, vPosition, uMvpInverseMatrix, uInverseResolution, uBlur, from, to);
    photon.direction = normalize(to - from);
    photon.bounces = 0u;
    vec2 tbounds = max(intersectCube(from, photon.direction), 0.0);
    photon.position = from + tbounds.x * photon.direction;
    photon.transmittance = vec3(1);
    photon.light = getRandomLight(randState).xyz;
    photon.done = 0u;
}

vec4 sampleVolumeColor(vec3 position) {
    vec2 volumeSample = texture(uVolume, position).rg;
    vec4 transferSample = texture(uTransferFunction, volumeSample);
    return transferSample;
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

void main() {
    PhotonMCD photon;
    vec2 mappedPosition = vPosition * 0.5 + 0.5;
    photon.position = texture(uPosition, mappedPosition).xyz;
    vec4 directionAndBounces = texture(uDirection, mappedPosition);
    photon.direction = directionAndBounces.xyz;
    photon.bounces = uint(directionAndBounces.w + 0.5);
    photon.transmittance = texture(uTransmittance, mappedPosition).rgb;
    vec4 radianceAndSamples = texture(uRadiance, mappedPosition);
    photon.radiance = radianceAndSamples.rgb;
    photon.samples = uint(radianceAndSamples.w + 0.5);
    vec4 lightAndDone = texture(uLightDirection, mappedPosition);
    photon.light = lightAndDone.rgb;
    photon.done = uint(lightAndDone.w + 0.5);

    vec2 r = rand(vPosition * uRandSeed);
    for (uint i = 0u; i < uSteps; i++) {
        r = rand(r);
        float t = -log(r.x) / uMajorant;
        vec3 prevPosition = photon.position;
        photon.position += t * photon.direction;

        vec4 volumeSample = sampleVolumeColor(photon.position);
        float muAbsorption = volumeSample.a * uAbsorptionCoefficient;
        float muScattering = volumeSample.a * uScatteringCoefficient;
        float muNull = uMajorant - muAbsorption - muScattering;
        float muMajorant = muAbsorption + muScattering + abs(muNull);
        float PNull = abs(muNull) / muMajorant;
        float PAbsorption = muAbsorption / muMajorant;
        float PScattering = muScattering / muMajorant;

        if (any(greaterThan(photon.position, vec3(1))) || any(lessThan(photon.position, vec3(0)))) {
            // out of bounds
            if (photon.done < 1u && !(all(equal(photon.transmittance, vec3(1.0))))) { //  && photon.bounces > 0u
                photon.position = prevPosition;
                photon.done = 1u;
                photon.direction = -normalize(photon.light);
                photon.bounces = uMaxBounces + 10u;
            }
            else {
                vec3 radiance = photon.transmittance * float(uNLights);  //* envSample.rgb;
                photon.samples++;
                photon.radiance += (radiance - photon.radiance) / float(photon.samples);
                resetPhoton(r, photon);
            }
        } else if (photon.bounces >= uMaxBounces) {
            // max bounces achieved -> only estimate transmittance
            float weightAS = (muAbsorption + muScattering) / uMajorant;
            photon.transmittance *= 1.0 - weightAS;
        } else if (r.y < PAbsorption) {
            // absorption
            float weightA = muAbsorption / (uMajorant * PAbsorption);
            photon.transmittance *= 1.0 - weightA;
        } else if (r.y < PAbsorption + PScattering) {
            // scattering
            r = rand(r);
            float weightS = muScattering / (uMajorant * PScattering);
            photon.transmittance *= volumeSample.rgb * weightS;
            photon.direction = sampleHenyeyGreenstein(uScatteringBias, r, photon.direction);
            photon.bounces++;
            r = rand(r);
            if (r.x < 0.05 || photon.bounces >= uMaxBounces) {
                photon.done = 1u;
                photon.direction = -normalize(photon.light);
                photon.bounces = uMaxBounces + 10u;
            }
        } else {
            // null collision
            float weightN = muNull / (uMajorant * PNull);
            photon.transmittance *= weightN;
        }
    }

    oPosition = vec4(photon.position, 0);
    oDirection = vec4(photon.direction, float(photon.bounces));
    oTransmittance = vec4(photon.transmittance, 0);
    oRadiance = vec4(photon.radiance, float(photon.samples));
    oLightDirection = vec4(photon.light, float(photon.done));
}

// #part /glsl/shaders/renderers/MCD/render/vertex

#version 300 es

layout (location = 0) in vec2 aPosition;
out vec2 vPosition;

void main() {
    vPosition = (aPosition + 1.0) * 0.5;
    gl_Position = vec4(aPosition, 0.0, 1.0);
}

// #part /glsl/shaders/renderers/MCD/render/fragment

#version 300 es
precision mediump float;

uniform mediump sampler2D uColor;

in vec2 vPosition;
out vec4 oColor;

void main() {
    oColor = vec4(texture(uColor, vPosition).rgb, 1);
}

// #part /glsl/shaders/renderers/MCD/reset/vertex

#version 300 es

layout (location = 0) in vec2 aPosition;

out vec2 vPosition;

void main() {
    vPosition = aPosition;
    gl_Position = vec4(aPosition, 0.0, 1.0);
}

// #part /glsl/shaders/renderers/MCD/reset/fragment

#version 300 es
precision mediump float;

uniform mediump sampler2D uLights;

// #link /glsl/mixins/PhotonMCD
@PhotonMCD

uniform mat4 uMvpInverseMatrix;
uniform vec2 uInverseResolution;
uniform float uRandSeed;
uniform float uBlur;

in vec2 vPosition;

layout (location = 0) out vec4 oPosition;
layout (location = 1) out vec4 oDirection;
layout (location = 2) out vec4 oTransmittance;
layout (location = 3) out vec4 oRadiance;
layout (location = 4) out vec4 oLightDirection;

// #link /glsl/mixins/rand
@rand
// #link /glsl/mixins/unprojectRand
@unprojectRand
// #link /glsl/mixins/intersectCube
@intersectCube

vec4 getRandomLight(vec2 randState) {
    randState = rand(randState);
    return texture(uLights, vec2(randState.x, 0.5));
}

void main() {
    PhotonMCD photon;
    vec3 from, to;
    vec2 randState = rand(vPosition * uRandSeed);
    unprojectRand(randState, vPosition, uMvpInverseMatrix, uInverseResolution, uBlur, from, to);
    photon.direction = normalize(to - from);
    vec2 tbounds = max(intersectCube(from, photon.direction), 0.0);
    photon.position = from + tbounds.x * photon.direction;
    photon.transmittance = vec3(1);
    photon.radiance = vec3(1);
    photon.bounces = 0u;
    photon.samples = 0u;
    photon.done = 0u;
    photon.light = getRandomLight(randState).xyz;
    oPosition = vec4(photon.position, 0);
    oDirection = vec4(photon.direction, float(photon.bounces));
    oTransmittance = vec4(photon.transmittance, 0);
    oRadiance = vec4(photon.radiance, float(photon.samples));
    oLightDirection = vec4(photon.light, float(photon.done));
}
