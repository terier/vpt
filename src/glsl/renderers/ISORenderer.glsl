// #package glsl/shaders

// #include ../mixins/unproject.glsl
// #include ../mixins/intersectCube.glsl

// #section ISOGenerate/vertex

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

// #section ISOGenerate/fragment

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

// #section ISOIntegrate/vertex

#version 300 es
precision mediump float;

layout (location = 0) in vec2 aPosition;

out vec2 vPosition;

void main() {
    vPosition = (aPosition + 1.0) * 0.5;
    gl_Position = vec4(aPosition, 0.0, 1.0);
}

// #section ISOIntegrate/fragment

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

// #section ISORender/vertex

#version 300 es
precision mediump float;

layout (location = 0) in vec2 aPosition;

out vec2 vPosition;

void main() {
    vPosition = (aPosition + 1.0) * 0.5;
    gl_Position = vec4(aPosition, 0.0, 1.0);
}

// #section ISORender/fragment

#version 300 es
precision mediump float;

uniform mediump sampler2D uClosest;
uniform mediump sampler3D uVolume;
uniform vec3 uLight;
uniform vec3 uDiffuse;

in vec2 vPosition;

out vec4 oColor;

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
    vec4 closest = texture(uClosest, vPosition);

    if (closest.w > 0.0) {
        vec3 normal = normalize(gradient(closest.xyz, 0.005));
        vec3 light = normalize(uLight);
        float lambert = max(dot(normal, light), 0.0);
        oColor = vec4(uDiffuse * lambert, 1.0);
    } else {
        oColor = vec4(1.0);
    }
}

// #section ISOReset/vertex

#version 300 es
precision mediump float;

layout (location = 0) in vec2 aPosition;

void main() {
    gl_Position = vec4(aPosition, 0.0, 1.0);
}

// #section ISOReset/fragment

#version 300 es
precision mediump float;

out vec4 oClosest;

void main() {
    oClosest = vec4(-1);
}
