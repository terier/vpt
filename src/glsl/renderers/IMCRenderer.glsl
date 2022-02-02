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
uniform int uShaderType;
uniform int uSteps;
uniform int uNLayers;
uniform int uCompType;
uniform float uRandSeed;
uniform vec3 uLight;

uniform float uIsovalues[4];
uniform float uP[4];
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

vec3 lambertShading(vec3 color, vec3 n, vec3 l) {
    l = normalize(-l);
    float lambert = max(dot(n, l), 0.0);

    return color * lambert;
}

vec3 phongShading(vec3 pos, vec3 color, vec3 n, vec3 l, float p) {
    l = normalize(-l);
    float lambert = max(dot(n, l), 0.0);

    vec4 cameraLoc = vec4(0, 0, -1.0, 1.0);
    vec4 cameraDirty = uMvpInverseMatrix * cameraLoc;
    vec3 cameraPosition = cameraDirty.xyz / cameraDirty.w;
    vec3 v = normalize(cameraPosition - pos);
    vec3 h = normalize(l + v);
    float NdotH = clampedDot(n, h);
    float spec = pow(NdotH, p);

    return color * (lambert + spec);
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

        vec4 colorSample;
        if (uShaderType == 0) {
            colorSample = vec4(uColors[i], uAlphas[i]);
        }
        else if (uShaderType == 1) {
            colorSample = vec4(lambertShading(uColors[i], N, uLight), uAlphas[i]);
        }
        else if (uShaderType == 2) {
            colorSample = vec4(phongShading(pos, uColors[i], N, uLight, uP[i]), uAlphas[i]);
        }
        else if (uShaderType == 3) {
            colorSample = vec4(BRDF(pos, uColors[i], uF0[i], uF90[i], uSpecularWeights[i], uAlphaRoughness[i], uMvpInverseMatrix, N, uLight), uAlphas[i]);
        }

        if (uCompType == 0) {
            accumulator = colorSample;
        }
        else {
            colorSample.rgb *= colorSample.a;
            accumulator += (1.0 - accumulator.a) * colorSample;
        }
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

uniform mat4 uMvpInverseMatrix;

layout (location = 0) in vec2 aPosition;

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

uniform sampler2D uClosest;

uniform mat4 uMvpInverseMatrix;
uniform vec2 uInverseResolution;
uniform float uRandSeed;
uniform float uBlur;

uniform float uExtinctionScale;
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
layout (location = 1) out vec4 oDirectionAndBounces;
layout (location = 2) out vec4 oWeight;
layout (location = 3) out vec4 oRadianceAndSamples;

@PhotonW
@hashrand
@unprojectHashRand
@intersectCube

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

float HenyeyGreensteinPhaseFunction(float g, vec3 inDirection, vec3 outDirection) {
    float g2 = g * g;
    float cosTheta = max(dot(inDirection, outDirection), 0.0);
    return (1.0 - g2) / pow(1.0 + g2 - 2.0 * g * cosTheta, 1.5);
}

void normalizeProbabilities(inout float PA, inout float PB, inout float PC) {
    float c = 1.0 / (PA + PB + PC);
    PA *= c;
    PB *= c;
    PC *= c;
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

    vec4 closest = texture(uClosest, texelPosition);
    vec3 closestVR = mix(vRayFrom, vRayTo, closest.a);

    float randState = uRandSeed;
    for (uint i = 0u; i < uSteps; i++) {
        float t = -log(rand(randState)) / uMajorant;
        photon.position += t * photon.direction;

        vec4 volumeSample = sampleVolumeColor(photon.position);

        float extinction = volumeSample.a * uExtinctionScale;
        vec3 scatteringCoefficient = volumeSample.rgb * extinction;
        vec3 absorptionCoefficient = (vec3(1) - volumeSample.rgb) * extinction;
        vec3 nullCoefficient = vec3(uMajorant - extinction);

        float absorptionProbability = dot(abs(absorptionCoefficient /* * photon.weight */), vec3(1));
        float scatteringProbability = dot(abs(scatteringCoefficient /* * photon.weight */), vec3(1));
        float nullProbability = dot(abs(nullCoefficient /* * photon.weight */), vec3(1));
        if (photon.bounces >= fMaxBounces) {
            scatteringProbability = 0.0;
        }
        normalizeProbabilities(absorptionProbability, scatteringProbability, nullProbability);

        float fortuneWheel = rand(randState);

        vec3 positionToClosest = closestVR - photon.position;
        float dotPTC = dot(positionToClosest, photon.direction);

        if (uNLayers > 0u && closest.a > 0.0 && dotPTC <= 0.0 && photon.bounces < 1.0) {
            vec3 sampleRadiance = closest.rgb;
            samples += 1.0;
            radiance += (sampleRadiance - radiance) / samples;
            resetPhoton(randState, photon);
        } else
        if (any(greaterThan(photon.position, vec3(1))) || any(lessThan(photon.position, vec3(0)))) {
            // out of bounds
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
            vec3 weightS = scatteringCoefficient / (uMajorant * scatteringProbability);
            vec3 outDirection = -normalize(uLight);
            photon.weight *= weightS * HenyeyGreensteinPhaseFunction(uScatteringBias, photon.direction, outDirection);
            photon.direction = outDirection;
            photon.bounces += 1.0;

            // Staro
//            float weightS = muScattering / (uMajorant * PScattering);
//            vec3 outDirection = -normalize(uLight);
//            photon.transmittance *= volumeSample.rgb * weightS * HenyeyGreensteinPhaseFunction(uScatteringBias, photon.direction, outDirection);
//            photon.direction = outDirection;
//            photon.bounces++;
            // MCM
//            photon.weight *= scatteringCoefficient / (uMajorant * scatteringProbability);
//            photon.direction = sampleHenyeyGreenstein(randState, uScatteringBias, photon.direction);
//            photon.bounces += 1.0;
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

uniform mat4 uMvpInverseMatrix;
uniform vec2 uInverseResolution;
uniform float uRandSeed;
uniform float uBlur;

in vec2 vPosition;

layout (location = 0) out vec4 oPosition;
layout (location = 1) out vec4 oDirectionAndBounces;
layout (location = 2) out vec4 oWeight;
layout (location = 3) out vec4 oRadianceAndSamples;

@hashrand
@unprojectHashRand
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
