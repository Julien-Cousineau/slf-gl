attribute vec3 a_pos;
attribute float a_data;
// attribute vec4 a_color;

uniform vec2 u_minmax;


uniform mat4 u_matrix;
uniform mat4 v_matrix;
    
// varying vec4 vColor;
varying float fValue;

void main() {
  gl_Position = u_matrix * v_matrix * vec4(a_pos, 1.0);
 
  // vColor = a_color;
  
  fValue = (a_data-u_minmax[0]) / u_minmax[1];
}