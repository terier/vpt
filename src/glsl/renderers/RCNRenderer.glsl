// #package glsl/shaders

// #include ../mixins/unproject.glsl
// #include ../mixins/intersectCube.glsl

// #section RCNGenerate/vertex

void main() {}

// #section RCNGenerate/fragment

void main() {}

// #section RCNIntegrate/vertex

#version 300 es
precision mediump float;

layout(location = 0) in vec2 aPosition;
out vec2 vPosition;

void main() {
    vPosition = (aPosition + 1.0) * 0.5;
    gl_Position = vec4(aPosition, 0.0, 1.0);
}

// #section RCNIntegrate/fragment

#version 300 es
precision mediump float;
#define DIRECTIONAL 0.5
#define POINT 1.5
#define FLT_MAX 3.402823466e+38

@PhotonRCN

uniform mediump sampler3D uVolume;
uniform mediump sampler2D uTransferFunction;
uniform mediump sampler3D uPosition;
uniform mediump sampler3D uDirectionAndTransmittance;
uniform mediump sampler3D uDistanceTravelledAndSamples;
uniform mediump sampler3D uRadianceAndDiffusion;
uniform mediump sampler2D uLights;

uniform uint uSteps;
//uniform uint uNLights;
uniform float uLayer;
uniform float uAbsorptionCoefficient;
uniform float uMajorant;
uniform float uRandSeed;
//uniform vec4 uLight;

in vec2 vPosition;

layout (location = 0) out vec4 oPosition;
layout (location = 1) out vec4 oDirectionAndTransmittance;
layout (location = 2) out vec4 oDistanceTravelledAndSamples;
layout (location = 3) out vec4 oRadianceAndDiffusion;

@rand

vec4 getRandomLight(vec2 randState) {
//    float divider = 1.0 / float(uNLights);
    randState = rand(randState);
    return texture(uLights, vec2(randState.x, 0.5));
}

void resetPhoton(vec2 randState, inout PhotonRCN photon, vec3 mappedPosition) {
    vec3 from = mappedPosition;
    vec4 to = getRandomLight(randState);
//    vec4 to = uLight;
    if (to.a < DIRECTIONAL) {
        photon.direction = -normalize(to.xyz);
        photon.distance = FLT_MAX;
    } else {
        photon.direction = normalize(to.xyz - from);
        photon.distance = distance(from, to.xyz);
    }
    photon.position = from;
    photon.transmittance = 1.0;
    photon.travelled = 0.0;
}

vec4 sampleVolumeColor(vec3 position) {
    vec2 volumeSample = texture(uVolume, position).rg;
    //    vec4 transferSample = texture(uTransferFunction, volumeSample);
    vec4 transferSample = texture(uTransferFunction, volumeSample);
    return transferSample;
}

void main() {
    PhotonRCN photon;
    vec3 mappedPosition = vec3(vPosition, uLayer);
    vec4 position = texture(uPosition, mappedPosition);
    photon.position = position.xyz;
    vec4 radianceAndDiffusion = texture(uRadianceAndDiffusion, mappedPosition);
    photon.radiance = radianceAndDiffusion.xyz;
    float diffusion = radianceAndDiffusion.w;
    vec4 directionAndTransmittance = texture(uDirectionAndTransmittance, mappedPosition);
    photon.direction = directionAndTransmittance.xyz;
    photon.transmittance = directionAndTransmittance.w;
    vec4 distanceTravelledAndSamples = texture(uDistanceTravelledAndSamples, mappedPosition);
    photon.distance = distanceTravelledAndSamples.x;
    photon.travelled = distanceTravelledAndSamples.y;
    photon.samples = uint(distanceTravelledAndSamples.z + 0.5);

    vec2 r = rand((mappedPosition.xy + mappedPosition.yz) * uRandSeed);

    for (uint i = 0u; i < uSteps; i++) {
        r = rand(r);
        float t = -log(r.x) / uMajorant;
        vec3 newPosition = photon.position + t * photon.direction;
        float distance = distance(photon.position, newPosition);
        photon.position = newPosition;
        photon.travelled += distance;

        vec4 volumeSample = sampleVolumeColor(photon.position);

        float muAbsorption = volumeSample.a * uAbsorptionCoefficient;

        float muNull = uMajorant - muAbsorption;
        float muMajorant = muAbsorption + abs(muNull);
        float PNull = abs(muNull) / muMajorant;
        float PAbsorption = muAbsorption / muMajorant;
        float radiance;

        if (photon.travelled >= photon.distance ||
        any(greaterThan(photon.position, vec3(1))) || any(lessThan(photon.position, vec3(0)))) {
            // out of bounds
            float radiance = photon.transmittance;
            photon.samples++;
//            photon.radiance += (radiance - photon.radiance) / float(photon.samples);
            photon.radiance += (vec3(radiance) - photon.radiance) / float(photon.samples);
            resetPhoton(r, photon, mappedPosition);
        } else if (r.y < PAbsorption) {
            // absorption
            float weightA = muAbsorption / (uMajorant * PAbsorption);
            photon.transmittance *= 1.0 - weightA;
        } else {
            // null collision
            float weightN = muNull / (uMajorant * PNull);
            photon.transmittance *= weightN;
        }
    }

    oPosition = vec4(photon.position, 0);
    oDirectionAndTransmittance = vec4(photon.direction, photon.transmittance);
    oDistanceTravelledAndSamples = vec4(photon.distance, photon.travelled, float(photon.samples), 0);
    oRadianceAndDiffusion = vec4(photon.radiance, diffusion);
}

// #section RCNIntegrateENV/vertex

#version 300 es

layout (location = 0) in vec2 aPosition;

out vec2 vPosition;

void main() {
//    vPosition = aPosition;
//    gl_Position = vec4(aPosition, 0.0, 1.0);

    vPosition = (aPosition + 1.0) * 0.5;
    gl_Position = vec4(aPosition, 0.0, 1.0);
}

// #section RCNIntegrateENV/fragment

#version 300 es
precision mediump float;

#define M_INVPI 0.31830988618
#define M_2PI 6.28318530718
#define EPS 1e-5

@Photon

uniform mediump sampler3D uVolume;
uniform mediump sampler2D uTransferFunction;
uniform mediump sampler3D uPosition;
uniform mediump sampler3D uDirection;
uniform mediump sampler3D uTransmittance;
uniform mediump sampler3D uRadiance;
uniform mediump sampler2D uEnvironment;

uniform float uRandSeed;
uniform float uAbsorptionCoefficient;
uniform float uScatteringCoefficient;
uniform float uScatteringBias;
uniform float uMajorant;
uniform float uLayer;
uniform uint uSteps;
uniform uint uMaxBounces;

in vec2 vPosition;

layout (location = 0) out vec4 oPosition;
layout (location = 1) out vec4 oDirection;
layout (location = 2) out vec4 oTransmittance;
layout (location = 3) out vec4 oRadiance;

@rand

//vec3 randomDirection(inout vec2 randState) {
//    randState = rand(randState);
//    vec3 direction = vec3(0,0,0);
//    direction.x = randState.x * 2 - 1;
//    direction.y = randState.y * 2 - 1;
//    randState = rand(randState);
//    direction.z = randState.x * 2 - 1;
//    return normalize(direction);
//}

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

void resetPhoton(vec2 randState, inout Photon photon, vec3 mappedPosition) {
    randState = rand(randState);
    photon.direction = normalize(randomDirection(randState));
    photon.bounces = 0u;
    photon.position = mappedPosition;
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

void main() {
    Photon photon;
    vec3 mappedPosition = vec3(vPosition,  uLayer);
    vec4 positionAndSamples = texture(uPosition, mappedPosition);
    photon.position = positionAndSamples.xyz;
    photon.samples = uint(positionAndSamples.w + 0.5);
    vec4 directionAndBounces = texture(uDirection, mappedPosition);
    photon.direction = directionAndBounces.xyz;
    photon.bounces = uint(directionAndBounces.w + 0.5);
    photon.transmittance = texture(uTransmittance, mappedPosition).rgb;

    vec4 radianceAndSamples = texture(uRadiance, mappedPosition);
    photon.radiance = radianceAndSamples.rgb;

    vec2 r = rand((mappedPosition.xy + mappedPosition.yz) * uRandSeed);
    for (uint i = 0u; i < uSteps; i++) {
        r = rand(r);
        float t = -log(r.x) / uMajorant;
        photon.position += t * photon.direction;

        vec4 volumeSample = sampleVolumeColor(photon.position);
//        float muAbsorption = volumeSample.a * uAbsorptionCoefficient;
//        float muNull = uMajorant - muAbsorption;
//        float muMajorant = muAbsorption + abs(muNull);
//        float PNull = abs(muNull) / muMajorant;
//        float PAbsorption = muAbsorption / muMajorant;

        float muAbsorption = volumeSample.a * uAbsorptionCoefficient;
        float muScattering = volumeSample.a * uScatteringCoefficient;
        float muNull = uMajorant - muAbsorption - muScattering;
        float muMajorant = muAbsorption + muScattering + abs(muNull);
        float PNull = abs(muNull) / muMajorant;
        float PAbsorption = muAbsorption / muMajorant;
        float PScattering = muScattering / muMajorant;

        if (any(greaterThan(photon.position, vec3(1))) || any(lessThan(photon.position, vec3(0)))) {
            // out of bounds
            vec4 envSample = sampleEnvironmentMap(photon.direction);
            vec3 radiance = photon.transmittance * envSample.rgb;
            photon.samples++;
            photon.radiance += (radiance - photon.radiance) / float(photon.samples);
            resetPhoton(r, photon, mappedPosition);
        } else {
            // max bounces achieved -> only estimate transmittance
            float weightAS = (muAbsorption + muScattering) / uMajorant;
            photon.transmittance *= 1.0 - weightAS;
        }


//        else if (r.y < PAbsorption) {
//            // absorption
//            float weightA = muAbsorption / (uMajorant * PAbsorption);
//            photon.transmittance *= 1.0 - weightA;
//        } else if (r.y < PAbsorption + PScattering) {
//            // scattering
//            r = rand(r);
//            float weightS = muScattering / (uMajorant * PScattering);
//            photon.transmittance *= volumeSample.a * weightS;
//            photon.direction = sampleHenyeyGreenstein(uScatteringBias, r, photon.direction);
//            photon.bounces++;
//        } else {
//            // null collision
//            float weightN = muNull / (uMajorant * PNull);
//            photon.transmittance *= weightN;
//        }

//        else if (r.y < PAbsorption) {
//            // absorption
//            float weightA = muAbsorption / (uMajorant * PAbsorption);
//            photon.transmittance *= 1.0 - weightA;
//        } else {
//            // null collision
//            float weightN = muNull / (uMajorant * PNull);
//            photon.transmittance *= weightN;
//        }
    }

    oPosition = vec4(photon.position, float(photon.samples));
    oDirection = vec4(photon.direction, float(photon.bounces));
    oTransmittance = vec4(photon.transmittance, 0);
    oRadiance = vec4(photon.radiance, 0);
}

// #section RCNDiffuse/vertex

#version 300 es
precision mediump float;

layout(location = 0) in vec2 aPosition;
out vec2 vPosition;

void main() {
    vPosition = (aPosition + 1.0) * 0.5;
    gl_Position = vec4(aPosition, 0.0, 1.0);
}

// #section RCNDiffuse/fragment

#version 300 es
precision highp float;
#define DIRECTIONAL 0.5
#define POINT 1.5
#define FLT_MAX 3.402823466e+38

uniform mediump sampler3D uPosition;
uniform mediump sampler3D uDirectionAndTransmittance;
uniform mediump sampler3D uDistanceTravelledAndSamples;
uniform mediump sampler3D uRadianceAndDiffusion;
uniform mediump sampler3D uVolume;
uniform mediump sampler2D uTransferFunction;

uniform float uLayer;
uniform float uScattering;
uniform float uAbsorptionCoefficient;
uniform float uRatio;
uniform vec3 uStep;
uniform vec3 uSize;

in vec2 vPosition;

layout (location = 0) out vec4 oPosition;
layout (location = 1) out vec4 oDirectionAndTransmittance;
layout (location = 2) out vec4 oDistanceTravelledAndSamples;
layout (location = 3) out vec4 oRadianceAndDiffusion;

void main() {
    vec3 position = vec3(vPosition, uLayer);
    ivec3 positionTexel = ivec3(position * uSize);
    vec4 radianceAndDiffusion = texture(uRadianceAndDiffusion, position);
    if (position.x < uStep.x || position.y < uStep.y || position.z < uStep.z ||
    position.x > 1.0 - uStep.x || position.y > 1.0 - uStep.y || position.z > 1.0 - uStep.z) {
        oPosition = texture(uPosition, position);
        oDirectionAndTransmittance = texture(uDirectionAndTransmittance, position);
        oDistanceTravelledAndSamples = texture(uDistanceTravelledAndSamples, position);
        oRadianceAndDiffusion = vec4(radianceAndDiffusion.r, 0, 0, 0);
        return;
    }

//    float val = texture(uVolume, position).r;
//    vec4 colorSample = texture(uTransferFunction, vec2(val, 0.5));
//    float absorption = colorSample.a * uAbsorptionCoefficient;

    float radiance = radianceAndDiffusion.x;
    float totalRadiance = radianceAndDiffusion.x + radianceAndDiffusion.y;

//    vec4 left      = texture(uRadianceAndDiffusion, position + vec3(-uStep.x,  0,  0));
//    vec4 right     = texture(uRadianceAndDiffusion, position + vec3( uStep.x,  0,  0));
//    vec4 down      = texture(uRadianceAndDiffusion, position + vec3( 0, -uStep.y,  0));
//    vec4 up        = texture(uRadianceAndDiffusion, position + vec3( 0,  uStep.y,  0));
//    vec4 back      = texture(uRadianceAndDiffusion, position + vec3( 0, 0, -uStep.z));
//    vec4 forward   = texture(uRadianceAndDiffusion, position + vec3( 0,  0, uStep.z));

    vec4 left      = texelFetch(uRadianceAndDiffusion, positionTexel + ivec3(-1,  0,  0), 0);
    vec4 right     = texelFetch(uRadianceAndDiffusion, positionTexel + ivec3( 1,  0,  0), 0);
    vec4 down      = texelFetch(uRadianceAndDiffusion, positionTexel + ivec3( 0, -1,  0), 0);
    vec4 up        = texelFetch(uRadianceAndDiffusion, positionTexel + ivec3( 0,  1,  0), 0);
    vec4 back      = texelFetch(uRadianceAndDiffusion, positionTexel + ivec3( 0,  0, -1), 0);
    vec4 forward   = texelFetch(uRadianceAndDiffusion, positionTexel + ivec3( 0,  0,  1), 0);

    float laplace = left.r + left.g + right.r + right.g +
                    down.r + down.g + up.r + up.g +
                    back.r + back.g + forward.r + forward.g -
                    6.0 * totalRadiance;

    float delta = laplace * totalRadiance * uScattering / uRatio;
//    float delta = (left.r + left.g + right.r + right.g +
//                    down.r + down.g + up.r + up.g +
//                    back.r + back.g + forward.r + forward.g) / 6.0;


//    float delta = (colorSample.a * laplace * uScattering) * 0.1; // radianceAndDiffusion.r +
//    float delta = (laplace * uScattering) * 0.2;

    oPosition = texture(uPosition, position);
    oDirectionAndTransmittance = texture(uDirectionAndTransmittance, position);
    oDistanceTravelledAndSamples = texture(uDistanceTravelledAndSamples, position);
    oRadianceAndDiffusion = vec4(radiance, delta, 0, 0);
}

// #section RCNRender/vertex

#version 300 es
precision mediump float;

uniform mat4 uMvpInverseMatrix;

layout(location = 0) in vec2 aPosition;
out vec3 vRayFrom;
out vec3 vRayTo;

out vec2 vPosition;

@unproject

void main() {
    unproject(aPosition, uMvpInverseMatrix, vRayFrom, vRayTo);
    gl_Position = vec4(aPosition, 0.0, 1.0);
    //debug
    vPosition = aPosition * 0.5 + 0.5;
}

// #section RCNRender/fragment

#version 300 es
precision mediump float;

uniform mediump sampler3D uVolume;
uniform mediump sampler2D uTransferFunction;
uniform mediump sampler3D uRadianceAndDiffusion;
uniform float uStepSize;
uniform float uOffset;
uniform float uAlphaCorrection;

in vec3 vRayFrom;
in vec3 vRayTo;
out vec4 oColor;

//debug
in vec2 vPosition;

@intersectCube

void main() {

    vec3 rayDirection = vRayTo - vRayFrom;
    vec2 tbounds = max(intersectCube(vRayFrom, rayDirection), 0.0);
    if (tbounds.x >= tbounds.y) {
        oColor = vec4(1.0, 1.0, 1.0, 1.0);
    } else {
        vec3 from = mix(vRayFrom, vRayTo, tbounds.x);
        vec3 to = mix(vRayFrom, vRayTo, tbounds.y);
        float rayStepLength = distance(from, to) * uStepSize;

        float t = 0.0;
        vec3 pos;
        vec2 val;
        vec4 colorSample;
        vec4 accumulator = vec4(0.0);
        vec4 radianceAndDiffusion;

        float energyDensity;

        while (t < 1.0 && accumulator.a < 0.99) {
            pos = mix(from, to, t);
            val = texture(uVolume, pos).rg;

            radianceAndDiffusion = texture(uRadianceAndDiffusion, pos);
//            energyDensity = radianceAndDiffusion.r + radianceAndDiffusion.g;

            colorSample = texture(uTransferFunction, val);
            colorSample.a *= rayStepLength * uAlphaCorrection;
            // utezi z energy density
            colorSample.rgb *= radianceAndDiffusion.rgb;
            colorSample.rgb *= colorSample.a;
//            colorSample.rgb *= colorSample.a;
//            colorSample.rgb = vec3(energyDensity);
            accumulator += (1.0 - accumulator.a) * colorSample;
            t += uStepSize;
        }

        if (accumulator.a > 1.0) {
            accumulator.rgb /= accumulator.a;
        }

//        oColor = vec4(accumulator.rgb, 1.0);
        oColor = mix(vec4(1), vec4(accumulator.rgb, 1), accumulator.a);
    }
}


// #section RCNDeferredRender/vertex

#version 300 es
precision mediump float;

uniform mat4 uMvpInverseMatrix;

layout(location = 0) in vec2 aPosition;
out vec3 vRayFrom;
out vec3 vRayTo;

out vec2 vPosition;

@unproject

void main() {
    unproject(aPosition, uMvpInverseMatrix, vRayFrom, vRayTo);
    gl_Position = vec4(aPosition, 0.0, 1.0);
    //debug
    vPosition = aPosition * 0.5 + 0.5;
}

// #section RCNDeferredRender/fragment

#version 300 es
precision mediump float;

uniform mediump sampler3D uVolume;
uniform mediump sampler2D uTransferFunction;
uniform mediump sampler3D uRadianceAndDiffusion;
uniform float uStepSize;
uniform float uOffset;
uniform float uAlphaCorrection;

in vec3 vRayFrom;
in vec3 vRayTo;
layout (location = 0) out vec4 oLighting;
layout (location = 1) out vec4 oColor;

//debug
in vec2 vPosition;

@intersectCube

void main() {

    vec3 rayDirection = vRayTo - vRayFrom;
    vec2 tbounds = max(intersectCube(vRayFrom, rayDirection), 0.0);
    if (tbounds.x >= tbounds.y) {
        oColor = vec4(1.0, 1.0, 1.0, 1.0);
        oLighting = vec4(0.0);
    } else {
        vec3 from = mix(vRayFrom, vRayTo, tbounds.x);
        vec3 to = mix(vRayFrom, vRayTo, tbounds.y);
        float rayStepLength = distance(from, to) * uStepSize;

        float t = 0.0;
        vec3 pos;
        vec2 val;
        vec4 colorSample;
        vec4 accumulator = vec4(0.0);
        vec4 radianceAndDiffusion;

        vec3 lightingAccumulator = vec3(0.0);
        vec3 lightingSample;

        while (t < 1.0 && accumulator.a < 0.99) {
            pos = mix(from, to, t);
            val = texture(uVolume, pos).rg;

            radianceAndDiffusion = texture(uRadianceAndDiffusion, pos);

            // Color
            colorSample = texture(uTransferFunction, val);
            colorSample.a *= rayStepLength * uAlphaCorrection;
            colorSample.rgb *= colorSample.a; // * energyDensity;

            // Lighting
//            lightingSample = 1.0 - (radianceAndDiffusion.r + radianceAndDiffusion.g);
//            lightingAccumulator += (1.0 - accumulator.a) * lightingSample * colorSample.a;
            lightingSample = vec3(1.0) - radianceAndDiffusion.rgb;
            lightingAccumulator += (1.0 - accumulator.a) * colorSample.a * lightingSample;

            accumulator += (1.0 - accumulator.a) * colorSample;
            t += uStepSize;
        }

        if (accumulator.a > 1.0) {
            accumulator.rgb /= accumulator.a;
        }

        //        oColor = vec4(accumulator.rgb, 1.0);
        oColor = mix(vec4(1), vec4(accumulator.rgb, 1), accumulator.a);
        oLighting = vec4(lightingAccumulator, 0);
    }
}

// #section RCNCombineRender/vertex

#version 300 es
precision mediump float;

uniform mat4 uMvpInverseMatrix;

layout(location = 0) in vec2 aPosition;
out vec3 vRayFrom;
out vec3 vRayTo;

out vec2 vPosition;

@unproject

void main() {
    unproject(aPosition, uMvpInverseMatrix, vRayFrom, vRayTo);
    gl_Position = vec4(aPosition, 0.0, 1.0);
    //debug
    vPosition = aPosition * 0.5 + 0.5;
}

// #section RCNCombineRender/fragment

#version 300 es
precision mediump float;

uniform mediump sampler2D uColor;
uniform mediump sampler2D uLighting;
uniform int uSmartDeNoise;
uniform float uSigma;
uniform float uKSigma;
uniform float uTreshold;

out vec4 color;

//debug
in vec2 vPosition;

@smartDeNoise3

void main() {
    vec4 colorSample = texture(uColor, vPosition);
    vec3 lightingSample;
    if (uSmartDeNoise == 1)
        lightingSample = smartDeNoise3(uLighting, vPosition, uSigma, uKSigma, uTreshold).rgb; // 5.0, 2.0, .100;
    else
        lightingSample = texture(uLighting, vPosition).rgb;
//    float lightingSample = texture(uLighting, vPosition).r;
//    color = mix(colorSample, vec4(0, 0, 0, 1), lightingSample);
    color = vec4((vec3(1) - lightingSample) * colorSample.rgb, 1);
//    color = vec4(vec3(lightingSample), 1);
}

// #section RCNResetPhotons/vertex

#version 300 es
precision mediump float;

layout(location = 0) in vec2 aPosition;
out vec2 vPosition;

void main() {
    vPosition = (aPosition + 1.0) * 0.5;
    gl_Position = vec4(aPosition, 0.0, 1.0);
}

// #section RCNResetPhotons/fragment

#version 300 es
precision mediump float;
#define DIRECTIONAL 0.5
#define POINT 1.5
#define FLT_MAX 3.402823466e+38

@PhotonRCN

in vec2 vPosition;

uniform mediump sampler2D uLights;

//uniform uint uNLights;
uniform float uLayer;
uniform float uRandSeed;
//uniform vec4 uLight;

layout (location = 0) out vec4 oPosition;
layout (location = 1) out vec4 oDirectionAndTransmittance;
layout (location = 2) out vec4 oDistanceTravelledAndSamples;
layout (location = 3) out vec4 oRadianceAndDiffusion;

@rand

vec4 getRandomLight(vec2 randState) {
    randState = rand(randState);
    return texture(uLights, vec2(randState.x, 0.5));
}


void main() {
    PhotonRCN photon;
    vec3 from = vec3(vPosition,  uLayer);
    vec2 randState = rand((from.xy + from.yz) * uRandSeed);
//    vec4 to = uLight;
    vec4 to = getRandomLight(randState);
    if (to.a < DIRECTIONAL) {
        photon.direction = -normalize(to.xyz);
        photon.distance = FLT_MAX;
    } else {
        photon.direction = normalize(to.xyz - from);
        photon.distance = distance(from, to.xyz);
    }
    photon.position = from;
    photon.transmittance = 1.0;
    photon.travelled = 0.0;
    photon.radiance = vec3(0.05); // 0.05
    photon.samples = 0u;

    oPosition = vec4(photon.position, 0);
    oDirectionAndTransmittance = vec4(photon.direction, photon.transmittance);
    oDistanceTravelledAndSamples = vec4(photon.distance, photon.travelled, float(photon.samples), 0);
    oRadianceAndDiffusion = vec4(photon.radiance, 0);
}

// #section RCNResetPhotonsENV/vertex

#version 300 es

layout (location = 0) in vec2 aPosition;

out vec2 vPosition;

void main() {
    vPosition = (aPosition + 1.0) * 0.5;
    gl_Position = vec4(aPosition, 0.0, 1.0);
}

// #section RCNResetPhotonsENV/fragment

#version 300 es
precision mediump float;

#define M_2PI 6.28318530718

@Photon
uniform float uRandSeed;
uniform float uLayer;

in vec2 vPosition;

layout (location = 0) out vec4 oPosition;
layout (location = 1) out vec4 oDirection;
layout (location = 2) out vec4 oTransmittance;
layout (location = 3) out vec4 oRadiance;

@rand

vec3 randomDirection(vec2 U) {
    float phi = U.x * M_2PI;
    float z = U.y * 2.0 - 1.0;
    float k = sqrt(1.0 - z * z);
    return vec3(k * cos(phi), k * sin(phi), z);
}

void main() {
    Photon photon;
    vec3 from = vec3(vPosition,  uLayer);
    vec2 randState = rand((from.xy + from.yz) * uRandSeed);
    photon.direction = normalize(randomDirection(randState));
    photon.position = from;
    photon.transmittance = vec3(1);
    photon.radiance = vec3(0.05);
    photon.bounces = 0u;
    photon.samples = 0u;
    oPosition = vec4(photon.position, float(photon.samples));
    oDirection = vec4(photon.direction, float(photon.bounces));
    oTransmittance = vec4(photon.transmittance, 0);
    oRadiance = vec4(photon.radiance, 0);
}

// #section RCNResetDiffusion/vertex

#version 300 es
precision mediump float;

layout(location = 0) in vec2 aPosition;
out vec2 vPosition;

void main() {
    vPosition = (aPosition + 1.0) * 0.5;
    gl_Position = vec4(aPosition, 0.0, 1.0);
}

// #section RCNResetDiffusion/fragment

#version 300 es
precision mediump float;
#define DIRECTIONAL 0.5
#define POINT 1.5
#define FLT_MAX 3.402823466e+38

in vec2 vPosition;

uniform mediump sampler3D uPosition;
uniform mediump sampler3D uDirectionAndTransmittance;
uniform mediump sampler3D uDistanceTravelledAndSamples;
uniform mediump sampler3D uRadianceAndDiffusion;

uniform float uLayer;

layout (location = 0) out vec4 oPosition;
layout (location = 1) out vec4 oDirectionAndTransmittance;
layout (location = 2) out vec4 oDistanceTravelledAndSamples;
layout (location = 3) out vec4 oRadianceAndDiffusion;

void main() {
    vec3 position = vec3(vPosition, uLayer);

    oPosition = texture(uPosition, position);
    oDirectionAndTransmittance = texture(uDirectionAndTransmittance, position);
    oDistanceTravelledAndSamples = texture(uDistanceTravelledAndSamples, position);
    oRadianceAndDiffusion = vec4(texture(uRadianceAndDiffusion, position).r, 0, 0, 0);
}
