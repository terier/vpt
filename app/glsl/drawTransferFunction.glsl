%%drawTransferFunction:vertex

#version 300 es
precision mediump float;

in vec2 aPosition;
out vec2 vPosition;

void main() {
    vPosition = aPosition * 0.5 + 0.5;
    gl_Position = vec4(aPosition, 0.0, 1.0);
}

%%drawTransferFunction:fragment

#version 300 es
precision mediump float;

#define NBUMPS @NBUMPS

struct Bump {
    vec2 position;
    vec2 size;
    vec4 color;
};

uniform Bump uBumps[NBUMPS];

in vec2 vPosition;
out vec4 oColor;

void main() {
    vec4 color = vec4(0.0);
    for (int i = 0; i < NBUMPS; i++) {
        Bump b = uBumps[i];
        float x = length((b.position - vPosition) / b.size);
        b.color.a *= exp(-x * x);
        b.color.rgb *= b.color.a;
        color += b.color * (1.0 - color.a);
    }
    oColor = color;
}
