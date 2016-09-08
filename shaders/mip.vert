#version 300 es
precision mediump float;

uniform mat4 uMMatrix;
uniform mat4 uVMatrix;
uniform mat4 uPMatrix;

in vec2 aPosition;
out vec4 vRayOrigin;
out vec4 vRayDirection;

void main() {
    mat4 transform = inverse(uPMatrix);
    vec4 nearPosition = vec4(aPosition, -1.0, 1.0);
    vec4 farPosition = vec4(aPosition, 1.0, 1.0);
    vec4 origin = transform * nearPosition;
    vec4 destination = transform * farPosition;
    origin /= origin.w;
    destination /= destination.w;
    vec4 direction = destination - origin;

    vRayOrigin = origin;
    vRayDirection = direction;
    gl_Position = vec4(aPosition, 0.0, 1.0);
}