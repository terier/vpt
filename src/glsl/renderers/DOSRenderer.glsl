// #package glsl/shaders

// #section DOSIntegrate/vertex

#version 300 es
precision mediump float;

uniform mat4 uMvpInverseMatrix;
uniform float uDepth;

layout (location = 0) in vec2 aPosition;

out vec2 vPosition2D;
out vec3 vPosition3D;

void main() {
    vec4 dirty = uMvpInverseMatrix * vec4(aPosition, uDepth, 1);
    vPosition3D = dirty.xyz / dirty.w;
    vPosition2D = aPosition * 0.5 + 0.5;
    gl_Position = vec4(aPosition, 0, 1);
}

// #section DOSIntegrate/fragment

#version 300 es
precision mediump float;
precision mediump sampler2D;
precision mediump usampler3D;

uniform usampler3D uVolume;
uniform sampler2D uTransferFunction;

uniform sampler2D uColor;
uniform sampler2D uOcclusion;

uniform float uVisibility;
uniform float uDepth;

uniform vec2 uOcclusionScale;
uniform float uOcclusionDecay;

in vec2 vPosition2D;
in vec3 vPosition3D;

layout (location = 0) out vec4 oColor;
layout (location = 1) out float oOcclusion;

vec4 getSample(vec3 position) {
    uvec4 volumeSample = texture(uVolume, position);
    uint header = volumeSample.r;
    uint id = volumeSample.g;
    uint value = volumeSample.b;

    if (float(id) / 255.0 < uVisibility) {
        return texture(uTransferFunction, vec2(float(value) / 255.0, 0));
    }
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
        vec4 transferSample = getSample(vPosition3D);
        transferSample.rgb *= transferSample.a * occlusion;

        oColor = prevColor + transferSample * (1.0 - prevColor.a);
        // TODO: do this calculation right
        oOcclusion = 1.0 - ((1.0 - (occlusion - transferSample.a)) * uOcclusionDecay);
    }
}

// #section DOSRender/vertex

#version 300 es
precision mediump float;

layout (location = 0) in vec2 aPosition;
out vec2 vPosition;

void main() {
    vPosition = (aPosition + 1.0) * 0.5;
    gl_Position = vec4(aPosition, 0.0, 1.0);
}

// #section DOSRender/fragment

#version 300 es
precision mediump float;

uniform mediump sampler2D uAccumulator;

in vec2 vPosition;
out vec4 oColor;

void main() {
    vec4 color = texture(uAccumulator, vPosition);
    oColor = mix(vec4(1), vec4(color.rgb, 1), color.a);
}

// #section DOSReset/vertex

#version 300 es
precision mediump float;

layout (location = 0) in vec2 aPosition;

void main() {
    gl_Position = vec4(aPosition, 0.0, 1.0);
}

// #section DOSReset/fragment

#version 300 es
precision mediump float;

layout (location = 0) out vec4 oColor;
layout (location = 1) out float oOcclusion;

void main() {
    oColor = vec4(0, 0, 0, 0);
    oOcclusion = 1.0;
}
