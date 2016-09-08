#version 300 es
precision mediump float;

uniform mediump sampler3D uVolume;

in vec4 vRayOrigin;
in vec4 vRayDirection;
out vec4 color;

vec2 intersectCube(vec3 origin, vec3 direction) {
    vec3 tmin = (vec3(-1.0) - origin) / direction;
    vec3 tmax = (vec3(1.0) - origin) / direction;
    vec3 t1 = min(tmin, tmax);
    vec3 t2 = max(tmin, tmax);
    float tnear = max(max(t1.x, t1.y), t1.z);
    float tfar = min(min(t2.x, t2.y), t2.z);
    return vec2(tnear, tfar);
}

void main() {
    //color = vec4(normalize(vRayOrigin.xyz), 1.0);
    vec2 t = max(intersectCube(vRayOrigin.xyz, vRayDirection.xyz), 0.0);
    if (t.x < t.y) {
        color = vec4((t.y - t.x) * 3.0, 0.0, 0.0, 1.0);
    } else {
        color = vec4(0.0, 1.0, 0.0, 1.0);
    }

    //t.x = min(t.x, t.y);
    //float val = 0.0;
    //float tt = 0.0;
    //do {
    //    vec3 pos = vRayOrigin.xyz + vRayDirection.xyz * mix(t.x, t.y, tt);
    //    val = max(val, texture(uVolume, pos).r);
    //    tt += 0.02;
    //} while (tt < 1.0);
    ////color = vec4(1.0 - val, 1.0 - val, 1.0 - val, 1.0);
    //color = vec4(val, val, val, 1.0);
}