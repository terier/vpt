%%MCMGenerate:vertex

void main() {}

%%MCMGenerate:fragment

void main() {}

%%MCMIntegrate:vertex

#version 300 es

layout (location = 0) in vec2 aPosition;

out vec2 vPosition;

void main() {
    vPosition = aPosition;
    gl_Position = vec4(aPosition, 0.0, 1.0);
}

%%MCMIntegrate:fragment

#version 300 es
precision mediump float;

#define M_INVPI 0.31830988618
#define M_2PI 6.28318530718
#define EPS 1e-5

uniform mediump sampler2D uPosition;
uniform mediump sampler2D uDirection;
uniform mediump sampler2D uRadiance;
uniform mediump sampler2D uColor;

uniform mediump sampler3D uVolume;
uniform mediump sampler2D uTransferFunction;
uniform mediump sampler2D uEnvironment;

uniform mat4 uMvpInverseMatrix;
uniform vec2 uInverseResolution;
uniform float uRandSeed;
uniform float uBlur;

uniform float uAbsorptionCoefficient;
uniform float uScatteringCoefficient;
uniform float uScatteringBias;
uniform float uMajorant;
uniform float uMaxBounces;
uniform int uSteps;

in vec2 vPosition;

layout (location = 0) out vec4 oPosition;
layout (location = 1) out vec4 oDirection;
layout (location = 2) out vec4 oRadiance;
layout (location = 3) out vec4 oColor;

@rand
@unprojectRand
@intersectCube

void resetPhoton(inout vec2 randState, out vec3 position, out vec4 directionAndBounces, out vec4 radianceAndWeight) {
    vec3 from, to;
    unprojectRand(randState, vPosition, uMvpInverseMatrix, uInverseResolution, uBlur, from, to);
    directionAndBounces.xyz = normalize(to - from);
    directionAndBounces.w = 0.0;
    vec2 tbounds = max(intersectCube(from, directionAndBounces.xyz), 0.0);
    position = from + tbounds.x * directionAndBounces.xyz;
    radianceAndWeight = vec4(1);
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

void main() {
    vec2 mappedPosition = vPosition * 0.5 + 0.5;
    vec3 position = texture(uPosition, mappedPosition).xyz;
    vec4 directionAndBounces = texture(uDirection, mappedPosition);
    vec4 radianceAndWeight = texture(uRadiance, mappedPosition);
    vec4 colorAndNumber = texture(uColor, mappedPosition);

    vec2 r = rand(vPosition * uRandSeed);
    for (int i = 0; i < uSteps; i++) {
        r = rand(r);
        float t = -log(r.x) / uMajorant;
        position += t * directionAndBounces.xyz;

        vec4 volumeSample = sampleVolumeColor(position);
        float muAbsorption = volumeSample.a * uAbsorptionCoefficient;
        float muScattering = volumeSample.a * uScatteringCoefficient;
        float muNull = uMajorant - muAbsorption - muScattering;
        float muMajorant = muAbsorption + muScattering + abs(muNull);
        float PNull = abs(muNull) / muMajorant;
        float PAbsorption = muAbsorption / muMajorant;
        float PScattering = muScattering / muMajorant;

        if (any(greaterThan(position, vec3(1))) || any(lessThan(position, vec3(0)))) {
            // out of bounds
            vec4 envSample = sampleEnvironmentMap(directionAndBounces.xyz);
            colorAndNumber.w += 1.0;
            colorAndNumber.rgb += (radianceAndWeight.w * radianceAndWeight.rgb * envSample.rgb - colorAndNumber.rgb) / colorAndNumber.w;
            r = rand(r);
            resetPhoton(r, position, directionAndBounces, radianceAndWeight);
        } else if (directionAndBounces.w >= uMaxBounces) {
            // max bounces achieved -> only estimate transmittance
            radianceAndWeight.rgb *= 1.0 - (muAbsorption + muScattering) / muMajorant;
        } else if (r.y < PAbsorption) {
            // absorption
            //vec3 emission = vec3(0);
            //colorAndNumber.w += 1.0;
            //colorAndNumber.rgb += (radianceAndWeight.w * radianceAndWeight.rgb * emission - colorAndNumber.rgb) / colorAndNumber.w;
            //resetPhoton(r, position, directionAndBounces, radianceAndWeight);
            radianceAndWeight.rgb *= 1.0 - (muAbsorption + muScattering) / muMajorant;
        } else if (r.y < PAbsorption + PScattering) {
            // scattering
            r = rand(r);
            radianceAndWeight.rgb *= volumeSample.rgb;
            radianceAndWeight.w *= muScattering / (muMajorant * PScattering);
            directionAndBounces.xyz = sampleHenyeyGreenstein(uScatteringBias, r, directionAndBounces.xyz);
            directionAndBounces.w += 1.0;
        } else {
            // null collision
            radianceAndWeight.w *= muNull / (muMajorant * PNull);
        }
    }

    oPosition = vec4(position, 0);
    oDirection = directionAndBounces;
    oRadiance = radianceAndWeight;
    oColor = colorAndNumber;
}

%%MCMRender:vertex

#version 300 es

layout (location = 0) in vec2 aPosition;
out vec2 vPosition;

void main() {
    vPosition = (aPosition + 1.0) * 0.5;
    gl_Position = vec4(aPosition, 0.0, 1.0);
}

%%MCMRender:fragment

#version 300 es
precision mediump float;

uniform mediump sampler2D uColor;

in vec2 vPosition;
out vec4 oColor;

void main() {
    oColor = vec4(texture(uColor, vPosition).rgb, 1);
}

%%MCMReset:vertex

#version 300 es

layout (location = 0) in vec2 aPosition;

out vec2 vPosition;

void main() {
    vPosition = aPosition;
    gl_Position = vec4(aPosition, 0.0, 1.0);
}

%%MCMReset:fragment

#version 300 es
precision mediump float;

uniform mat4 uMvpInverseMatrix;
uniform vec2 uInverseResolution;
uniform float uRandSeed;
uniform float uBlur;

in vec2 vPosition;

layout (location = 0) out vec4 oPosition;
layout (location = 1) out vec4 oDirection;
layout (location = 2) out vec4 oRadiance;
layout (location = 3) out vec4 oColor;

@rand
@unprojectRand
@intersectCube

void resetPhoton(inout vec2 randState, out vec3 position, out vec4 directionAndBounces, out vec4 radianceAndWeight) {
    vec3 from, to;
    unprojectRand(randState, vPosition, uMvpInverseMatrix, uInverseResolution, uBlur, from, to);
    directionAndBounces.xyz = normalize(to - from);
    directionAndBounces.w = 0.0;
    vec2 tbounds = max(intersectCube(from, directionAndBounces.xyz), 0.0);
    position = from + tbounds.x * directionAndBounces.xyz;
    radianceAndWeight = vec4(1);
}

void main() {
    vec3 position;
    vec4 directionAndBounces;
    vec4 radianceAndWeight;
    vec2 randState = rand(vPosition * uRandSeed);
    resetPhoton(randState, position, directionAndBounces, radianceAndWeight);

    oPosition = vec4(position, 0.0);
    oDirection = directionAndBounces;
    oRadiance = radianceAndWeight;
    oColor = vec4(1, 1, 1, 0);
}
