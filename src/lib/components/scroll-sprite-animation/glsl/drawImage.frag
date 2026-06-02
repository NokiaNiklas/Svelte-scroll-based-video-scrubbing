#version 300 es
precision mediump float;

in vec2 v_texcoord;

uniform sampler2D u_texture;

out vec4 outColor;

void main() {
    /*vec2 distance = vec2(0.0002, 0.0002);

    vec4 color = texture(u_texture, v_texcoord) * 0.2;
    color += texture(u_texture, v_texcoord + vec2(1, 0) * distance) * 0.2;
    color += texture(u_texture, v_texcoord + vec2(0, 1) * distance) * 0.2;
    color += texture(u_texture, v_texcoord + vec2(-1, 0) * distance) * 0.2;
    color += texture(u_texture, v_texcoord + vec2(0, -1) * distance) * 0.2;

    outColor = color;*/
    outColor = texture(u_texture, v_texcoord);
}