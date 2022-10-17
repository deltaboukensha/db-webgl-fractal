const source = () => `#version 300 es
precision mediump float;
in vec2 st;
out vec4 fragment;
uniform uint elapsedTime;

void main() {
  float i_float = float(elapsedTime);
  fragment = vec4(mod(i_float / 10.0, 1.0), st.t, st.s+st.t, 1);
}
`;

export default source;
