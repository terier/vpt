// #package glsl/shaders

// #include ../mixins/unproject.glsl
// #include ../mixins/intersectCube.glsl

// #section CIMGenerate/vertex

void main() {}

// #section CIMGenerate/fragment

void main() {}

// #section CIMIntegrateMCM/vertex

#version 300 es

layout (location = 0) in vec2 aPosition;

out vec2 vPosition;

void main() {
//    vPosition = aPosition;
//    gl_Position = vec4(aPosition, 0.0, 1.0);

    vPosition = (aPosition + 1.0) * 0.5;
    gl_Position = vec4(aPosition, 0.0, 1.0);
}

// #section CIMIntegrateMCM/fragment

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

uniform float uIsovalue;
uniform vec3 uLight;
uniform vec3 uDiffuse;

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

        vec2 volumeSample = texture(uVolume, photon.position).rg;
        vec4 transferSample = texture(uTransferFunction, volumeSample);
//        float muAbsorption = transferSample.a * uAbsorptionCoefficient;
//        float muNull = uMajorant - muAbsorption;
//        float muMajorant = muAbsorption + abs(muNull);
//        float PNull = abs(muNull) / muMajorant;
//        float PAbsorption = muAbsorption / muMajorant;

        float muAbsorption = transferSample.a * uAbsorptionCoefficient;
        float muScattering = transferSample.a * uScatteringCoefficient;
        float muNull = uMajorant - muAbsorption - muScattering;
        float muMajorant = muAbsorption + muScattering + abs(muNull);
        float PNull = abs(muNull) / muMajorant;
        float PAbsorption = muAbsorption / muMajorant;
        float PScattering = muScattering / muMajorant;

        if (volumeSample.r >= uIsovalue && photon.bounces == 0u) {
            vec3 normal = normalize(gradient(photon.position, 0.005));
            vec3 light = normalize(uLight);
            float lambert = max(dot(normal, light), 0.0);
            vec3 radiance = uDiffuse * lambert;
            photon.samples++;
            photon.radiance += (radiance - photon.radiance) / float(photon.samples);
            resetPhoton(r, photon, mappedPosition);
        } else
        if (any(greaterThan(photon.position, vec3(1))) || any(lessThan(photon.position, vec3(0)))) {
            // out of bounds
            vec4 envSample = sampleEnvironmentMap(photon.direction);
            vec3 radiance = photon.transmittance * envSample.rgb;
            photon.samples++;
            photon.radiance += (radiance - photon.radiance) / float(photon.samples);
            resetPhoton(r, photon, mappedPosition);
        }
        else {
            // max bounces achieved -> only estimate transmittance
            float weightAS = (muAbsorption + muScattering) / uMajorant;
            photon.transmittance *= 1.0 - weightAS;
        }

//        else if (photon.bounces >= uMaxBounces) {
//            // max bounces achieved -> only estimate transmittance
//            float weightAS = (muAbsorption + muScattering) / uMajorant;
//            photon.transmittance *= 1.0 - weightAS;
//        } else if (r.y < PAbsorption) {
//            // absorption
//            float weightA = muAbsorption / (uMajorant * PAbsorption);
//            photon.transmittance *= 1.0 - weightA;
//        } else if (r.y < PAbsorption + PScattering) {
//            // scattering
//            r = rand(r);
//            float weightS = muScattering / (uMajorant * PScattering);
//            photon.transmittance *= transferSample.a * weightS;
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

// #section CIMRender/vertex

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

// #section CIMRender/fragment

#version 300 es
precision mediump float;

uniform mediump sampler3D uVolume;
uniform mediump sampler2D uTransferFunction;
uniform mediump sampler3D uRadianceAndDiffusion;
uniform float uStepSize;
uniform float uOffset;
uniform float uAlphaCorrection;

uniform float uIsovalue;
uniform vec3 uLight;
uniform vec3 uDiffuse;

in vec3 vRayFrom;
in vec3 vRayTo;
out vec4 oColor;

//debug
in vec2 vPosition;

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
            if (val.r >= uIsovalue) {
                vec3 normal = normalize(gradient(pos, 0.005));
                vec3 light = normalize(uLight);
                float lambert = max(dot(normal, light), 0.0);
                colorSample = vec4(uDiffuse * lambert, 1);
                colorSample.a *= rayStepLength * uAlphaCorrection;
                accumulator += (1.0 - accumulator.a) * colorSample;
                break;
            }
            radianceAndDiffusion = texture(uRadianceAndDiffusion, pos);
//            energyDensity = radianceAndDiffusion.r + radianceAndDiffusion.g;

            colorSample = texture(uTransferFunction, val);
            colorSample.a *= rayStepLength * uAlphaCorrection;
            // utezi z energy density
            colorSample.rgb *= radianceAndDiffusion.rbg;
            colorSample.rgb *= colorSample.a;
//            colorSample.rgb *= colorSample.a;
//            colorSample.rgb = vec3(energyDensity);
            accumulator += (1.0 - accumulator.a) * colorSample;
            t += uStepSize;
//            if (val.r >= uIsovalue) {
//                break;
//            }

        }

        if (accumulator.a > 1.0) {
            accumulator.rgb /= accumulator.a;
        }

//        oColor = vec4(accumulator.rgb, 1.0);
        oColor = mix(vec4(1), vec4(accumulator.rgb, 1), accumulator.a);
    }
}


// #section CIMDeferredRender/vertex

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

// #section CIMDeferredRender/fragment

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

// #section CIMCombineRender/vertex

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

// #section CIMCombineRender/fragment

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

// #section CIMResetPhotonsMCM/vertex

#version 300 es

layout (location = 0) in vec2 aPosition;

out vec2 vPosition;

void main() {
    vPosition = (aPosition + 1.0) * 0.5;
    gl_Position = vec4(aPosition, 0.0, 1.0);
}

// #section CIMResetPhotonsMCM/fragment

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