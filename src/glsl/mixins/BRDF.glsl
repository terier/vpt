// #package glsl/mixins

// #section BRDF

vec3 F_Schlick(vec3 f0, vec3 f90, float VdotH) {
    return f0 + (f90 - f0) * pow(clamp(1.0 - VdotH, 0.0, 1.0), 5.0);
}

vec3 BRDF_lambertian(vec3 f0, vec3 f90, vec3 diffuseColor, float specularWeight, float VdotH) {
    return (1.0 - specularWeight * F_Schlick(f0, f90, VdotH)) * diffuseColor;
    //    return (1.0 - specularWeight * F_Schlick(f0, f90, VdotH)) * (diffuseColor / M_PI);
}

float clampedDot(vec3 x, vec3 y) {
    return clamp(dot(x, y), 0.0, 1.0);
}

float V_GGX(float NdotL, float NdotV, float alphaRoughness) {
    float alphaRoughnessSq = alphaRoughness * alphaRoughness;

    float GGXV = NdotL * sqrt(NdotV * NdotV * (1.0 - alphaRoughnessSq) + alphaRoughnessSq);
    float GGXL = NdotV * sqrt(NdotL * NdotL * (1.0 - alphaRoughnessSq) + alphaRoughnessSq);

    float GGX = GGXV + GGXL;
    if (GGX > 0.0)
    {
        return 0.5 / GGX;
    }
    return 0.0;
}

float D_GGX(float NdotH, float alphaRoughness) {
    float alphaRoughnessSq = alphaRoughness * alphaRoughness;
    float f = (NdotH * NdotH) * (alphaRoughnessSq - 1.0) + 1.0;
    return alphaRoughnessSq / (M_PI * f * f);
}


vec3 BRDF_specularGGX(vec3 f0, vec3 f90, float alphaRoughness, float specularWeight, float VdotH, float NdotL, float NdotV, float NdotH) {
    vec3 F = F_Schlick(f0, f90, VdotH);
    float Vis = V_GGX(NdotL, NdotV, alphaRoughness);
    float D = D_GGX(NdotH, alphaRoughness);

    return specularWeight * F * Vis * D;
    //    return F;
}

vec3 BRDF(vec3 pos, vec3 diffuseColor, vec3 f0, vec3 f90, float specularWeight, float alphaRoughness, mat4 uMvpInverseMatrix, vec3 n, vec3 light) {
    vec3 intensity = vec3(1.0, 1.0, 1.0);

    vec4 cameraLoc = vec4(0, 0, -1.0, 1.0);
    vec4 cameraDirty = uMvpInverseMatrix * cameraLoc;
    vec3 cameraPosition = cameraDirty.xyz / cameraDirty.w;

    vec3 l = normalize(-light);   // Direction from surface point to light
    vec3 v = normalize(cameraPosition - pos);
    vec3 h = normalize(l + v);          // Direction of the vector between l and v, called halfway vector
    float VdotH = clampedDot(v, h);
    float NdotL = clampedDot(n, l);
    float NdotV = clampedDot(n, v);
    float NdotH = clampedDot(n, h);

    vec3 diffuse = intensity * NdotL *  BRDF_lambertian(f0, f90, diffuseColor, specularWeight, VdotH);
    vec3 specular = intensity * NdotL *
    BRDF_specularGGX(f0, f90, alphaRoughness, specularWeight, VdotH, NdotL, NdotV, NdotH);
    return diffuse + specular;
}