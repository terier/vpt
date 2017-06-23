#version 300 es
precision mediump float;

uniform mediump sampler2D uAccumulator;
uniform vec3 uLight;
uniform vec3 uDiffuse;

in vec2 vPosition;
out vec4 color;

void main() {
    vec4 acc = texture(uAccumulator, vPosition);
    vec3 grad = (acc.xyz - 0.5) * 2.0;
    float closest = acc.w;

    if (closest < 1.0) {
        vec3 normal = normalize(grad);
        vec3 light = normalize(uLight);
        float lambert = max(dot(normal, light), 0.0);
        color = vec4(uDiffuse * lambert, 1.0);
    } else {
        color = vec4(1.0);
    }
}
