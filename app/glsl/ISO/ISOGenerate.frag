#version 300 es
precision mediump float;

uniform mediump sampler3D uVolume;
uniform float uStepSize;
uniform float uOffset;
uniform float uIsovalue;

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

        float t = 0.0;
        float closest = 2.0; // anything > 1.0
        float offset = uOffset;
        vec3 pos;
        do {
            pos = mix(from, to, offset);
            if (texture(uVolume, pos).r > uIsovalue) {
                closest = min(offset, closest);
            }
            t += uStepSize;
            offset = mod(offset + uStepSize, 1.0);
        } while (t < 1.0);

        if (closest < 1.0) {
            pos = mix(from, to, closest);
            float h = 0.005;
            float vxm = texture(uVolume, pos + vec3(-h, 0.0, 0.0)).r;
            float vxp = texture(uVolume, pos + vec3( h, 0.0, 0.0)).r;
            float vym = texture(uVolume, pos + vec3(0.0, -h, 0.0)).r;
            float vyp = texture(uVolume, pos + vec3(0.0,  h, 0.0)).r;
            float vzm = texture(uVolume, pos + vec3(0.0, 0.0, -h)).r;
            float vzp = texture(uVolume, pos + vec3(0.0, 0.0,  h)).r;
            float dx = (vxp - vxm) / (2.0 * h);
            float dy = (vyp - vym) / (2.0 * h);
            float dz = (vzp - vzm) / (2.0 * h);
            vec3 grad = normalize(vec3(dx, dy, dz));
            vec3 gradEncoded = grad * 0.5 + 0.5;
            color = vec4(gradEncoded, closest);
        } else {
            color = vec4(0.0, 0.0, 0.0, 1.0);
        }
    }
}
