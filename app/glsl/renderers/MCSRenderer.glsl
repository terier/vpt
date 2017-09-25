%%MCSGenerate:vertex

#version 300 es
precision mediump float;

uniform mat4 uMvpInverseMatrix;

layout(location = 0) in vec2 aPosition;
out vec3 vRayFrom;
out vec3 vRayTo;

@unproject

void main() {
    unproject(aPosition, uMvpInverseMatrix, vRayFrom, vRayTo);
    gl_Position = vec4(aPosition, 0.0, 1.0);
}

%%MCSGenerate:fragment

#version 300 es
precision mediump float;

uniform mediump sampler3D uVolume;
uniform float uStepSize;
uniform float uOffset;
uniform float uMCSvalue;

in vec3 vRayFrom;
in vec3 vRayTo;
out vec4 oColor;

@intersectCube

void main() {
    vec3 rayDirection = vRayTo - vRayFrom;
    vec2 tbounds = max(intersectCube(vRayFrom, rayDirection), 0.0);
    if (tbounds.x >= tbounds.y) {
        oColor = vec4(0.0, 0.0, 0.0, 1.0);
    } else {
        vec3 from = mix(vRayFrom, vRayTo, tbounds.x);
        vec3 to = mix(vRayFrom, vRayTo, tbounds.y);

        float t = 0.0;
        float closest = 2.0; // anything > 1.0
        float offset = uOffset;
        vec3 pos;
        do {
            pos = mix(from, to, offset);
            if (texture(uVolume, pos).r > uMCSvalue) {
                closest = min(offset, closest);
            }
            t += uStepSize;
            offset = mod(offset + uStepSize, 1.0);
        } while (t < 1.0);

        if (closest < 1.0) {
            pos = mix(from, to, closest);
            float h = 0.005;
            float vxm = texture(uVolume, pos + vec3(-h, 0.0, 0.0)).r;
            float vxp = texture(uVolume, pos + vec3( h, 0.0, 0.0)).r;
            float vym = texture(uVolume, pos + vec3(0.0, -h, 0.0)).r;
            float vyp = texture(uVolume, pos + vec3(0.0,  h, 0.0)).r;
            float vzm = texture(uVolume, pos + vec3(0.0, 0.0, -h)).r;
            float vzp = texture(uVolume, pos + vec3(0.0, 0.0,  h)).r;
            float dx = (vxp - vxm) / (2.0 * h);
            float dy = (vyp - vym) / (2.0 * h);
            float dz = (vzp - vzm) / (2.0 * h);
            vec3 grad = normalize(vec3(dx, dy, dz));
            vec3 gradEncoded = grad * 0.5 + 0.5;
            oColor = vec4(gradEncoded, closest);
        } else {
            oColor = vec4(0.0, 0.0, 0.0, 1.0);
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

in vec2 vPosition;
out vec4 oColor;

void main() {
    vec4 acc = texture(uAccumulator, vPosition);
    vec4 frame = texture(uFrame, vPosition);
    float closestAcc = acc.w;
    float closestFrame = frame.w;
    oColor = closestFrame < closestAcc ? frame : acc;
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
uniform vec3 uLight;
uniform vec3 uDiffuse;

in vec2 vPosition;
out vec4 oColor;

void main() {
    vec4 acc = texture(uAccumulator, vPosition);
    vec3 grad = (acc.xyz - 0.5) * 2.0;
    float closest = acc.w;

    if (closest < 1.0) {
        vec3 normal = normalize(grad);
        vec3 light = normalize(uLight);
        float lambert = max(dot(normal, light), 0.0);
        oColor = vec4(uDiffuse * lambert, 1.0);
    } else {
        oColor = vec4(1.0);
    }
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
