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

@PhotonRCD

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

void resetPhoton(vec2 randState, inout PhotonRCD photon, vec3 mappedPosition) {
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
    vec4 transferSample = texture(uTransferFunction, vec2(volumeSample.r, 0.5));
    return transferSample;
}

void main() {
    PhotonRCD photon;
    vec3 mappedPosition = vec3(vPosition,  uLayer);
    vec4 position = texture(uPosition, mappedPosition);
    photon.position = position.xyz;
    vec4 radianceAndDiffusion = texture(uRadianceAndDiffusion, mappedPosition);
    photon.radiance = radianceAndDiffusion.x;
    float diffusion = radianceAndDiffusion.y;
    vec4 directionAndTransmittance = texture(uDirectionAndTransmittance, mappedPosition);
    photon.direction = directionAndTransmittance.xyz;
    photon.transmittance = directionAndTransmittance.w;
    vec4 distanceTravelledAndSamples = texture(uDistanceTravelledAndSamples, mappedPosition);
    photon.distance = distanceTravelledAndSamples.x;
    photon.travelled = distanceTravelledAndSamples.y;
    photon.samples = uint(distanceTravelledAndSamples.z + 0.5);

    vec2 r = rand((mappedPosition.xy + mappedPosition.yz) * uRandSeed);
    //    float d = distance(photon.position, light / vec3(uSize));
    //    imageStore(uEnergyDensityWrite, ivec3(gl_GlobalInvocationID), vec4(d));
    //    imageStore(uEnergyDensityWrite, ivec3(gl_GlobalInvocationID), vec4(photon.transmittance, 0));

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

        if (photon.travelled >= photon.distance ||
        any(greaterThan(photon.position, vec3(1))) || any(lessThan(photon.position, vec3(0)))) {
            // out of bounds
            float radiance = photon.transmittance;
            photon.samples++;
            photon.radiance += (radiance - photon.radiance) / float(photon.samples);
//            imageStore(uEnergyDensityWrite, ivec3(gl_GlobalInvocationID), vec4(photon.radiance));
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
    oRadianceAndDiffusion = vec4(photon.radiance, diffusion, 0, 0);
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
precision mediump float;
#define DIRECTIONAL 0.5
#define POINT 1.5
#define FLT_MAX 3.402823466e+38

uniform mediump sampler3D uPosition;
uniform mediump sampler3D uDirectionAndTransmittance;
uniform mediump sampler3D uDistanceTravelledAndSamples;
uniform mediump sampler3D uRadianceAndDiffusion;

uniform float uLayer;
uniform float uScattering;
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
    vec4 radianceAndDiffusion = texture(uRadianceAndDiffusion, position);
    if (position.x <= uStep.x || position.y < uStep.y || position.z < uStep.z ||
    position.x >= 1.0 - uStep.x || position.y >= 1.0 - uStep.y || position.z >= 1.0 - uStep.z) {
        oPosition = texture(uPosition, position);
        oDirectionAndTransmittance = texture(uDirectionAndTransmittance, position);
        oDistanceTravelledAndSamples = texture(uDistanceTravelledAndSamples, position);
        oRadianceAndDiffusion = vec4(radianceAndDiffusion.r, radianceAndDiffusion.g, 0, 0);
        return;
    }

    float radiance = radianceAndDiffusion.x;
    float totalRadiance = radianceAndDiffusion.x + radianceAndDiffusion.y;

    vec4 left      = texture(uRadianceAndDiffusion, position + vec3(-uStep.x,  0,  0));
    vec4 right     = texture(uRadianceAndDiffusion, position + vec3( uStep.x,  0,  0));
    vec4 down      = texture(uRadianceAndDiffusion, position + vec3( 0, -uStep.y,  0));
    vec4 up        = texture(uRadianceAndDiffusion, position + vec3( 0,  uStep.y,  0));
    vec4 back      = texture(uRadianceAndDiffusion, position + vec3( 0, 0, -uStep.z));
    vec4 forward   = texture(uRadianceAndDiffusion, position + vec3( 0,  0, uStep.z));

    float laplace = left.r + left.g + right.r + right.g +
                    down.r + down.g + up.r + up.g +
                    back.r + back.g + forward.r + forward.g -
                    6.0 * totalRadiance;

    float delta = laplace * totalRadiance * uScattering / uRatio;

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
        float val;
        vec4 colorSample;
        vec4 accumulator = vec4(0.0);
        vec4 radianceAndDiffusion;

        float energyDensity;

        while (t < 1.0 && accumulator.a < 0.99) {
            pos = mix(from, to, t);
            val = texture(uVolume, pos).r;

            radianceAndDiffusion = texture(uRadianceAndDiffusion, pos);
            energyDensity = radianceAndDiffusion.r + radianceAndDiffusion.g;

            colorSample = texture(uTransferFunction, vec2(val, 0.5));
            colorSample.a *= rayStepLength * uAlphaCorrection;
            // utezi z energy density
            colorSample.rgb *= colorSample.a * energyDensity;
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

@PhotonRCD

in vec2 vPosition;

uniform mediump sampler2D uLights;

//uniform uint uNLights;
uniform float uLayer;
uniform float uRandSeed;
uniform vec3 uSize;
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
    PhotonRCD photon;
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
    photon.radiance = 0.05; // 0.05
    photon.samples = 0u;

    oPosition = vec4(photon.position, 0);
    oDirectionAndTransmittance = vec4(photon.direction, photon.transmittance);
    oDistanceTravelledAndSamples = vec4(photon.distance, photon.travelled, float(photon.samples), 0);
    oRadianceAndDiffusion = vec4(photon.radiance, 0, 0, 0);
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

    oPosition = texture(uRadianceAndDiffusion, position);
    oDirectionAndTransmittance = texture(uDirectionAndTransmittance, position);
    oDistanceTravelledAndSamples = texture(uDistanceTravelledAndSamples, position);
    oRadianceAndDiffusion = vec4(texture(uRadianceAndDiffusion, position).r, 0, 0, 0);
}
