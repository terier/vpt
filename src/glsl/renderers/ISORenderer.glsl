// #part /glsl/shaders/renderers/ISO/generate/vertex

#version 300 es

uniform mat4 uMvpInverseMatrix;

out vec3 vRayFrom;
out vec3 vRayTo;

// #link /glsl/mixins/unproject
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

// #part /glsl/shaders/renderers/ISO/generate/fragment

#version 300 es
precision mediump float;
precision mediump sampler2D;
precision mediump sampler3D;

uniform sampler3D uVolume;
uniform sampler2D uTransferFunction;
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

// #part /glsl/shaders/renderers/ISO/integrate/fragment

#version 300 es
precision mediump float;
precision mediump sampler2D;
precision mediump sampler3D;

uniform sampler2D uAccumulator;
uniform sampler2D uFrame;

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

// #part /glsl/shaders/renderers/ISO/render/fragment

#version 300 es
precision mediump float;
precision mediump sampler2D;
precision mediump sampler3D;

uniform sampler2D uClosest;
uniform sampler3D uVolume;
uniform sampler2D uTransferFunction;
uniform vec3 uLight;
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
        sampleVolumeColor(pos + vec3(h, 0, 0)).a,
        sampleVolumeColor(pos + vec3(0, h, 0)).a,
        sampleVolumeColor(pos + vec3(0, 0, h)).a
    );
    vec3 negative = vec3(
        sampleVolumeColor(pos - vec3(h, 0, 0)).a,
        sampleVolumeColor(pos - vec3(0, h, 0)).a,
        sampleVolumeColor(pos - vec3(0, 0, h)).a
    );
    return (positive - negative) / (2.0 * h);
}

void main() {
    vec4 closest = texture(uClosest, vPosition);

    if (closest.w > 0.0) {
        vec3 pos = closest.xyz;
        vec3 normal = normalize(gradient(pos, uGradientStep));
        float lambert = max(dot(normal, uLight), 0.0);
        vec3 material = sampleVolumeColor(pos).rgb;
        oColor = vec4(material * lambert, 1);
    } else {
        oColor = vec4(1);
    }
}

// #part /glsl/shaders/renderers/ISO/reset/vertex

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

// #part /glsl/shaders/renderers/ISO/reset/fragment

#version 300 es
precision mediump float;

out vec4 oClosest;

void main() {
    oClosest = vec4(-1);
}
