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
uniform mediump sampler2D uRandom;
uniform float uOffset;
uniform float uSigmaMax;
uniform float uAlphaCorrection;

in vec3 vRayFrom;
in vec3 vRayTo;
in vec2 vPosition;
out vec4 oColor;

@intersectCube

void main() {
    vec3 rayDirection = vRayTo - vRayFrom;
    vec2 tbounds = max(intersectCube(vRayFrom, rayDirection), 0.0);
    vec2 texCoord = vec2(atan(rayDirection.x, -rayDirection.z), asin(-rayDirection.y) * 2.0) * M_INVPI * 0.5 + 0.5;
    if (tbounds.x >= tbounds.y) {
        oColor = texture(uEnvironment, texCoord);
    } else {
        float s = tbounds.y - tbounds.x;
        vec3 from = mix(vRayFrom, vRayTo, tbounds.x);
        vec3 to = mix(vRayFrom, vRayTo, tbounds.y);
        float rayLength = distance(from, to);

        float t = 0.0;
        float randpos = fract(uOffset + fract(sin(dot(vPosition, vec2(12.9898, 78.233))) * 43758.5453));
        float alphaAccumulation = 0.0;
        do {
            vec4 rand = texture(uRandom, vec2(randpos, 0.5));
            randpos = fract(randpos + 1.0 / float(textureSize(uRandom, 0).x));
            float s = -log(1.0 - rand.r) / uSigmaMax;
            float stepLength = rayLength * s;
            t += s;
            if (t > 1.0) {
                break;
            }
            vec3 samplingPosition = mix(from, to, t);
            float volumeSample = texture(uVolume, samplingPosition).r;
            vec4 transferSample = texture(uTransferFunction, vec2(volumeSample, 0.5));
            float alphaSample = transferSample.a;
            alphaAccumulation += alphaSample * stepLength;
            if (rand.g < alphaSample / uSigmaMax) {
                break;
            }
        } while (true);

        float extinction = exp(-alphaAccumulation * uAlphaCorrection);
        oColor = vec4(extinction, extinction, extinction, 1.0);
        /*if (t > 1.0) {
            // sample environment map
            oColor = vec4(extinction, 0.0, 1.0, 1.0);
        } else {
            // sample scattering
            oColor = vec4(0.0, alphaAccumulation, 1.0, 1.0);
        }*/
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
uniform float uFrameNumber; // float to avoid casting

in vec2 vPosition;
out vec4 oColor;

void main() {
    vec4 acc = texture(uAccumulator, vPosition);
    vec4 frame = texture(uFrame, vPosition);
    float invn = 1.0 / uFrameNumber;
    oColor = acc + (frame - acc) * invn;
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
