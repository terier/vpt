#version 300 es
precision mediump float;

uniform mediump sampler3D uVolume;
uniform float uSamplingStep;

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
    vec3 from = mix(vRayFrom, vRayTo, tbounds.x);
    vec3 to = mix(vRayFrom, vRayTo, tbounds.y);
    vec3 pos = from;
    vec3 posDelta = (to - from) * uSamplingStep;
    do {
        val = max(val, texture(uVolume, pos).r);
        pos += posDelta;
        t += uSamplingStep;
    } while (t < 1.0);
    color = vec4(0.0, 0.0, 0.0, val);
}
