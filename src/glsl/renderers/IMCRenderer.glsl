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
uniform float uStepSize;
uniform float uOffset;
uniform float uIsovalue;

in vec2 vPosition;
in vec3 vRayFrom;
in vec3 vRayTo;

out vec4 oClosest;

@intersectCube

void main() {
    vec3 rayDirection = vRayTo - vRayFrom;
    vec2 tbounds = max(intersectCube(vRayFrom, rayDirection), 0.0);
    if (tbounds.x >= tbounds.y) {
        oClosest = vec4(-1);
    } else {
        vec4 from = vec4(mix(vRayFrom, vRayTo, tbounds.x), tbounds.x);
        vec4 to = vec4(mix(vRayFrom, vRayTo, tbounds.y), tbounds.y);

        float closest = texture(uClosest, vPosition).w;
        if (closest > 0.0) {
            tbounds.y = closest;
        }

        float t = 0.0;
        float offset = uOffset;
        vec3 pos;
        float value;
        bool found = false;
        do {
            pos = mix(from.xyz, to.xyz, offset);
            value = texture(uVolume, pos).r;
            if (value >= uIsovalue) {
                tbounds.y = mix(from.w, to.w, offset);
                to = vec4(mix(vRayFrom, vRayTo, tbounds.y), tbounds.y);
                found = true;
            }
            t += uStepSize;
            offset = mod(offset + uStepSize + uOffset, 1.0);
        } while (t < 1.0);

        if (found) {
            oClosest = to;
        } else {
            oClosest = vec4(-1);
        }
    }
}

// #section IMCIntegrateISO/vertex

#version 300 es
precision mediump float;

layout (location = 0) in vec2 aPosition;

out vec2 vPosition;

void main() {
    vPosition = (aPosition + 1.0) * 0.5;
    gl_Position = vec4(aPosition, 0.0, 1.0);
}

// #section IMCIntegrateISO/fragment

#version 300 es
precision mediump float;

uniform mediump sampler2D uAccumulator;
uniform mediump sampler2D uFrame;

in vec2 vPosition;

out vec4 oClosest;

void main() {
    vec4 frame = texture(uFrame, vPosition);
    vec4 acc = texture(uAccumulator, vPosition);
    if (frame.w > 0.0 && acc.w > 0.0) {
        oClosest = frame.w < acc.w ? frame : acc;
    } else if (frame.w > 0.0) {
        oClosest = frame;
    } else {
        oClosest = acc;
    }
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

out vec4 oClosest;

void main() {
    oClosest = vec4(-1);
}

// #section IMCIntegrateMCM/vertex

#version 300 es
precision mediump float;
layout (location = 0) in vec2 aPosition;

//uniform mat4 uMvpInverseMatrix;

out vec2 vPosition;

void main() {
    vPosition = aPosition;
    gl_Position = vec4(aPosition, 0.0, 1.0);
}

// #section IMCIntegrateMCM/fragment

#version 300 es
precision mediump float;

#define M_INVPI 0.31830988618
#define PI 3.141592653589f
#define M_2PI 6.28318530718
#define EPS 1e-5

@Photon
@rand
@unprojectRand
@intersectCube

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

uniform float uSpecularWeight;
uniform float uAlphaRoughness;
uniform vec3 uF0;
uniform vec3 uF90;

uniform vec3 uLight;
uniform vec3 uDiffuse;

in vec2 vPosition;

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

vec3 lambertShading(vec4 closest) {
    vec3 normal = normalize(gradient(closest.xyz, 0.005));
    vec3 light = normalize(uLight);
    float lambert = max(dot(normal, light), 0.0);

    return uDiffuse * lambert;
}

vec3 F_Schlick(vec3 f0, vec3 f90, float VdotH) {
    return f0 + (f90 - f0) * pow(clamp(1.0 - VdotH, 0.0, 1.0), 5.0);
}

vec3 BRDF_lambertian(vec3 f0, vec3 f90, vec3 diffuseColor, float specularWeight, float VdotH) {
    return (1.0 - specularWeight * F_Schlick(f0, f90, VdotH)) * diffuseColor;
//    return (1.0 - specularWeight * F_Schlick(f0, f90, VdotH)) * (diffuseColor / PI);
}

float clampedDot(vec3 x, vec3 y) {
    return clamp(dot(x, y), 0.0, 1.0);
}

float V_GGX(float NdotL, float NdotV, float alphaRoughness) {
    float alphaRoughnessSq = alphaRoughness * alphaRoughness;

    float GGXV = NdotL * sqrt(NdotV * NdotV * (1.0 - alphaRoughnessSq) + alphaRoughnessSq);
    float GGXL = NdotV * sqrt(NdotL * NdotL * (1.0 - alphaRoughnessSq) + alphaRoughnessSq);

    float GGX = GGXV + GGXL;
    if (GGX > 0.0)
    {
        return 0.5 / GGX;
    }
    return 0.0;
}

float D_GGX(float NdotH, float alphaRoughness) {
    float alphaRoughnessSq = alphaRoughness * alphaRoughness;
    float f = (NdotH * NdotH) * (alphaRoughnessSq - 1.0) + 1.0;
    return alphaRoughnessSq / (PI * f * f);
}


vec3 BRDF_specularGGX(vec3 f0, vec3 f90, float alphaRoughness, float specularWeight, float VdotH, float NdotL, float NdotV, float NdotH) {
    vec3 F = F_Schlick(f0, f90, VdotH);
    float Vis = V_GGX(NdotL, NdotV, alphaRoughness);
    float D = D_GGX(NdotH, alphaRoughness);

    return specularWeight * F * Vis * D;
//    return F;
}

vec3 BRDF(vec3 pos, vec3 diffuseColor) {
    vec3 f0 = uF0;
    vec3 f90 = uF90;
    float specularWeight = uSpecularWeight;
    float alphaRoughness = uAlphaRoughness;
    vec3 intensity = vec3(1.0, 1.0, 1.0);

//    vec4 vVertexPositionDirty = uMvpInverseMatrix * vec4(pos, 1);
//    vec3 vVertexPosition = vVertexPositionDirty.xyz / vVertexPositionDirty.w;
//
//    vec3 v = normalize(-vVertexPosition);

    vec4 cameraLoc = vec4(0, 0, -1.0, 1.0);
    vec4 cameraDirty = uMvpInverseMatrix * cameraLoc;
    vec3 cameraPosition = cameraDirty.xyz / cameraDirty.w;

    vec3 n = -normalize(gradient(pos, 0.005));
    vec3 l = normalize(-uLight);   // Direction from surface point to light
    vec3 v = normalize(cameraPosition - pos);
    vec3 h = normalize(l + v);          // Direction of the vector between l and v, called halfway vector
    float VdotH = clampedDot(v, h);
    float NdotL = clampedDot(n, l);
    float NdotV = clampedDot(n, v);
    float NdotH = clampedDot(n, h);

    vec3 diffuse = intensity * NdotL *  BRDF_lambertian(f0, f90, diffuseColor, specularWeight, VdotH);
    vec3 specular = intensity * NdotL *
    BRDF_specularGGX(f0, f90, alphaRoughness, specularWeight, VdotH, NdotL, NdotV, NdotH);
//    return vec3(pow(VdotH, 10.0));
    return diffuse + specular;
}

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
    vec4 closest = texture(uClosest, mappedPosition);
//    float maxTraveled = length(closest);

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

        vec3 positionToClosest = closest.rgb - photon.position;
        float dotPTC = dot(positionToClosest, photon.direction);

        if (closest.w > 0.0 && dotPTC <= 0.0 && photon.bounces == 0u) {
//            vec3 radiance = lambertShading(closest);
            vec3 radiance = BRDF(closest.rgb, uDiffuse);
            photon.samples++;
            photon.radiance += (radiance - photon.radiance) / float(photon.samples);
            resetPhoton(r, photon);
        } else if (any(greaterThan(photon.position, vec3(1))) || any(lessThan(photon.position, vec3(0)))) {
            // out of bounds
            vec4 envSample = sampleEnvironmentMap(photon.direction);
            vec3 radiance = photon.transmittance * envSample.rgb;
            photon.samples++;
            photon.radiance += (radiance - photon.radiance) / float(photon.samples);
            resetPhoton(r, photon);
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
