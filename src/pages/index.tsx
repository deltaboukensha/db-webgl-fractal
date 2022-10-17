import React, { useState } from "react";
import quadVertexShaderSource from "../shaders/quad.vert";
import quadFragmentShaderSource from "../shaders/quad.frag";
import fractalFragmentShaderSource from "../shaders/fractal.frag";

const useWebGl = (initFunction, updateFunction, dependencies) => {
  const ref = React.useRef();

  React.useEffect(() => {
    initFunction(ref.current);
  }, []);

  React.useEffect(() => {
    updateFunction(ref.current);
  }, dependencies);

  return ref;
};

const initGame = (canvas: HTMLCanvasElement) => {
  const gl = canvas.getContext("webgl2");
  if(!gl) throw "gl is not supported";

  const loadShaderVertex = (sourceCode: string) => {
    const shader = gl.createShader(gl.VERTEX_SHADER);
    if(!shader) throw "could not create shader";

    gl.shaderSource(shader, sourceCode);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      throw gl.getShaderInfoLog(shader);
    }

    return shader;
  };

  const loadShaderFragment = (sourceCode: string) => {
    const shader = gl.createShader(gl.FRAGMENT_SHADER);
    if(!shader) throw "could not create shader";

    gl.shaderSource(shader, sourceCode);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      throw gl.getShaderInfoLog(shader);
    }

    return shader;
  };

  const loadShaderProgram = (
    vertexShader: WebGLShader,
    fragmentShader: WebGLShader
  ) => {
    const shaderProgram = gl.createProgram();
    if(!shaderProgram) throw "could not create program";

    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
      throw gl.getProgramInfoLog(shaderProgram);
    }

    return shaderProgram;
  };

  const getProgramAttribute = (program: WebGLProgram, key: string) => {
    const v = gl.getAttribLocation(program, key);
    if (v < 0) throw `could not get attribute for program with key: ${key}`;
    return v;
  };

  const getUniformLocation = (program: WebGLProgram, key: string) => {
    const v = gl.getUniformLocation(program, key);
    if (!v) throw `could not get uniform location for program with key: ${key}`;
    return v;
  };

  const loadBufferVertices = (dataVertices: number[]) => {
    const buffer = gl.createBuffer();
    if(!buffer) throw "could not create glBufferVertices";

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array(dataVertices),
      gl.STATIC_DRAW
    );

    return buffer;
  }

  const loadBufferIndices = (dataIndices: number[]) => {
    const buffer = gl.createBuffer();
    if(!buffer) throw "could not create glBufferIndices";

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ELEMENT_ARRAY_BUFFER,
      new Uint16Array(dataIndices),
      gl.STATIC_DRAW
    );

    return buffer;
  }

  const loadModelQuad = () => {
    const dataVertices = [-1, -1, +1, -1, -1, +1, +1, +1];
    const dataIndices = [0, 2, 1, 3, 2, 1];
    const model = {
      bufferIndices: loadBufferIndices(dataIndices),
      bufferVertices: loadBufferVertices(dataVertices),
      dataIndices,
      dataVertices,
    };
    return model;
  };

  const quad = {
    ...loadModelQuad(),
    vertexShader: loadShaderVertex(quadVertexShaderSource()),
    fragmentShader: loadShaderFragment(fractalFragmentShaderSource()),
  }

  const shaderProgram = loadShaderProgram(
    quad.vertexShader,
    quad.fragmentShader,
  );

  const vertexAttribute = getProgramAttribute(
    shaderProgram,
    "vertex"
  );

  const uniformElapsedTime = getUniformLocation(
    shaderProgram,
    "elapsedTime"
  );

  const startTime = Date.now();

  const updateAnimation = () => {

  }

  const renderFrame = () => {
    const elapsedTime = Date.now() - startTime;
    gl.useProgram(shaderProgram);

    gl.uniform1ui(uniformElapsedTime, elapsedTime);

    gl.bindBuffer(gl.ARRAY_BUFFER, quad.bufferVertices);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, quad.bufferIndices);

    gl.vertexAttribPointer(vertexAttribute, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vertexAttribute);

    gl.drawElements(
      gl.TRIANGLES,
      quad.dataIndices.length,
      gl.UNSIGNED_SHORT,
      0
    );
  }

  const renderLoop = () => {
    updateAnimation();
    renderFrame();
    window.requestAnimationFrame(renderLoop);
  };

  renderLoop();
}

const IndexPage = () => {
  const ref = useWebGl(
    initGame,
    (canvas: HTMLCanvasElement) => {
      // todo update arguments from react
    },
    []
  );
  const canvasWidth = 512;
  const canvasHeight = 512;
  return <>
    <title>WebGL - Fractal</title>
    <canvas ref={ref} width={canvasWidth} height={canvasHeight}></canvas>
  </>
};

export default IndexPage;