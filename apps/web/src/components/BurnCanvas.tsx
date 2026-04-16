"use client";

import { useEffect, useRef, useCallback } from "react";
import { useScroll, useTransform, useMotionValueEvent } from "framer-motion";

/* ─────────────────────────────────────────────────────────────────────────────
   WebGL shaders
───────────────────────────────────────────────────────────────────────────── */
const VERT = `
  attribute vec2 a_pos;
  void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

const FRAG = `
  precision highp float;
  uniform vec2  u_res;
  uniform float u_progress; // 0 = fully black  →  1 = fully burned away

  // ── Hash & noise ──────────────────────────────────────────────────────────
  float hash(vec2 p) {
    p = fract(p * vec2(127.1, 311.7));
    p += dot(p, p + 19.19);
    return fract(p.x * p.y);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i),             hash(i + vec2(1,0)), u.x),
      mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), u.x),
      u.y
    );
  }

  // Fractal Brownian Motion — 8 octaves for rich jagged detail
  float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    mat2 rot = mat2(1.6, 1.2, -1.2, 1.6);
    for (int i = 0; i < 8; i++) {
      v += a * noise(p);
      p  = rot * p;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / u_res;

    // ── 1. BIG sweeping sine curves (the large rolling-hill shape) ──────
    float bigCurve = 0.0;
    // Lower these multipliers to make the curve / "mountains" less deep!
    bigCurve += 0.14 * sin(uv.x * 3.14159 * 1.1 + 0.5);   // previously 0.22
    bigCurve += 0.1 * sin(uv.x * 3.14159 * 1.4 - 1.2);   // previously 0.12
    bigCurve += 0.08 * sin(uv.x * 3.14159 * 4.8 + 1.8);   // previously 0.08
    bigCurve += 0.03 * sin(uv.x * 3.14159 * 9.0);         // previously 0.04

    // ── 2. Medium fBm detail (torn-paper roughness) ─────────────────────
    float n1 = fbm(uv * vec2(4.0, 2.0) + vec2(1.7, 0.3));
    float n2 = fbm(uv * vec2(7.0, 3.5) + vec2(0.5, 2.1));
    float mediumNoise = mix(n1, n2, 0.5);

    // ── 3. Fine micro-detail (the "small small burn" fibers) ────────────
    // Increased frequency for even finer detail
    float microNoise = fbm(uv * vec2(48.0, 24.0) + vec2(3.3, 7.7));

    // Combine: big curve + medium torn detail + tiny fibers
    // Increased microNoise contribution for that "small small burn" look
    float edgeOffset = bigCurve + (mediumNoise - 0.5) * 0.22 + (microNoise - 0.5) * 0.12;

    // The edge position: burn sweeps from top (y=0) to bottom (y=1)
    float edgeY = uv.y + edgeOffset;

    // Distance from the burn edge
    float d = edgeY - u_progress;

    // ── Feather widths (refined for "little big" bold look) ─────────────
    float whiteW = 0.024;   // Broadened bright white torn-paper core
    float glowW  = 0.055;   // Broadened orange-red glow band
    float ashW   = 0.07;    // Soft dark ash fringe

    // ── Below threshold: unburned section (matching Highlights bg #2c0404) ──
    if (d > glowW) {
      // Fade out the upper half of the canvas so text is visible underneath
      float alpha = smoothstep(0.55, 0.45, uv.y);
      gl_FragColor = vec4(0.1725, 0.0157, 0.0157, alpha);
      return;
    }

    // ── Fully cleared:    // The "burned away" region (reveals the background)
    if (d < -ashW) {
      gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
      return;
    }

    // ── Ash / char region (just above the edge) ─────────────────────────
    if (d < 0.0) {
      float t = (-d) / ashW;
      float alpha = (1.0 - t);
      alpha = alpha * alpha; // quadratic falloff
      vec3 ash = vec3(0.06, 0.03, 0.01) * (1.0 - t * 0.7);
      gl_FragColor = vec4(ash, alpha * 0.85);
      return;
    }

    // ── White-hot core (the bright torn-paper edge) ─────────────────────
    if (d < whiteW) {
      float wt = d / whiteW;
      // Thick bright white → warm yellow transition
      vec3 col = mix(vec3(1.0, 1.0, 1.0), vec3(1.0, 0.85, 0.5), wt * wt);
      // Add subtle flickering brightness from micro noise
      col *= 0.92 + 0.08 * microNoise;
      gl_FragColor = vec4(col, 1.0);
      return;
    }

    // ── Orange→deep-red outer glow ──────────────────────────────────────
    float gt = (d - whiteW) / (glowW - whiteW);
    vec3 inner = vec3(1.0, 0.55, 0.08);
    vec3 outer = vec3(0.5, 0.04, 0.0);
    vec3 glow  = mix(inner, outer, gt * gt);
    float alpha = 1.0 - gt * gt;
    gl_FragColor = vec4(glow, alpha);
  }
`;

/* ─────────────────────────────────────────────────────────────────────────────
   Helper: compile shader
───────────────────────────────────────────────────────────────────────────── */
function compileShader(gl: WebGLRenderingContext, type: number, src: string) {
  const sh = gl.createShader(type)!;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    console.error("Shader compile error:", gl.getShaderInfoLog(sh));
    gl.deleteShader(sh);
    return null;
  }
  return sh;
}

function initProgram(gl: WebGLRenderingContext) {
  const vs = compileShader(gl, gl.VERTEX_SHADER, VERT);
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) return null;

  const prog = gl.createProgram()!;
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.error("Link error:", gl.getProgramInfoLog(prog));
    return null;
  }
  gl.useProgram(prog);

  // Full-screen quad
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const aLoc = gl.getAttribLocation(prog, "a_pos");
  gl.enableVertexAttribArray(aLoc);
  gl.vertexAttribPointer(aLoc, 2, gl.FLOAT, false, 0, 0);

  gl.enable(gl.BLEND);
  gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

  return {
    program: prog,
    uRes: gl.getUniformLocation(prog, "u_res"),
    uProgress: gl.getUniformLocation(prog, "u_progress"),
  };
}

/* ─────────────────────────────────────────────────────────────────────────────
   Scroll-driven wrapper — place at the BOTTOM of any dark section
   to burn it away into the section below.
───────────────────────────────────────────────────────────────────────────── */
export function BurnTransitionBottom({ height = 300 }: { height?: number }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const progressRef = useRef(0);
  const glProgressRef = useRef(0);
  const rafRef = useRef<number>(0);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const burnProgress = useTransform(scrollYProgress, [0.0, 0.7], [0.0, 1.0]);

  useMotionValueEvent(burnProgress, "change", (v) => {
    progressRef.current = v;
  });

  const initGL = useCallback((canvas: HTMLCanvasElement) => {
    const gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: false });
    if (!gl) return;

    const locs = initProgram(gl);
    if (!locs) return;

    const draw = () => {
      glProgressRef.current += (progressRef.current - glProgressRef.current) * 0.1;

      const w = canvas.width, h = canvas.height;
      gl.viewport(0, 0, w, h);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform2f(locs.uRes, w, h);
      gl.uniform1f(locs.uProgress, glProgressRef.current);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      rafRef.current = requestAnimationFrame(draw);
    };
    draw();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const setSize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
    };
    const ro = new ResizeObserver(setSize);
    ro.observe(canvas);
    setSize();
    initGL(canvas);
    return () => { ro.disconnect(); cancelAnimationFrame(rafRef.current); };
  }, [initGL]);

  return (
    <div
      ref={containerRef}
      className="absolute bottom-0 left-0 right-0 pointer-events-none z-20"
      style={{ height, transform: "translateY(50%)" }}
    >
      <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Scroll-driven wrapper — place at the TOP of any dark section
   to reveal its top edge as you scroll into it.
───────────────────────────────────────────────────────────────────────────── */
export function BurnTransitionTop({ height = 500 }: { height?: number }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const progressRef = useRef(0);
  const glProgressRef = useRef(0);
  const rafRef = useRef<number>(0);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "start start"], // triggers as the top edge sweeps through the viewport
  });

  // Map entrance spread to burn 0..1
  const burnProgress = useTransform(scrollYProgress, [0.0, 1.0], [0.0, 1.0]);

  useMotionValueEvent(burnProgress, "change", (v) => {
    progressRef.current = v;
  });

  const initGL = useCallback((canvas: HTMLCanvasElement) => {
    const gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: false });
    if (!gl) return;

    const locs = initProgram(gl);
    if (!locs) return;

    const draw = () => {
      glProgressRef.current += (progressRef.current - glProgressRef.current) * 0.1;

      const w = canvas.width, h = canvas.height;
      gl.viewport(0, 0, w, h);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform2f(locs.uRes, w, h);
      gl.uniform1f(locs.uProgress, glProgressRef.current);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      rafRef.current = requestAnimationFrame(draw);
    };
    draw();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const setSize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
    };
    const ro = new ResizeObserver(setSize);
    ro.observe(canvas);
    setSize();
    initGL(canvas);
    return () => { ro.disconnect(); cancelAnimationFrame(rafRef.current); };
  }, [initGL]);

  return (
    <div
      ref={containerRef}
      className="absolute top-0 left-0 right-0 pointer-events-none z-10"
      style={{ height, transform: "translateY(-50%)" }}
    >
      <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />
    </div>
  );
}

export default BurnTransitionBottom;
