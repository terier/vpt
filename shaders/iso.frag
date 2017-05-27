#version 300 es
precision mediump float;

uniform mediump sampler3D uVolume;
uniform float uIsovalue;

in vec3 vRayFrom;
in vec3 vRayTo;
out vec4 color;

@intersectCube

void main() {
    vec3 rayDirection = vRayTo - vRayFrom;
    vec2 tbounds = max(intersectCube(vRayFrom, rayDirection), 0.0);
    if (tbounds.x >= tbounds.y) {
        discard;
    }
    float val = 0.0;
    float t = 0.0;
    do {
        vec3 pos = mix(vRayFrom, vRayTo, mix(tbounds.x, tbounds.y, t));
        val = max(val, texture(uVolume, pos).r);
        t += 0.01;
    } while (val < uIsovalue && t < 1.0);
    if (t >= 1.0) {
        color = vec4(0.0);
    } else {
        color = vec4(1.0, 0.0, 0.0, 1.0);
    }
}
