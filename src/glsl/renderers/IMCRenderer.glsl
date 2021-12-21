// #package glsl/shaders

// #include ../mixins/unproject.glsl
// #include ../mixins/intersectCube.glsl

// #section IMCGenerate/vertex

#version 300 es
precision mediump float;

uniform mat4 uMvpInverseMatrix;

layout (location = 0) in vec2 aPosition;

out vec2 vPosition;
out vec3 vRayFrom;
out vec3 vRayTo;

@unproject

void main() {
    vPosition = aPosition * 0.5 + 0.5;
    unproject(aPosition, uMvpInverseMatrix, vRayFrom, vRayTo);
    gl_Position = vec4(aPosition, 0.0, 1.0);
}

// #section IMCGenerate/fragment

#version 300 es
precision mediump float;

uniform mediump sampler2D uClosest;
uniform mediump sampler3D uVolume;
uniform int uSteps;
uniform float uOffset;
uniform float uRandSeed;
uniform float uIsovalue;
uniform int uNLayers;
uniform float uIsovalues[4];

in vec2 vPosition;
in vec3 vRayFrom;
in vec3 vRayTo;

out vec4 oClosest;

@intersectCube
@rand

void main() {

}

// #section IMCIntegrateISO/vertex

#version 300 es
precision mediump float;

uniform mat4 uMvpInverseMatrix;

layout (location = 0) in vec2 aPosition;

out vec2 vPosition;
out vec3 vRayFrom;
out vec3 vRayTo;

@unproject

void main() {
    vPosition = aPosition * 0.5 + 0.5;
    unproject(aPosition, uMvpInverseMatrix, vRayFrom, vRayTo);
    gl_Position = vec4(aPosition, 0.0, 1.0);
}

// #section IMCIntegrateISO/fragment

#version 300 es
#define M_PI 3.141592653589f
precision mediump float;

uniform mediump sampler2D uRender;
uniform mediump sampler2D uClosest;
uniform mediump sampler3D uVolume;
uniform int uSteps;
uniform int uNLayers;
uniform float uRandSeed;
uniform vec3 uLight;

uniform float uIsovalues[4];
uniform float uAlphas[4];
uniform float uSpecularWeights[4];
uniform float uAlphaRoughness[4];
uniform vec3 uColors[4];
uniform vec3 uF0[4];
uniform vec3 uF90[4];

uniform mat4 uMvpInverseMatrix;

in vec2 vPosition;
in vec3 vRayFrom;
in vec3 vRayTo;

layout (location = 0) out vec4 oRender;
layout (location = 1) out vec4 oClosest;


@intersectCube
@rand
@BRDF

float calcLayer(float closest, float isoValue, inout vec4 from, vec4 to, vec2 r) {
    if (closest > 0.0) {
        to = vec4(mix(vRayFrom, vRayTo, closest), closest);
    }
    for (int i = 0; i < uSteps; i++) {
        r = rand(r);
        float tboundsY = mix(from.w, to.w, r.x);
        vec3 pos = mix(vRayFrom, vRayTo, tboundsY);
        float value = texture(uVolume, pos).r;
        if (value >= isoValue) {
            if (closest < 0.0 || tboundsY < closest) {
                closest = tboundsY;
                to = vec4(mix(vRayFrom, vRayTo, tboundsY), tboundsY);
            }
        }
    }
    if (closest > 0.0) {
        from = to;
    }
    return closest;
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
    if (uNLayers == 0) {
        oClosest = vec4(-1);
        return;
    }
    vec3 rayDirection = vRayTo - vRayFrom;
    vec2 tbounds = max(intersectCube(vRayFrom, rayDirection), 0.0);
    if (tbounds.x >= tbounds.y) {
        oClosest = vec4(-1);
        return;
    }

    vec4 currentClosest = texture(uClosest, vPosition);
    float newClosest[4] = float[4](currentClosest.r, currentClosest.g, currentClosest.b, currentClosest.a);
//    float newClosest[4];
    vec4 from = vec4(mix(vRayFrom, vRayTo, tbounds.x), tbounds.x);
    vec4 to = vec4(mix(vRayFrom, vRayTo, tbounds.y), tbounds.y);

    vec4 fromPrevious = from;
    vec2 r = rand(vPosition * uRandSeed);

    vec4 accumulator = vec4(0.0);

    for (int i = 0; i < uNLayers; i++) {
        newClosest[i] = calcLayer(newClosest[i], uIsovalues[i], fromPrevious, to, r);
        if (newClosest[i] < 0.0) {
            break;
        }
        vec3 pos = mix(vRayFrom, vRayTo, newClosest[i]);
        vec3 N = -normalize(gradient(pos, 0.005));
        vec4 colorSample = vec4(BRDF(pos, uColors[i], uF0[i], uF90[i], uSpecularWeights[i], uAlphaRoughness[i], uMvpInverseMatrix, N, uLight), uAlphas[i]);
        colorSample.rgb *= colorSample.a;
        accumulator += (1.0 - accumulator.a) * colorSample;
    }

    if (accumulator.a > 1.0) {
        accumulator.rgb /= accumulator.a;
    }

//    accumulator.rgb = mix(vec3(1), accumulator.rgb, accumulator.a);

    oRender = vec4(accumulator.rgb, newClosest[0]);
    oClosest = vec4(newClosest[0], newClosest[1], newClosest[2], newClosest[3]);
}

// #section IMCResetISO/vertex

#version 300 es
precision mediump float;

layout (location = 0) in vec2 aPosition;

void main() {
    gl_Position = vec4(aPosition, 0.0, 1.0);
}

// #section IMCResetISO/fragment

#version 300 es
precision mediump float;

layout (location = 0) out vec4 oClosest;
layout (location = 1) out vec4 oDepth;

void main() {
    oClosest = vec4(-1);
    oDepth = vec4(-1);
}

// #section IMCIntegrateMCM/vertex

#version 300 es
precision mediump float;
layout (location = 0) in vec2 aPosition;

uniform mat4 uMvpInverseMatrix;

out vec2 vPosition;
out vec3 vRayFrom;
out vec3 vRayTo;

@unproject

void main() {
    vPosition = aPosition;
    gl_Position = vec4(aPosition, 0.0, 1.0);
    unproject(aPosition, uMvpInverseMatrix, vRayFrom, vRayTo);
}

// #section IMCIntegrateMCM/fragment

#version 300 es
precision mediump float;

#define M_INVPI 0.31830988618
#define M_PI 3.141592653589f
#define M_2PI 6.28318530718
#define EPS 1e-5

@Photon
@rand
@unprojectRand
@intersectCube
@BRDF

uniform mediump sampler2D uPosition;
uniform mediump sampler2D uDirection;
uniform mediump sampler2D uTransmittance;
uniform mediump sampler2D uRadiance;

uniform mediump sampler3D uVolume;
uniform mediump sampler2D uTransferFunction;
uniform mediump sampler2D uEnvironment;

uniform mediump sampler2D uClosest;

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

//uniform float uSpecularWeight;
//uniform float uAlphaRoughness;
//uniform vec3 uF0;
//uniform vec3 uF90;

uniform vec3 uLight;
//uniform vec3 uDiffuse;

uniform uint uNLayers;
//uniform vec3 uDiffuseColors[4];

in vec2 vPosition;
in vec3 vRayFrom;
in vec3 vRayTo;

layout (location = 0) out vec4 oPosition;
layout (location = 1) out vec4 oDirection;
layout (location = 2) out vec4 oTransmittance;
layout (location = 3) out vec4 oRadiance;

void resetPhoton(inout vec2 randState, inout Photon photon) {
    vec3 from, to;
    unprojectRand(randState, vPosition, uMvpInverseMatrix, uInverseResolution, uBlur, from, to);
    photon.direction = normalize(to - from);
    photon.bounces = 0u;
    vec2 tbounds = max(intersectCube(from, photon.direction), 0.0);
    photon.position = from + tbounds.x * photon.direction;
    photon.transmittance = vec3(1);
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

float HenyeyGreensteinPhaseFunction(float g, vec3 inDirection, vec3 outDirection) {
    float g2 = g * g;
    float cosTheta = max(dot(inDirection, outDirection), 0.0);
    return (1.0 - g2) / pow(1.0 + g2 - 2.0 * g * cosTheta, 1.5);
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

//vec3 lambertShading(vec4 closest) {
//    vec3 normal = normalize(gradient(closest.xyz, 0.005));
//    vec3 light = normalize(uLight);
//    float lambert = max(dot(normal, light), 0.0);
//
//    return uDiffuse * lambert;
//}

void main() {
    Photon photon;
    vec2 mappedPosition = vPosition * 0.5 + 0.5;
    photon.position = texture(uPosition, mappedPosition).xyz;
    vec4 directionAndBounces = texture(uDirection, mappedPosition);
    photon.direction = directionAndBounces.xyz;
    photon.bounces = uint(directionAndBounces.w + 0.5);
    photon.transmittance = texture(uTransmittance, mappedPosition).rgb;
    vec4 radianceAndSamples = texture(uRadiance, mappedPosition);
    photon.radiance = radianceAndSamples.rgb;
    photon.samples = uint(radianceAndSamples.w + 0.5);
//    vec4 closest = texture(uClosest, mappedPosition);
//    float maxTraveled = length(closest);
    vec4 closest = texture(uClosest, mappedPosition);
    vec3 closestVR = mix(vRayFrom, vRayTo, closest.a);

    vec2 r = rand(vPosition * uRandSeed);
    for (uint i = 0u; i < uSteps; i++) {
        r = rand(r);
        float t = -log(r.x) / uMajorant;
        photon.position += t * photon.direction;

        vec4 volumeSample = sampleVolumeColor(photon.position);
        float muAbsorption = volumeSample.a * uAbsorptionCoefficient;
        float muScattering = volumeSample.a * uScatteringCoefficient;
        float muNull = uMajorant - muAbsorption - muScattering;
        float muMajorant = muAbsorption + muScattering + abs(muNull);
        float PNull = abs(muNull) / muMajorant;
        float PAbsorption = muAbsorption / muMajorant;
        float PScattering = muScattering / muMajorant;

        vec3 positionToClosest = closestVR - photon.position;
        float dotPTC = dot(positionToClosest, photon.direction);

//        if (uNLayers > 0u && closest.r > 0.0 && dotPTC <= 0.0 && photon.bounces == 0u) {
//            vec3 N = -normalize(gradient(closestVR, 0.005));
//            //            vec3 radiance = lambertShading(closest);
//            photon.transmittance = BRDF(closestVR, uDiffuseColors[0], uF0, uF90, uSpecularWeight, uAlphaRoughness, uMvpInverseMatrix, N, uLight);
//            vec3 radiance = photon.transmittance;
//            photon.samples++;
//            photon.radiance += (radiance - photon.radiance) / float(photon.samples);
//            resetPhoton(r, photon);
//        } else
        if (uNLayers > 0u && closest.a > 0.0 && dotPTC <= 0.0 && photon.bounces == 0u) {
            vec3 N = -normalize(gradient(closestVR, 0.005));
            //            vec3 radiance = lambertShading(closest);
//            vec3 outDirection = -normalize(uLight);
//            photon.transmittance =
//            BRDF(closestVR, uDiffuseColors[0], uF0, uF90, uSpecularWeight, uAlphaRoughness, uMvpInverseMatrix, N, uLight);
            photon.transmittance = closest.rgb;
//            photon.direction = outDirection;
//            photon.bounces++;
            vec3 radiance = photon.transmittance;
            photon.samples++;
            photon.radiance += (radiance - photon.radiance) / float(photon.samples);
            resetPhoton(r, photon);
        } else
        if (any(greaterThan(photon.position, vec3(1))) || any(lessThan(photon.position, vec3(0)))) {
            // out of bounds
            vec4 envSample = sampleEnvironmentMap(photon.direction);
            vec3 radiance = photon.transmittance * envSample.rgb;
            photon.samples++;
            photon.radiance += (radiance - photon.radiance) / float(photon.samples);
            resetPhoton(r, photon);
        } else

//        if (any(greaterThan(photon.position, vec3(1))) || any(lessThan(photon.position, vec3(0)))) {
//            // out of bounds
//            vec4 envSample = sampleEnvironmentMap(photon.direction);
//            vec3 radiance = photon.transmittance * envSample.rgb;
//            photon.samples++;
//            photon.radiance += (radiance - photon.radiance) / float(photon.samples);
//            resetPhoton(r, photon);
//        } else
        if (photon.bounces >= uMaxBounces) {
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
            vec3 outDirection = -normalize(uLight);
            photon.transmittance *= volumeSample.rgb * weightS * HenyeyGreensteinPhaseFunction(uScatteringBias, photon.direction, outDirection);
//            photon.direction = sampleHenyeyGreenstein(uScatteringBias, r, photon.direction);
            photon.direction = outDirection;
            photon.bounces++;
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
}

// #section IMCRender/vertex

#version 300 es

layout (location = 0) in vec2 aPosition;
out vec2 vPosition;

void main() {
    vPosition = (aPosition + 1.0) * 0.5;
    gl_Position = vec4(aPosition, 0.0, 1.0);
}

// #section IMCRender/fragment

#version 300 es
precision mediump float;

uniform mediump sampler2D uColor;

in vec2 vPosition;
out vec4 oColor;

void main() {
    oColor = vec4(texture(uColor, vPosition).rgb, 1);
}

// #section IMCResetMCM/vertex

#version 300 es

layout (location = 0) in vec2 aPosition;

out vec2 vPosition;

void main() {
    vPosition = aPosition;
    gl_Position = vec4(aPosition, 0.0, 1.0);
}

// #section IMCResetMCM/fragment

#version 300 es
precision mediump float;

@Photon
@rand
@unprojectRand
@intersectCube

uniform mat4 uMvpInverseMatrix;
uniform vec2 uInverseResolution;
uniform float uRandSeed;
uniform float uBlur;

in vec2 vPosition;

layout (location = 0) out vec4 oPosition;
layout (location = 1) out vec4 oDirection;
layout (location = 2) out vec4 oTransmittance;
layout (location = 3) out vec4 oRadiance;

void main() {
    Photon photon;
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
    oPosition = vec4(photon.position, 0);
    oDirection = vec4(photon.direction, float(photon.bounces));
    oTransmittance = vec4(photon.transmittance, 0);
    oRadiance = vec4(photon.radiance, float(photon.samples));
}