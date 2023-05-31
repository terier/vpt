// #part /glsl/shaders/renderers/DOS/integrate/vertex

#version 300 es

uniform mat4 uMvpInverseMatrix;
uniform float uDepth;

out vec2 vPosition2D;
out vec3 vPosition3D;

const vec2 vertices[] = vec2[](
    vec2(-1, -1),
    vec2( 3, -1),
    vec2(-1,  3)
);

void main() {
    vec2 position = vertices[gl_VertexID];
    vPosition2D = position * 0.5 + 0.5;
    vec4 position3D = uMvpInverseMatrix * vec4(position, uDepth, 1);
    vPosition3D = position3D.xyz / position3D.w;
    gl_Position = vec4(position, 0, 1);
}

// #part /glsl/shaders/renderers/DOS/integrate/fragment

#version 300 es
precision mediump float;
precision mediump sampler2D;
precision mediump sampler3D;

uniform sampler3D uVolume;
uniform sampler2D uTransferFunction;

uniform sampler2D uColor;
uniform sampler2D uOcclusion;
uniform sampler2D uOcclusionSamples;

uniform float uExtinction;
uniform float uSliceDistance;
uniform vec2 uOcclusionScale;
uniform uint uOcclusionSamplesCount;

in vec2 vPosition2D;
in vec3 vPosition3D;

layout (location = 0) out vec4 oColor;
layout (location = 1) out float oOcclusion;

vec4 sampleVolumeColor(vec3 position) {
    vec2 volumeSample = texture(uVolume, position).rg;
    vec4 transferSample = texture(uTransferFunction, volumeSample);
    return transferSample;
}

float calculateOcclusion(float extinction) {
    float occlusion = 0.0;
    for (uint i = 0u; i < uOcclusionSamplesCount; i++) {
        vec2 occlusionSampleOffset = texelFetch(uOcclusionSamples, ivec2(i, 0), 0).rg;
        vec2 occlusionSamplePosition = vPosition2D + occlusionSampleOffset * uOcclusionScale;
        occlusion += texture(uOcclusion, occlusionSamplePosition).r;
    }
    return (occlusion / float(uOcclusionSamplesCount)) * exp(-extinction * uSliceDistance);
}

void main() {
    vec4 prevColor = texture(uColor, vPosition2D);
    float prevOcclusion = texture(uOcclusion, vPosition2D).r;

    if (any(greaterThan(vPosition3D, vec3(1))) || any(lessThan(vPosition3D, vec3(0)))) {
        oColor = prevColor;
        oOcclusion = prevOcclusion;
    } else {
        vec4 transferSample = sampleVolumeColor(vPosition3D);
        float extinction = transferSample.a * uExtinction;
        float alpha = 1.0 - exp(-extinction * uSliceDistance);
        vec3 color = transferSample.rgb * prevOcclusion * alpha;
        oColor = prevColor + vec4(color * (1.0 - prevColor.a), alpha);
        oColor.a = min(oColor.a, 1.0);
        oOcclusion = calculateOcclusion(extinction);
    }
}

// #part /glsl/shaders/renderers/DOS/render/vertex

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

// #part /glsl/shaders/renderers/DOS/render/fragment

#version 300 es
precision mediump float;

uniform mediump sampler2D uAccumulator;

in vec2 vPosition;

out vec4 oColor;

void main() {
    vec4 color = texture(uAccumulator, vPosition);
    oColor = mix(vec4(1), vec4(color.rgb, 1), color.a);
}

// #part /glsl/shaders/renderers/DOS/reset/vertex

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

// #part /glsl/shaders/renderers/DOS/reset/fragment

#version 300 es
precision mediump float;

layout (location = 0) out vec4 oColor;
layout (location = 1) out float oOcclusion;

void main() {
    oColor = vec4(0);
    oOcclusion = 1.0;
}
