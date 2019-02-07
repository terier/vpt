%%MultipleScatteringGenerate:vertex

#version 300 es

layout (location = 0) in vec2 aPosition;

void main() {
    gl_Position = vec4(aPosition, 0.0, 1.0);
}

%%MultipleScatteringGenerate:fragment

#version 300 es
precision mediump float;

void main() {
}

%%MultipleScatteringIntegrate:vertex

#version 300 es

layout (location = 0) in vec2 aPosition;

out vec2 vPosition;

void main() {
    vPosition = aPosition;
    gl_Position = vec4(aPosition, 0.0, 1.0);
}

%%MultipleScatteringIntegrate:fragment

#version 300 es
precision mediump float;

#define M_INVPI 0.31830988618
#define M_2PI 6.28318530718
#define RAND_MAGIC 123.4567

uniform mediump sampler2D uPosition;
uniform mediump sampler2D uDirection;
uniform mediump sampler2D uRadiance;
uniform mediump sampler2D uColor;

uniform mediump sampler3D uVolume;
uniform mediump sampler2D uTransferFunction;
uniform mediump sampler2D uEnvironment;

uniform mat4 uMvpInverseMatrix;
uniform float uOffset;

uniform float uAbsorptionCoefficient;
uniform float uScatteringCoefficient;
uniform float uScatteringBias;
uniform float uMajorant;
uniform float uMaxBounces;

in vec2 vPosition;

layout (location = 0) out vec4 oPosition;
layout (location = 1) out vec4 oDirection;
layout (location = 2) out vec4 oRadiance;
layout (location = 3) out vec4 oColor;

@rand
@unproject
@intersectCube

void resetPhoton(out vec3 position, out vec3 direction, out vec4 radianceAndWeight) {
    vec3 from, to;
    unproject(vPosition, uMvpInverseMatrix, from, to);
    direction = normalize(to - from);
    vec2 tbounds = max(intersectCube(from, direction), 0.0);
    position = from + tbounds.x * direction;
    radianceAndWeight = vec4(1);
}

vec4 sampleEnvironmentMap(vec3 d) {
    vec2 texCoord = vec2(atan(d.x, -d.z), asin(-d.y) * 2.0) * M_INVPI * 0.5 + 0.5;
    return texture(uEnvironment, texCoord);
}

vec4 sampleVolumeColor(vec3 position) {
    float volumeSample = texture(uVolume, position).r;
    vec4 transferSample = texture(uTransferFunction, vec2(volumeSample, 0.5));
    return transferSample;
}

float sampleHenyeyGreensteinAngle(float g, float U) {
    float s = U * 2.0 - 1.0;
    float g2 = g * g;
    float c = (1.0 - g2) / (1.0 + g * s);
    return (1.0 + g2 + c * c) / (2.0 * g);
}

vec3 sampleHenyeyGreenstein(float g, float U, vec3 direction) {
    // TODO: implement
    return vec3(0);
}

vec3 randomDirection(vec2 r) {
    float phi = r.x * M_2PI;
    float z = r.y * 2.0 - 1.0;
    float k = sqrt(1.0 - z * z);
    return vec3(k * cos(phi), k * sin(phi), z);
}

void main() {
    vec2 mappedPosition = vPosition * 0.5 + 0.5;
    vec3 position = texture(uPosition, mappedPosition).xyz;
    vec3 direction = texture(uDirection, mappedPosition).xyz;
    vec4 radianceAndWeight = texture(uRadiance, mappedPosition);
    vec4 colorAndNumber = texture(uColor, mappedPosition);

    vec2 r = vPosition * uOffset;
    for (int i = 0; i < 1; i++) {
        r = rand(r * RAND_MAGIC);
        float t = -log(r.x) / uMajorant;
        position += t * direction;

        vec4 volumeSample = sampleVolumeColor(position);
        float muAbsorption = volumeSample.a * uAbsorptionCoefficient;
        float muScattering = volumeSample.a * uScatteringCoefficient;
        float muNull = uMajorant - muAbsorption - muScattering;
        float muMajorant = muAbsorption + muScattering + abs(muNull);
        float PNull = abs(muNull) / muMajorant;
        float PAbsorption = muAbsorption / muMajorant;
        float PScattering = muScattering / muMajorant;

        //if (bounces > uMaxBounces) {
        //    // max depth -> bias!
        //    resetPhoton(position, direction, radianceAndWeight);
        //} else
        if (any(greaterThan(position, vec3(1))) || any(lessThan(position, vec3(0)))) {
            // out of bounds
            vec4 envSample = sampleEnvironmentMap(direction);
            colorAndNumber.w += 1.0;
            colorAndNumber.rgb += (radianceAndWeight.w * radianceAndWeight.rgb * envSample.rgb - colorAndNumber.rgb) / colorAndNumber.w;
            resetPhoton(position, direction, radianceAndWeight);
        } else if (r.y < PAbsorption) {
            // absorption
            colorAndNumber.w += 1.0;
            colorAndNumber.rgb -= colorAndNumber.rgb / colorAndNumber.w;
            resetPhoton(position, direction, radianceAndWeight);
        } else if (r.y < PScattering) {
            // scattering
            r = rand(r * RAND_MAGIC);
            radianceAndWeight.rgb *= volumeSample.rgb;
            radianceAndWeight.w *= muScattering / (muMajorant * PScattering);
            direction = randomDirection(r);
        } else {
            // null collision
            radianceAndWeight.w *= muNull / (muMajorant * PNull);
        }
    }

    oPosition = vec4(position, 0);
    oDirection = vec4(direction, 0);
    oRadiance = radianceAndWeight;
    oColor = colorAndNumber;
}

%%MultipleScatteringRender:vertex

#version 300 es

layout (location = 0) in vec2 aPosition;
out vec2 vPosition;

void main() {
    vPosition = (aPosition + 1.0) * 0.5;
    gl_Position = vec4(aPosition, 0.0, 1.0);
}

%%MultipleScatteringRender:fragment

#version 300 es
precision mediump float;

uniform mediump sampler2D uColor;

in vec2 vPosition;
out vec4 oColor;

void main() {
    oColor = vec4(texture(uColor, vPosition).rgb, 1);
}

%%MultipleScatteringReset:vertex

#version 300 es

layout (location = 0) in vec2 aPosition;

out vec2 vPosition;

@unproject

void main() {
    vPosition = aPosition;
    gl_Position = vec4(aPosition, 0.0, 1.0);
}

%%MultipleScatteringReset:fragment

#version 300 es
precision mediump float;

#define M_INVPI 0.31830988618

uniform mediump sampler2D uEnvironment;

uniform mat4 uMvpInverseMatrix;

in vec2 vPosition;

layout (location = 0) out vec4 oPosition;
layout (location = 1) out vec4 oDirection;
layout (location = 2) out vec4 oRadiance;
layout (location = 3) out vec4 oColor;

@intersectCube
@unproject

void resetPhoton(out vec3 position, out vec3 direction, out vec4 radianceAndWeight) {
    vec3 from, to;
    unproject(vPosition, uMvpInverseMatrix, from, to);
    direction = normalize(to - from);
    vec2 tbounds = max(intersectCube(from, direction), 0.0);
    position = from + tbounds.x * direction;
    radianceAndWeight = vec4(1);
}

vec4 sampleEnvironmentMap(vec3 d) {
    vec2 texCoord = vec2(atan(d.x, -d.z), asin(-d.y) * 2.0) * M_INVPI * 0.5 + 0.5;
    return texture(uEnvironment, texCoord);
}

void main() {
    vec3 position;
    vec3 direction;
    vec4 radiance;
    resetPhoton(position, direction, radiance);

    oPosition = vec4(position, 0.0);
    oDirection = vec4(direction, 0.0);
    oRadiance = radiance;
    //oColor = sampleEnvironmentMap(direction);
    oColor = vec4(1, 1, 1, 0);
}
