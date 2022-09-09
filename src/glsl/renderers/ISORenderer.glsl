// #part /glsl/shaders/renderers/ISO/generate/vertex

#version 300 es
precision mediump float;

uniform mat4 uMvpInverseMatrix;

layout (location = 0) in vec2 aPosition;

out vec3 vRayFrom;
out vec3 vRayTo;

// #link /glsl/mixins/unproject
@unproject

void main() {
    unproject(aPosition, uMvpInverseMatrix, vRayFrom, vRayTo);
    gl_Position = vec4(aPosition, 0, 1);
}

// #part /glsl/shaders/renderers/ISO/generate/fragment

#version 300 es
precision mediump float;

uniform mediump sampler3D uVolume;
uniform mediump sampler2D uTransferFunction;
uniform uint uSteps;
uniform float uOffset;
uniform float uIsovalue;

in vec3 vRayFrom;
in vec3 vRayTo;

out vec4 oClosest;

// #link /glsl/mixins/intersectCube
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
        oClosest = vec4(-1);
        return;
    }

    vec4 from = vec4(mix(vRayFrom, vRayTo, tbounds.x), tbounds.x);
    vec4 to = vec4(mix(vRayFrom, vRayTo, tbounds.y), tbounds.y);

    float stepSize = 1.0 / float(uSteps);
    float t = 1.0 - uOffset * stepSize;
    vec4 closest = vec4(-1);
    for (uint i = 0u; i < uSteps; i++) {
        vec3 position = mix(from.xyz, to.xyz, t);
        float value = sampleVolumeColor(position).a;
        if (value >= uIsovalue) {
            closest = vec4(position, t);
        }
        t -= stepSize;
    }

    oClosest = closest;
}

// #part /glsl/shaders/renderers/ISO/integrate/vertex

#version 300 es
precision mediump float;

layout (location = 0) in vec2 aPosition;

out vec2 vPosition;

void main() {
    vPosition = aPosition * 0.5 + 0.5;
    gl_Position = vec4(aPosition, 0, 1);
}

// #part /glsl/shaders/renderers/ISO/integrate/fragment

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

// #part /glsl/shaders/renderers/ISO/render/vertex

#version 300 es
precision mediump float;

layout (location = 0) in vec2 aPosition;

out vec2 vPosition;

void main() {
    vPosition = aPosition * 0.5 + 0.5;
    gl_Position = vec4(aPosition, 0, 1);
}

// #part /glsl/shaders/renderers/ISO/render/fragment

#version 300 es
precision mediump float;

uniform mediump sampler2D uClosest;
uniform mediump sampler3D uVolume;
uniform mediump sampler2D uTransferFunction;
uniform vec3 uLight;
uniform vec3 uDiffuse;
uniform float uGradientStep;

in vec2 vPosition;

out vec4 oColor;

vec4 sampleVolumeColor(vec3 position) {
    vec2 volumeSample = texture(uVolume, position).rg;
    vec4 transferSample = texture(uTransferFunction, volumeSample);
    return transferSample;
}

vec3 gradient(vec3 pos, float h) {
    vec3 positive = vec3(
        sampleVolumeColor(pos + vec3( h,  0,  0)).a,
        sampleVolumeColor(pos + vec3( 0,  h,  0)).a,
        sampleVolumeColor(pos + vec3( 0,  0,  h)).a
    );
    vec3 negative = vec3(
        sampleVolumeColor(pos + vec3(-h,  0,  0)).a,
        sampleVolumeColor(pos + vec3( 0, -h,  0)).a,
        sampleVolumeColor(pos + vec3( 0,  0, -h)).a
    );
    return (positive - negative) / (2.0 * h);
}

void main() {
    vec4 closest = texture(uClosest, vPosition);

    if (closest.w > 0.0) {
        vec3 pos = closest.xyz;
        vec3 normal = normalize(gradient(pos, uGradientStep));
        vec3 light = normalize(uLight);
        float lambert = max(dot(normal, light), 0.0);
        vec3 material = sampleVolumeColor(pos).rgb;
        oColor = vec4(uDiffuse * material * lambert, 1);
    } else {
        oColor = vec4(1);
    }
}

// #part /glsl/shaders/renderers/ISO/reset/vertex

#version 300 es
precision mediump float;

layout (location = 0) in vec2 aPosition;

void main() {
    gl_Position = vec4(aPosition, 0, 1);
}

// #part /glsl/shaders/renderers/ISO/reset/fragment

#version 300 es
precision mediump float;

out vec4 oClosest;

void main() {
    oClosest = vec4(-1);
}
