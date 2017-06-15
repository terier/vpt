#version 300 es
precision mediump float;

uniform mediump sampler3D uVolume;
//uniform float uSamplingStep;
uniform float uDistance;

in vec3 vRayFrom;
in vec3 vRayTo;
out vec4 color;

@intersectCube

void main() {
    vec3 rayDirection = vRayTo - vRayFrom;
    vec2 tbounds = max(intersectCube(vRayFrom, rayDirection), 0.0);
    if (tbounds.x >= tbounds.y) {
        color = vec4(0.0, 0.0, 0.0, 1.0);
    } else {
        vec3 from = mix(vRayFrom, vRayTo, tbounds.x);
        vec3 to = mix(vRayFrom, vRayTo, tbounds.y);
        vec3 pos = mix(from, to, uDistance);
        float val = texture(uVolume, pos).r;
        color = vec4(val, val, val, 1.0);
    }
}
