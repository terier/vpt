%%MCSGenerate:vertex

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
    vPosition = (aPosition + 1.0) * 0.5;
    gl_Position = vec4(aPosition, 0.0, 1.0);
}

%%MCSGenerate:fragment

#version 300 es
precision mediump float;

#define M_INVPI 0.31830988618

uniform mediump sampler3D uVolume;
uniform mediump sampler2D uTransferFunction;
uniform mediump sampler2D uEnvironment;
uniform float uOffset;
uniform float uSigmaMax;
uniform float uAlphaCorrection;
uniform vec3 uScatteringDirection;

in vec3 vRayFrom;
in vec3 vRayTo;
in vec2 vPosition;
out vec4 oColor;

@intersectCube

float randA(vec2 p) {
    return fract(cos(dot(p, vec2(23.14069263277926, 2.665144142690225))) * 12345.6789);
}

float randB(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

vec2 rand(vec2 p) {
    return vec2(randA(p), randB(p));
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

float sampleDistance(vec3 from, vec3 to, vec2 seed) {
    float maxDistance = distance(from, to);
    float distance = 0.0;
    float invSigmaMax = 1.0 / uSigmaMax;

    do {
        seed = rand(seed);
        float stepLength = -log(1.0 - seed.x) * invSigmaMax;
        distance += stepLength;
        if (distance > maxDistance) {
            break;
        }
        vec3 samplingPosition = mix(from, to, distance / maxDistance);
        vec4 transferSample = sampleVolumeColor(samplingPosition);
        float alphaSample = transferSample.a * uAlphaCorrection;
        if (seed.y < alphaSample * invSigmaMax) {
            break;
        }
    } while (true);

    return distance;
}

void main() {
    vec3 rayDirection = vRayTo - vRayFrom;
    vec3 rayDirectionUnit = normalize(rayDirection);
    vec2 tbounds = max(intersectCube(vRayFrom, rayDirection), 0.0);

    if (tbounds.x >= tbounds.y) {
        oColor = sampleEnvironmentMap(rayDirectionUnit);
    } else {
        vec3 from = mix(vRayFrom, vRayTo, tbounds.x);
        vec3 to = mix(vRayFrom, vRayTo, tbounds.y);
        float maxDistance = distance(from, to);

        vec2 seed = vPosition + rand(vec2(uOffset, uOffset));
        float dist = sampleDistance(from, to, seed);

        if (dist > maxDistance) {
            oColor = sampleEnvironmentMap(rayDirectionUnit);
        } else {
            from = mix(from, to, dist / maxDistance);
            tbounds = max(intersectCube(from, uScatteringDirection), 0.0);
            to = mix(from, from + uScatteringDirection, tbounds.y);
            maxDistance = distance(from, to);
            dist = sampleDistance(from, to, seed);
            if (dist > maxDistance) {
                vec4 diffuseColor = sampleVolumeColor(from);
                vec4 lightColor = sampleEnvironmentMap(normalize(uScatteringDirection));
                oColor = diffuseColor * lightColor;
            } else {
                oColor = vec4(0.0, 0.0, 0.0, 1.0);
            }
        }
    }
}

%%MCSIntegrate:vertex

#version 300 es
precision mediump float;

layout(location = 0) in vec2 aPosition;
out vec2 vPosition;

void main() {
    vPosition = (aPosition + 1.0) * 0.5;
    gl_Position = vec4(aPosition, 0.0, 1.0);
}

%%MCSIntegrate:fragment

#version 300 es
precision mediump float;

uniform mediump sampler2D uAccumulator;
uniform mediump sampler2D uFrame;
uniform float uInvFrameNumber;

in vec2 vPosition;
out vec4 oColor;

void main() {
    vec4 acc = texture(uAccumulator, vPosition);
    vec4 frame = texture(uFrame, vPosition);
    oColor = acc + (frame - acc) * uInvFrameNumber;
}

%%MCSRender:vertex

#version 300 es
precision mediump float;

layout(location = 0) in vec2 aPosition;
out vec2 vPosition;

void main() {
    vPosition = (aPosition + 1.0) * 0.5;
    gl_Position = vec4(aPosition, 0.0, 1.0);
}

%%MCSRender:fragment

#version 300 es
precision mediump float;

uniform mediump sampler2D uAccumulator;

in vec2 vPosition;
out vec4 oColor;

void main() {
    vec4 acc = texture(uAccumulator, vPosition);
    oColor = acc;
}

%%MCSReset:vertex

#version 300 es
precision mediump float;

layout(location = 0) in vec2 aPosition;

void main() {
    gl_Position = vec4(aPosition, 0.0, 1.0);
}

%%MCSReset:fragment

#version 300 es
precision mediump float;

out vec4 oColor;

void main() {
    oColor = vec4(0.0, 0.0, 0.0, 1.0);
}
