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

    vPosition = aPosition;
    gl_Position = vec4(aPosition, 0.0, 1.0);
}

// #section CIMIntegrateMCM/fragment

#version 300 es
precision mediump float;

#define M_INVPI 0.31830988618
#define M_2PI 6.28318530718
#define EPS 1e-5

@PhotonW

uniform mediump sampler3D uVolume;
uniform mediump sampler2D uTransferFunction;
uniform mediump sampler3D uPosition;
uniform mediump sampler3D uDirectionAndBounces;
uniform mediump sampler3D uWeight;
uniform mediump sampler3D uRadianceAndSamples;
uniform mediump sampler2D uEnvironment;

uniform float uRandSeed;
uniform float uExtinctionScale;
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
layout (location = 1) out vec4 oDirectionAndBounces;
layout (location = 2) out vec4 oWeight;
layout (location = 3) out vec4 oRadianceAndSamples;

@hashrand

vec3 randomDirection(inout float randState) {
    float phi = rand(randState) * M_2PI;
    float z = rand(randState) * 2.0 - 1.0;
    float k = sqrt(1.0 - z * z);
    return vec3(k * cos(phi), k * sin(phi), z);
}

float sampleHenyeyGreensteinAngleCosine(float g, float U) {
    float g2 = g * g;
    float c = (1.0 - g2) / (1.0 - g + 2.0 * g * U);
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

void resetPhoton(inout float randState, inout Photon photon, vec3 texelPosition) {
    randState = rand(randState);
    photon.direction = normalize(randomDirection(randState));
    photon.bounces = 0.0;
    photon.position = texelPosition;
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

vec3 lambertShading(vec3 closest) {
    vec3 normal = normalize(gradient(closest, 0.005));
    vec3 light = normalize(uLight);
    float lambert = max(dot(normal, light), 0.0);

    return uDiffuse * lambert;
}

void normalizeProbabilities(inout float PA, inout float PB, inout float PC) {
    float c = 1.0 / (PA + PB + PC);
    PA *= c;
    PB *= c;
    PC *= c;
}

void main() {
    Photon photon;
    vec3 texelPosition = vec3(vPosition * 0.5 + 0.5,  uLayer);
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

        if (volumeSample.r >= uIsovalue && photon.bounces < 1.0) {
//            vec3 radiance = lambertShading(photon.position);
//            photon.samples++;
//            photon.radiance += (radiance - photon.radiance) / float(photon.samples);

//            vec3 sampleRadiance = vec3(0.0);
//            samples += 1.0;
//            radiance += (sampleRadiance - radiance) / samples;

            resetPhoton(randState, photon, texelPosition);
        } else
        if (any(greaterThan(photon.position, vec3(1))) || any(lessThan(photon.position, vec3(0)))) {
            // out of bounds
            vec3 sampleRadiance = photon.weight * sampleEnvironmentMap(photon.direction).rgb;
            samples += 1.0;
            radiance += (sampleRadiance - radiance) / samples;
            resetPhoton(randState, photon, texelPosition);
        }
//        else {
//            vec3 weightAS = (absorptionCoefficient + scatteringCoefficient) / uMajorant;
//            photon.weight *= vec3(1.0) - weightAS;
//        }

        else if (fortuneWheel < absorptionProbability) {
            // absorption
            vec3 sampleRadiance = vec3(0);
            samples += 1.0;
            radiance += (sampleRadiance - radiance) / samples;
            resetPhoton(randState, photon, texelPosition);
        }
        else if (fortuneWheel < absorptionProbability + scatteringProbability) {
            // scattering
            vec3 weightS = scatteringCoefficient / (uMajorant * scatteringProbability);
            vec3 outDirection = -normalize(uLight);
            photon.weight *= weightS * HenyeyGreensteinPhaseFunction(uScatteringBias, photon.direction, outDirection);
            photon.direction = outDirection;
            photon.bounces += 1.0;
        } else {
            // null collision
            photon.weight *= nullCoefficient / (uMajorant * nullProbability);
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

    oPosition = vec4(photon.position, 0);
    oDirectionAndBounces = vec4(photon.direction, photon.bounces);
    oWeight = vec4(photon.weight, 0);
    oRadianceAndSamples = vec4(radiance, samples);
}

// #section CIMRender/vertex

#version 300 es
precision mediump float;

uniform mat4 uMvpInverseMatrix;

layout(location = 0) in vec2 aPosition;
out vec3 vRayFrom;
out vec3 vRayTo;

out vec2 vPosition;
out vec3 cameraPosition;

@unproject

void main() {
    unproject(aPosition, uMvpInverseMatrix, vRayFrom, vRayTo);
    gl_Position = vec4(aPosition, 0.0, 1.0);
    //debug
    vPosition = aPosition * 0.5 + 0.5;
}

// #section CIMRender/fragment

#version 300 es
#define M_PI 3.141592653589793

precision mediump float;

uniform mediump sampler3D uVolume;
uniform mediump sampler2D uTransferFunction;
uniform mediump sampler3D uRadianceAndDiffusion;
uniform mat4 uMvpInverseMatrix;
uniform int uShaderType;
uniform float uStepSize;
uniform float uOffset;
uniform float uAlphaCorrection;

uniform float uIsovalue;
uniform float uP;
uniform vec3 uLight;
uniform vec3 uDiffuse;

uniform float uSpecularWeight;
uniform float uAlphaRoughness;
uniform vec3 uF0;
uniform vec3 uF90;

in vec3 vRayFrom;
in vec3 vRayTo;
in vec3 cameraPosition;
out vec4 oColor;

//debug
in vec2 vPosition;

@intersectCube
@BRDF

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
        bool found = false;
        vec3 closest;

        while (t < 1.0 && accumulator.a < 0.99) {
            pos = mix(from, to, t);
            val = texture(uVolume, pos).rg;
            if (val.r >= uIsovalue) {
                if (!found) {
                    found = true;
                    closest = pos;
                }
//                vec3 res = lambertShading(pos);
//                vec3 res = BRDF(closest, uDiffuse);
                vec3 N = -normalize(gradient(closest.rgb, 0.005));
                vec3 res;
                if (uShaderType == 0) {
                    res = uDiffuse;
                }
                else if (uShaderType == 1) {
                    res = lambertShading(uDiffuse, N, uLight);
                }
                else if (uShaderType == 2) {
                    res = phongShading(closest.rgb, uDiffuse, N, uLight, uP);
                }
                else if (uShaderType == 3) {
                    res = BRDF(closest.rgb, uDiffuse, uF0, uF90, uSpecularWeight, uAlphaRoughness, uMvpInverseMatrix, N, uLight);
                }

                colorSample = vec4(res, 1);
//                colorSample.a *= rayStepLength * uAlphaCorrection;
                accumulator += (1.0 - accumulator.a) * colorSample;
                t += uStepSize;
//                continue;
                break;
            }
            radianceAndDiffusion = texture(uRadianceAndDiffusion, pos);
//            energyDensity = radianceAndDiffusion.r + radianceAndDiffusion.g;

            colorSample = texture(uTransferFunction, val);
            colorSample.a *= rayStepLength * uAlphaCorrection;
            // utezi z energy density
            colorSample.rgb *= radianceAndDiffusion.rbg;
            colorSample.rgb *= colorSample.a;
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

@PhotonW
uniform float uRandSeed;
uniform float uLayer;

in vec2 vPosition;

layout (location = 0) out vec4 oPosition;
layout (location = 1) out vec4 oDirectionAndBounces;
layout (location = 2) out vec4 oWeight;
layout (location = 3) out vec4 oRadianceAndSamples;

@hashrand

vec3 randomDirection(inout float randState) {
    float phi = rand(randState) * M_2PI;
    float z = rand(randState) * 2.0 - 1.0;
    float k = sqrt(1.0 - z * z);
    return vec3(k * cos(phi), k * sin(phi), z);
}

void main() {
    Photon photon;
    vec3 from = vec3(vPosition,  uLayer);
    float randState = uRandSeed;
    photon.direction = normalize(randomDirection(randState));
    photon.position = from;
    photon.weight = vec3(1);
    vec3 radiance = vec3(0.05);
    oPosition = vec4(photon.position, 0);
    oDirectionAndBounces = vec4(photon.direction, float(photon.bounces));
    oWeight = vec4(photon.weight, 0);
    oRadianceAndSamples = vec4(radiance, 0);
}