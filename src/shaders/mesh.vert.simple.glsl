precision mediump float;

#define PI 3.1415926535897932384626433832795
attribute vec3 a_pos;
attribute float a_data;
// attribute vec4 a_color;

uniform vec2 u_minmax;
// uniform float worldSize;


uniform mat4 u_matrix;
uniform mat4 v_matrix;
    
// varying vec4 vColor;
varying float fValue;


float divider = 1.0 / abs(u_minmax[1]-u_minmax[0]);

void main() {
  // gl_Position = u_matrix * v_matrix * vec4(a_pos, 1.0);
  gl_Position = u_matrix * v_matrix * vec4(a_pos, 1.0);
  
  // vColor = a_color;
  
  fValue = (a_data-u_minmax[0]) * divider ;
}