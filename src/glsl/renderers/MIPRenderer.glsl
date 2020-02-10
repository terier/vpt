// #package glsl/shaders

// #include ../mixins/unproject.glsl
// #include ../mixins/intersectCube.glsl

// #section MIPGenerate/vertex

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

// #section MIPGenerate/fragment

#version 300 es
precision mediump float;

uniform mediump sampler3D uVolume;
uniform float uStepSize;
uniform float uOffset;

in vec3 vRayFrom;
in vec3 vRayTo;
out float oColor;

@intersectCube

void main() {
    vec3 rayDirection = vRayTo - vRayFrom;
    vec2 tbounds = max(intersectCube(vRayFrom, rayDirection), 0.0);
    if (tbounds.x >= tbounds.y) {
        oColor = 0.0;
    } else {
        vec3 from = mix(vRayFrom, vRayTo, tbounds.x);
        vec3 to = mix(vRayFrom, vRayTo, tbounds.y);

        float t = 0.0;
        float val = 0.0;
        float offset = uOffset;
        vec3 pos;
        do {
            pos = mix(from, to, offset);
            val = max(texture(uVolume, pos).r, val);
            t += uStepSize;
            offset = mod(offset + uStepSize, 1.0);
        } while (t < 1.0);
        oColor = val;
    }
}

// #section MIPIntegrate/vertex

#version 300 es
precision mediump float;

layout(location = 0) in vec2 aPosition;
out vec2 vPosition;

void main() {
    vPosition = (aPosition + 1.0) * 0.5;
    gl_Position = vec4(aPosition, 0.0, 1.0);
}

// #section MIPIntegrate/fragment

#version 300 es
precision mediump float;

uniform mediump sampler2D uAccumulator;
uniform mediump sampler2D uFrame;

in vec2 vPosition;
out float oColor;

void main() {
    float acc = texture(uAccumulator, vPosition).r;
    float frame = texture(uFrame, vPosition).r;
    oColor = max(acc, frame);
}

// #section MIPRender/vertex

#version 300 es
precision mediump float;

layout(location = 0) in vec2 aPosition;
out vec2 vPosition;

void main() {
    vPosition = (aPosition + 1.0) * 0.5;
    gl_Position = vec4(aPosition, 0.0, 1.0);
}

// #section MIPRender/fragment

#version 300 es
precision mediump float;

uniform mediump sampler2D uAccumulator;

in vec2 vPosition;
out vec4 oColor;

void main() {
    float acc = texture(uAccumulator, vPosition).r;
    oColor = vec4(acc, acc, acc, 1.0);
}

// #section MIPReset/vertex

#version 300 es
precision mediump float;

layout(location = 0) in vec2 aPosition;

void main() {
    gl_Position = vec4(aPosition, 0.0, 1.0);
}

// #section MIPReset/fragment

#version 300 es
precision mediump float;

out float oColor;

void main() {
    oColor = 0.0;
}
