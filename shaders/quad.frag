#version 300 es
precision mediump float;

uniform mediump sampler2D uTexture;

in vec2 vFragmentPosition;
out vec4 color;

void main() {
	color = texture(uTexture, vFragmentPosition);
}