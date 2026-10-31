import React, { useEffect, useRef } from 'react';

interface FireFloorProps {
  secondsRemaining: number;
  totalDurationSeconds: number;
  isRedAlert?: boolean;
}

export const FireFloor: React.FC<FireFloorProps> = ({
  secondsRemaining,
  totalDurationSeconds,
  isRedAlert = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Calculate elapsed ratio from 0.0 (start) to 1.0 (hackathon end)
  const safeTotal = Math.max(totalDurationSeconds, 1);
  const elapsedRatio = Math.min(Math.max((safeTotal - secondsRemaining) / safeTotal, 0), 1);

  // Height percentage from 10vh baseline up to 100vh full screen coverage
  const heightVh = 10 + Math.pow(elapsedRatio, 1.3) * 90;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl') || (canvas.getContext('experimental-webgl') as WebGLRenderingContext | null);
    if (!gl) return;

    let animId: number;

    const syncSize = () => {
      const w = canvas.clientWidth || window.innerWidth;
      const h = canvas.clientHeight || window.innerHeight;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
    };

    syncSize();
    window.addEventListener('resize', syncSize);

    // Vertex Shader
    const vs = `
      attribute vec2 a_position;
      varying vec2 v_uv;
      void main() {
        v_uv = a_position * 0.5 + 0.5;
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

    // Realistic Fluid Flame Fragment Shader with Fractional Brownian Motion (FBM)
    const fs = `
      precision highp float;
      uniform float u_time;
      uniform vec2 u_resolution;
      uniform float u_progress; // 0.0 to 1.0
      uniform float u_isRed;    // 0.0 or 1.0
      varying vec2 v_uv;

      // Noise generator functions
      vec2 hash(vec2 p) {
        p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
        return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
      }

      float noise(vec2 p) {
        const float K1 = 0.366025404; // (sqrt(3)-1)/2
        const float K2 = 0.211324865; // (3-sqrt(3))/6
        vec2 i = floor(p + (p.x + p.y) * K1);
        vec2 a = p - i + (i.x + i.y) * K2;
        vec2 o = (a.x > a.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        vec2 b = a - o + K2;
        vec2 c = a - 1.0 + 2.0 * K2;
        vec3 h = max(0.5 - vec3(dot(a,a), dot(b,b), dot(c,c)), 0.0);
        vec3 n = h*h*h*h * vec3(dot(a, hash(i)), dot(b, hash(i + o)), dot(c, hash(i + 1.0)));
        return dot(n, vec3(70.0));
      }

      // Fractional Brownian Motion (Multi-octave noise)
      float fbm(vec2 p) {
        float f = 0.0;
        f += 0.5000 * noise(p); p = p * 2.02;
        f += 0.2500 * noise(p); p = p * 2.03;
        f += 0.1250 * noise(p); p = p * 2.01;
        f += 0.0625 * noise(p);
        return f;
      }

      void main() {
        vec2 uv = gl_FragCoord.xy / u_resolution;
        vec2 q = uv;
        
        // Fluid upward velocity motion
        float speed = 1.8;
        vec2 displacement = vec2(
          fbm(uv * 3.0 + vec2(u_time * 0.4, -u_time * speed)),
          fbm(uv * 2.5 + vec2(-u_time * 0.3, -u_time * speed * 1.2))
        );

        // Flame density profile rising from bottom (y = 0)
        float flameHeight = 0.25 + u_progress * 1.1; // Extends upward with progress
        float baseDensity = clamp(1.0 - (uv.y / flameHeight), 0.0, 1.0);

        // Apply turbulent fluid noise
        vec2 noiseUV = uv * vec2(4.0, 2.0) + displacement * 0.6;
        float n = fbm(noiseUV + vec2(0.0, -u_time * 1.2));

        // Core flame intensity calculation
        float fire = baseDensity * (0.4 + 0.8 * n);
        fire = pow(clamp(fire, 0.0, 1.0), 1.3);

        // Color ramp mapping
        vec3 col = vec3(0.0);
        
        if (u_isRed > 0.5) {
          // Red Overdrive Mode
          vec3 deepRed = vec3(0.2, 0.0, 0.05);
          vec3 brightRed = vec3(1.0, 0.1, 0.2);
          vec3 yellowCore = vec3(1.0, 0.8, 0.3);
          
          col = mix(deepRed, brightRed, smoothstep(0.0, 0.5, fire));
          col = mix(col, yellowCore, smoothstep(0.5, 0.95, fire));
        } else {
          // Photorealistic Cyber Purple Flame
          vec3 deepPurple = vec3(0.08, 0.0, 0.22);    // Deep violet base
          vec3 brightMagenta = vec3(0.65, 0.15, 0.95); // Glowing purple body
          vec3 lavenderCore = vec3(0.92, 0.82, 1.0);  // High-temperature core
          
          col = mix(deepPurple, brightMagenta, smoothstep(0.05, 0.45, fire));
          col = mix(col, lavenderCore, smoothstep(0.45, 0.92, fire));
        }

        // Bloom and soft atmospheric dissipation
        float alpha = clamp(fire * 1.8, 0.0, 0.92);
        
        gl_FragColor = vec4(col * alpha, alpha);
      }
    `;

    const createShader = (type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vertShader = createShader(gl.VERTEX_SHADER, vs);
    const fragShader = createShader(gl.FRAGMENT_SHADER, fs);
    if (!vertShader || !fragShader) return;

    const prog = gl.createProgram();
    if (!prog) return;
    gl.attachShader(prog, vertShader);
    gl.attachShader(prog, fragShader);
    gl.linkProgram(prog);

    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(prog));
      return;
    }

    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

    const pos = gl.getAttribLocation(prog, 'a_position');
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(prog, 'u_time');
    const uRes = gl.getUniformLocation(prog, 'u_resolution');
    const uProgress = gl.getUniformLocation(prog, 'u_progress');
    const uIsRed = gl.getUniformLocation(prog, 'u_isRed');

    const render = (time: number) => {
      syncSize();
      gl.viewport(0, 0, canvas.width, canvas.height);

      if (uTime) gl.uniform1f(uTime, time * 0.001);
      if (uRes) gl.uniform2f(uRes, canvas.width, canvas.height);
      if (uProgress) gl.uniform1f(uProgress, elapsedRatio);
      if (uIsRed) gl.uniform1f(uIsRed, isRedAlert ? 1.0 : 0.0);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', syncSize);
      cancelAnimationFrame(animId);
    };
  }, [elapsedRatio, isRedAlert]);

  return (
    <div
      className="fixed bottom-0 left-0 w-full pointer-events-none z-10 overflow-hidden transition-all duration-700 ease-out"
      style={{
        height: `${heightVh}vh`,
      }}
    >
      {/* Ambient Radial Heat Glow */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-700"
        style={{
          background: isRedAlert
            ? `radial-gradient(ellipse at bottom, rgba(255, 30, 80, ${0.4 + elapsedRatio * 0.5}) 0%, transparent 75%)`
            : `radial-gradient(ellipse at bottom, rgba(183, 109, 255, ${0.35 + elapsedRatio * 0.55}) 0%, transparent 75%)`,
        }}
      />

      {/* Realistic WebGL Fluid Fire Canvas */}
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
};
