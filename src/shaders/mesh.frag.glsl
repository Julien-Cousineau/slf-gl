precision mediump float;

uniform sampler2D u_color_ramp;

// varying vec4 vColor;
varying float fValue;

const float divider = 5.0;
const float scale = 1.0 / divider;

void main() {
  // gl_FragColor =  vColor;
  // gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);

  // color ramp is encoded in a 16x16 texture
  float color = floor(fValue * divider) * scale;
  vec2 ramp_pos = vec2(
        fract(32.0 * color),
        floor(32.0 * color) / 32.0);
  
  gl_FragColor = texture2D(u_color_ramp, ramp_pos);
}