const source = () => `#version 300 es
precision mediump float;
in vec2 st;
out vec4 fragment;
uniform uint elapsedTime;
#define M_PI 3.1415926535897932384626433832795

void main() {
  float et = mod(float(elapsedTime) * 0.001f, 1.0);
  float d = abs(abs(st.s) - et);
  fragment = vec4(d, 0, 0, 1);
}
`;

export default source;
