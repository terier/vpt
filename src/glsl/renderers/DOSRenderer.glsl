// #part /glsl/shaders/renderers/DOS/integrate/vertex

#version 300 es

uniform mat4 uMvpInverseMatrix;
uniform mediump float uDepth;

layout (location = 0) in vec2 aPosition;

out vec2 vPosition2D;
out vec3 vPosition3D;

void main() {
    vec4 dirty = uMvpInverseMatrix * vec4(aPosition, uDepth, 1);
    vPosition3D = dirty.xyz / dirty.w;
    vPosition2D = aPosition * 0.5 + 0.5;
    gl_Position = vec4(aPosition, 0, 1);
}

// #part /glsl/shaders/renderers/DOS/integrate/fragment

#version 300 es
precision mediump float;

uniform mediump sampler3D uVolume;
uniform mediump sampler2D uTransferFunction;

uniform mediump sampler2D uColor;
uniform mediump sampler2D uOcclusion;

uniform float uDepth;

uniform vec2 uOcclusionScale;
uniform float uOcclusionDecay;

in vec2 vPosition2D;
in vec3 vPosition3D;

layout (location = 0) out vec4 oColor;
layout (location = 1) out float oOcclusion;

vec4 sampleVolumeColor(vec3 position) {
    vec2 volumeSample = texture(uVolume, position).rg;
    vec4 transferSample = texture(uTransferFunction, volumeSample);
    return transferSample;
}

void main() {
    const vec2 offsets[9] = vec2[](
        vec2(-1, -1),
        vec2( 0, -1),
        vec2( 1, -1),
        vec2(-1,  0),
        vec2( 0,  0),
        vec2( 1,  0),
        vec2(-1,  1),
        vec2( 0,  1),
        vec2( 1,  1)
    );

    const float weights[9] = float[](
        1.0 / 16.0, 2.0 / 16.0, 1.0 / 16.0,
        2.0 / 16.0, 4.0 / 16.0, 2.0 / 16.0,
        1.0 / 16.0, 2.0 / 16.0, 1.0 / 16.0
    );

    float occlusion = 0.0;
    for (int i = 0; i < 9; i++) {
        vec2 occlusionPos = vPosition2D + offsets[i] * uOcclusionScale / uDepth;
        occlusion += texture(uOcclusion, occlusionPos).r * weights[i];
    }

    vec4 prevColor = texture(uColor, vPosition2D);

    if (any(greaterThan(vPosition3D, vec3(1))) || any(lessThan(vPosition3D, vec3(0)))) {
        oColor = prevColor;
        oOcclusion = occlusion;
    } else {
        vec4 transferSample = sampleVolumeColor(vPosition3D);
        transferSample.rgb *= transferSample.a * occlusion;

        oColor = prevColor + transferSample * (1.0 - prevColor.a);
        // TODO: do this calculation right
        oOcclusion = 1.0 - ((1.0 - (occlusion - transferSample.a)) * uOcclusionDecay);
    }
}

// #part /glsl/shaders/renderers/DOS/render/vertex

#version 300 es

layout (location = 0) in vec2 aPosition;
out vec2 vPosition;

void main() {
    vPosition = (aPosition + 1.0) * 0.5;
    gl_Position = vec4(aPosition, 0.0, 1.0);
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

layout (location = 0) in vec2 aPosition;

void main() {
    gl_Position = vec4(aPosition, 0.0, 1.0);
}

// #part /glsl/shaders/renderers/DOS/reset/fragment

#version 300 es
precision mediump float;

layout (location = 0) out vec4 oColor;
layout (location = 1) out float oOcclusion;

void main() {
    oColor = vec4(0, 0, 0, 0);
    oOcclusion = 1.0;
}
