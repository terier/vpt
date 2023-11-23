// #part /glsl/shaders/renderers/EAM2/generate/vertex

#version 300 es

uniform mat4 uMvpInverseMatrix;

out vec3 vRayFrom;
out vec3 vRayTo;

// #link /glsl/mixins/unproject.glsl
@unproject

const vec2 vertices[] = vec2[](
    vec2(-1, -1),
    vec2( 3, -1),
    vec2(-1,  3)
);

void main() {
    vec2 position = vertices[gl_VertexID];
    unproject(position, uMvpInverseMatrix, vRayFrom, vRayTo);
    gl_Position = vec4(position, 0, 1);
}

// #part /glsl/shaders/renderers/EAM2/generate/fragment

#version 300 es
precision mediump float;
precision mediump sampler2D;
precision mediump sampler3D;

uniform sampler3D uVolume;
uniform sampler2D uTransferFunction;
uniform float uStepSize;
uniform float uOffset;
uniform float uExtinction;

in vec3 vRayFrom;
in vec3 vRayTo;

out vec4 oColor;

// #link /glsl/mixins/intersectCube.glsl
@intersectCube

vec4 sampleVolumeColor(vec3 position) {
    vec2 volumeSample = texture(uVolume, position).rg;
    vec4 transferSample = texture(uTransferFunction, volumeSample);
    return transferSample;
}

void main() {
    vec3 rayDirection = vRayTo - vRayFrom;
    vec2 tbounds = max(intersectCube(vRayFrom, rayDirection), 0.0);
    if (tbounds.x >= tbounds.y) {
        oColor = vec4(1);
        return;
    }

    vec3 from = mix(vRayFrom, vRayTo, tbounds.x);
    vec3 to = mix(vRayFrom, vRayTo, tbounds.y);
    float rayStepLength = distance(from, to) * uStepSize;

    float t = uStepSize * uOffset;
    vec4 accumulator = vec4(0);

    while (t < 1.0) {
        vec3 position = mix(from, to, t);
        vec4 colorSample = sampleVolumeColor(position);

        float transmittance = exp(-accumulator.a);
        float absorption = colorSample.a * uExtinction;
        vec3 emission = colorSample.rgb * absorption;

        accumulator.a += absorption * rayStepLength;
        accumulator.rgb += transmittance * emission * rayStepLength;

        t += uStepSize;
    }

    oColor = mix(vec4(accumulator.rgb, 1), vec4(1), exp(-accumulator.a));
}

// #part /glsl/shaders/renderers/EAM2/integrate/vertex

#version 300 es

const vec2 vertices[] = vec2[](
    vec2(-1, -1),
    vec2( 3, -1),
    vec2(-1,  3)
);

out vec2 vPosition;

void main() {
    vec2 position = vertices[gl_VertexID];
    vPosition = position * 0.5 + 0.5;
    gl_Position = vec4(position, 0, 1);
}

// #part /glsl/shaders/renderers/EAM2/integrate/fragment

#version 300 es
precision mediump float;
precision mediump sampler2D;
precision mediump sampler3D;

uniform sampler2D uAccumulator;
uniform sampler2D uFrame;
uniform float uMix;

in vec2 vPosition;

out vec4 oColor;

void main() {
    vec4 accumulator = texture(uAccumulator, vPosition);
    vec4 frame = texture(uFrame, vPosition);
    oColor = mix(accumulator, frame, uMix);
}

// #part /glsl/shaders/renderers/EAM2/render/vertex

#version 300 es

const vec2 vertices[] = vec2[](
    vec2(-1, -1),
    vec2( 3, -1),
    vec2(-1,  3)
);

out vec2 vPosition;

void main() {
    vec2 position = vertices[gl_VertexID];
    vPosition = position * 0.5 + 0.5;
    gl_Position = vec4(position, 0, 1);
}

// #part /glsl/shaders/renderers/EAM2/render/fragment

#version 300 es
precision mediump float;
precision mediump sampler2D;

uniform sampler2D uAccumulator;

in vec2 vPosition;

out vec4 oColor;

void main() {
    oColor = texture(uAccumulator, vPosition);
}

// #part /glsl/shaders/renderers/EAM2/reset/vertex

#version 300 es

const vec2 vertices[] = vec2[](
    vec2(-1, -1),
    vec2( 3, -1),
    vec2(-1,  3)
);

void main() {
    vec2 position = vertices[gl_VertexID];
    gl_Position = vec4(position, 0, 1);
}

// #part /glsl/shaders/renderers/EAM2/reset/fragment

#version 300 es
precision mediump float;

out vec4 oColor;

void main() {
    oColor = vec4(0, 0, 0, 1);
}
