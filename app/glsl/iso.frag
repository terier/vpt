#version 300 es
precision mediump float;

uniform mediump sampler3D uVolume;
uniform float uSamplingStep;
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
    vec3 from = mix(vRayFrom, vRayTo, tbounds.x);
    vec3 to = mix(vRayFrom, vRayTo, tbounds.y);
    vec3 pos = from;
    vec3 posDelta = (to - from) * uSamplingStep;
    do {
        val = texture(uVolume, pos).r;
        pos += posDelta;
        t += uSamplingStep;
    } while (val < uIsovalue && t < 1.0);

    float h = 0.005;
    if (t >= 1.0) {
        color = vec4(0.0);
    } else {
        vec3 pos = mix(vRayFrom, vRayTo, mix(tbounds.x, tbounds.y, t));
        float vxm = texture(uVolume, pos + vec3(-h, 0.0, 0.0)).r;
        float vxp = texture(uVolume, pos + vec3( h, 0.0, 0.0)).r;
        float vym = texture(uVolume, pos + vec3(0.0, -h, 0.0)).r;
        float vyp = texture(uVolume, pos + vec3(0.0,  h, 0.0)).r;
        float vzm = texture(uVolume, pos + vec3(0.0, 0.0, -h)).r;
        float vzp = texture(uVolume, pos + vec3(0.0, 0.0,  h)).r;
        float dx = (vxp - vxm) / (2.0 * h);
        float dy = (vyp - vym) / (2.0 * h);
        float dz = (vzp - vzm) / (2.0 * h);
        vec3 normal = normalize(vec3(dx, dy, dz));
        vec3 light = normalize(vec3(1.0, 1.0, 1.0));
        float lambert = max(dot(normal, light), 0.0);
        vec3 diffuse = vec3(1.0, 0.0, 0.0);
        color = vec4(diffuse * lambert, 1.0);
    }
}
