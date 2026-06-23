"use client";

import React, { useEffect, useRef } from "react";

const vertexShaderSource = `
  attribute vec2 position;
  void main() {
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

const fragmentShaderSource = `
  precision mediump float;
  uniform vec2 u_resolution;
  uniform float u_time;
  uniform vec2 u_mouse;

  float hash(float n) { return fract(sin(n) * 43758.5453123); }
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }

  float getChar(vec2 uv, float seed) {
      float val = hash(seed);
      uv = uv * 2.0 - 1.0;
      
      // Bracket [ or ]
      if (val < 0.15) {
          float border = step(0.6, abs(uv.x)) * step(abs(uv.y), 0.8);
          float caps = step(0.8, abs(uv.y)) * step(uv.x * (val < 0.075 ? 1.0 : -1.0), 0.6) * step(-0.6, uv.x * (val < 0.075 ? 1.0 : -1.0));
          return max(border, caps);
      }
      // Curly brace { or }
      else if (val < 0.30) {
          float center = step(0.0, uv.y) * step(uv.y, 0.1) * step(abs(uv.x), 0.7);
          float vertical = step(abs(uv.x), 0.15) * step(abs(uv.y), 0.7);
          float tip = step(abs(uv.y), 0.15) * step(uv.x * (val < 0.225 ? 1.0 : -1.0), 0.6) * step(0.0, uv.x * (val < 0.225 ? 1.0 : -1.0));
          return max(vertical, max(center, tip));
      }
      // Equal / Operators
      else if (val < 0.45) {
          float line1 = step(abs(uv.y - 0.2), 0.08) * step(abs(uv.x), 0.6);
          float line2 = step(abs(uv.y + 0.2), 0.08) * step(abs(uv.x), 0.6);
          return max(line1, line2);
      }
      // Binary numbers 0 or 1
      else if (val < 0.70) {
          if (hash(seed + 1.0) < 0.5) {
              float outer = step(abs(uv.x), 0.45) * step(abs(uv.y), 0.65);
              float inner = step(abs(uv.x), 0.2) * step(abs(uv.y), 0.4);
              return outer - inner;
          } else {
              return step(abs(uv.x), 0.12) * step(abs(uv.y), 0.65);
          }
      }
      // Horizontal simulated code bar
      else {
          return step(abs(uv.y), 0.25) * step(abs(uv.x), 0.85);
      }
  }

  void main() {
      vec2 uv = gl_FragCoord.xy / u_resolution.xy;
      
      float aspect = u_resolution.x / u_resolution.y;
      vec2 gridUV = uv;
      gridUV.x *= aspect;
      
      // Split the layout into grid coordinates (columns falling down)
      vec2 grid = vec2(30.0 * aspect, 30.0);
      vec2 ipos = floor(gridUV * grid);
      vec2 fpos = fract(gridUV * grid);
      
      // Assign individual flow speed per column
      float colSpeed = hash(ipos.x) * 1.0 + 0.4;
      float timeScaled = u_time * colSpeed * 1.5;
      
      // Compute vertical offset (falling)
      float rowOffset = floor(timeScaled);
      float yPos = ipos.y + rowOffset;
      
      // Distinct random char seed for cells
      float charSeed = hash(vec2(ipos.x, yPos));
      
      // Calculate flow column gradients
      float colOffset = hash(ipos.x + 13.0) * 10.0;
      float flow = fract((gridUV.y - u_time * 0.07 * colSpeed + colOffset) * 0.45);
      
      // Leading edge glow
      float headGlow = smoothstep(0.9, 1.0, flow);
      
      // Render character shape
      float char = getChar(fpos, charSeed);
      
      // Signal Yellow color palette: #FFD400 => RGB(1.0, 0.831, 0.0)
      vec3 sapphire = vec3(1.0, 0.831, 0.0);
      
      // Mix core flow stream color
      vec3 finalColor = sapphire * flow * char * 0.95;
      
      // Add brilliant leading edge glow
      finalColor += vec3(1.0, 0.94, 0.6) * headGlow * char * 1.6;
      
      // Track mouse position coordinate for interactive cursor glow
      vec2 mouseUV = u_mouse / u_resolution;
      float distToMouse = distance(uv, mouseUV);
      float mouseGlow = smoothstep(0.25, 0.0, distToMouse) * 0.2;
      finalColor += sapphire * mouseGlow;
      
      // Dynamic vertical scanline pulse
      float pulse = sin(u_time * 2.5) * 0.5 + 0.5;
      float cursorLine = step(0.993, sin(uv.y * 12.0 - u_time * 0.5)) * pulse * 0.08;
      finalColor += sapphire * cursorLine;
      
      // Subtle editor grid line details
      float gridBorder = step(0.975, fpos.x) + step(0.975, fpos.y);
      finalColor += sapphire * gridBorder * 0.03;
      
      // Premium corner vignette
      float vignette = uv.x * (1.0 - uv.x) * uv.y * (1.0 - uv.y) * 16.0;
      finalColor *= pow(vignette, 0.3);
      
      gl_FragColor = vec4(finalColor * 0.85, 1.0);
  }
`;

export function TerminalShader() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl");
    if (!gl) {
      console.error("WebGL context initialization failed.");
      return;
    }

    const compileShader = (source: string, type: number): WebGLShader | null => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error("Shader compiling error:", gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vs = compileShader(vertexShaderSource, gl.VERTEX_SHADER);
    const fs = compileShader(fragmentShaderSource, gl.FRAGMENT_SHADER);
    if (!vs || !fs) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error("Program linking error:", gl.getProgramInfoLog(program));
      return;
    }

    gl.useProgram(program);

    const vertices = new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
      -1,  1,
       1, -1,
       1,  1,
    ]);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const positionLoc = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

    const uResolution = gl.getUniformLocation(program, "u_resolution");
    const uTime = gl.getUniformLocation(program, "u_time");
    const uMouse = gl.getUniformLocation(program, "u_mouse");

    let animationId = 0;
    const startTime = Date.now();
    const mouse = { x: 0, y: 0 };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = rect.height - (e.clientY - rect.top);
    };

    window.addEventListener("mousemove", handleMouseMove);

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };

    resize();
    window.addEventListener("resize", resize);

    const render = () => {
      const time = (Date.now() - startTime) / 1000;
      gl.uniform2f(uResolution, canvas.width, canvas.height);
      gl.uniform1f(uTime, time);
      gl.uniform2f(
        uMouse,
        mouse.x * (window.devicePixelRatio || 1),
        mouse.y * (window.devicePixelRatio || 1)
      );

      gl.clearColor(0.02, 0.02, 0.02, 1.0); // Surface lowest base color #050505
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouseMove);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />;
}
