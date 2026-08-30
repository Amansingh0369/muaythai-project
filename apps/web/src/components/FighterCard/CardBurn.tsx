"use client";

import { useCallback, useEffect, useLayoutEffect, useRef } from "react";

/**
 * The first frame has to be painted before the browser composites, or the
 * canvas shows its previous (cleared) buffer for a frame while already at full
 * opacity — a flash of un-charred card. useEffect runs after paint; this does
 * not. Falls back on the server, where it never draws anyway.
 */
const useBeforePaint = typeof window !== "undefined" ? useLayoutEffect : useEffect;

/* ─────────────────────────────────────────────────────────────────────────────
   A one-shot burn sweep, driven by a progress value instead of scroll.

   The edge maths (big sine curves + fBm roughness + micro fibres) is the same
   family as BurnCanvas, so the card chars with the same torn-paper edge as the
   burn sections.

   It paints the char as well as the flame. That matters: the charred region and
   the flame front then share one jagged edge by construction. Drawing the black
   separately — a CSS gradient on the face, say — gives a straight horizontal
   line that visibly fails to follow the fire.
───────────────────────────────────────────────────────────────────────────── */

const VERT = `
  attribute vec2 a_pos;
  void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

const FRAG = `
  precision highp float;
  uniform vec2  u_res;
  uniform float u_progress; // 0 = wholly charred, 1 = wholly revealed
  uniform float u_time;     // seconds, so the edge crawls instead of sliding

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

  float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    mat2 rot = mat2(1.6, 1.2, -1.2, 1.6);
    for (int i = 0; i < 6; i++) {
      v += a * noise(p);
      p  = rot * p;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / u_res;

    // Big rolling shape of the edge
    float bigCurve = 0.0;
    bigCurve += 0.10 * sin(uv.x * 3.14159 * 1.1 + 0.5);
    bigCurve += 0.07 * sin(uv.x * 3.14159 * 1.4 - 1.2);
    bigCurve += 0.05 * sin(uv.x * 3.14159 * 4.8 + 1.8);
    bigCurve += 0.02 * sin(uv.x * 3.14159 * 9.0);

    // Torn-paper roughness, then fine fibres. The fine detail drifts with time
    // so the edge writhes as it advances rather than sliding as a rigid shape.
    float n1 = fbm(uv * vec2(4.0, 2.0) + vec2(1.7, 0.3));
    float n2 = fbm(uv * vec2(7.0, 3.5) + vec2(0.5, 2.1));
    float mediumNoise = mix(n1, n2, 0.5);
    float microNoise  = fbm(uv * vec2(44.0, 22.0) + vec2(3.3, 7.7) + u_time * 0.30);
    float flicker     = fbm(uv * vec2(9.0, 6.0) + vec2(2.4, 5.8) + u_time * 0.55);

    float edgeOffset = bigCurve
                     + (mediumNoise - 0.5) * 0.18
                     + (microNoise  - 0.5) * 0.10
                     + (flicker     - 0.5) * 0.035;
    float edgeY = uv.y + edgeOffset;

    // Travel a little past both ends so the edge enters and leaves the card
    float d = edgeY - (u_progress * 1.4 - 0.2);

    // Paper does not burn as a clean front — embers run ahead and eat holes
    // that join up as the fire arrives. Only bites just ahead of the flame.
    float ahead = smoothstep(0.11, 0.0, d);
    if (ahead > 0.0) {
      float holes = fbm(uv * vec2(30.0, 20.0) + vec2(5.5, 1.3) + u_time * 0.45);
      d -= ahead * max(0.0, holes - 0.54) * 0.34;
    }

    float whiteW = 0.016;
    float glowW  = 0.045;
    float ashW   = 0.075;

    // Ahead of the flame: stock the fire has not reached yet. Opaque char, so
    // the black edge IS the flame's own edge rather than a straight CSS line
    // trying to keep up with it. Grained with the same micro noise as the burn.
    if (d > glowW) {
      vec3 charCol = vec3(0.020, 0.012, 0.009) * (0.55 + 0.9 * microNoise);
      gl_FragColor = vec4(charCol, 1.0);
      return;
    }

    // Burned clean through — the card underneath shows
    if (d < -ashW) {
      gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
      return;
    }

    // Char fringe trailing the edge
    if (d < 0.0) {
      float t = (-d) / ashW;
      float alpha = (1.0 - t) * (1.0 - t);
      vec3 ash = vec3(0.06, 0.03, 0.01) * (1.0 - t * 0.7);
      gl_FragColor = vec4(ash, alpha * 0.9);
      return;
    }

    // White-hot core
    if (d < whiteW) {
      float wt = d / whiteW;
      vec3 col = mix(vec3(1.0, 1.0, 1.0), vec3(1.0, 0.85, 0.5), wt * wt);
      col *= 0.92 + 0.08 * microNoise;
      gl_FragColor = vec4(col, 1.0);
      return;
    }

    // Ember glow falling off into nothing
    float gt = (d - whiteW) / (glowW - whiteW);
    vec3 glow = mix(vec3(1.0, 0.55, 0.08), vec3(0.5, 0.04, 0.0), gt * gt);
    gl_FragColor = vec4(glow, 1.0 - gt * gt);
  }
`;

function compileShader(gl: WebGLRenderingContext, type: number, src: string) {
  const sh = gl.createShader(type);
  if (!sh) return null;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    gl.deleteShader(sh);
    return null;
  }
  return sh;
}

interface CardBurnProps {
  /** Flips false → true to fire one sweep. */
  active: boolean;
  /** Sweep length in ms — match it to whatever transition it accompanies. */
  duration?: number;
  /**
   * Paint the fully charred state for this long before the flame starts. Lets
   * the caller black the card out at the exact moment it becomes visible, so
   * there is never a frame of un-charred card waiting for the fire.
   */
  startDelay?: number;
  onDone?: () => void;
}

interface GLState {
  gl: WebGLRenderingContext;
  uRes: WebGLUniformLocation | null;
  uProgress: WebGLUniformLocation | null;
  uTime: WebGLUniformLocation | null;
}

/**
 * Absolutely positioned, non-interactive. Renders nothing at all when WebGL is
 * unavailable, so the card simply flips without the flourish.
 */
export default function CardBurn({ active, duration = 900, startDelay = 0, onDone }: CardBurnProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const glRef = useRef<GLState | null>(null);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  /** Compiled once and reused — a sweep per flip would otherwise leak programs. */
  const initGL = useCallback((canvas: HTMLCanvasElement): GLState | null => {
    if (glRef.current) return glRef.current;

    const gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: false });
    if (!gl) return null;

    const vs = compileShader(gl, gl.VERTEX_SHADER, VERT);
    const fs = compileShader(gl, gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return null;

    const prog = gl.createProgram();
    if (!prog) return null;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const aLoc = gl.getAttribLocation(prog, "a_pos");
    gl.enableVertexAttribArray(aLoc);
    gl.vertexAttribPointer(aLoc, 2, gl.FLOAT, false, 0, 0);

    gl.enable(gl.BLEND);
    gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    glRef.current = {
      gl,
      uRes: gl.getUniformLocation(prog, "u_res"),
      uProgress: gl.getUniformLocation(prog, "u_progress"),
      uTime: gl.getUniformLocation(prog, "u_time"),
    };
    return glRef.current;
  }, []);

  useBeforePaint(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Size to the card, capped so a 3x screen does not shade 9x the pixels.
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.round(canvas.offsetWidth * dpr);
    const h = Math.round(canvas.offsetHeight * dpr);
    if (w === 0 || h === 0) return;
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }

    const state = initGL(canvas);
    if (!state) return;
    const { gl, uRes, uProgress, uTime } = state;

    const start = performance.now();
    const draw = () => {
      const elapsed = performance.now() - start;
      // Held at 0 — fully charred — for the whole of startDelay.
      const raw = Math.min(1, Math.max(0, (elapsed - startDelay) / duration));
      // Smoothstep: catches slowly, runs through the middle, settles at the end.
      const t = raw * raw * (3 - 2 * raw);

      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uProgress, t);
      gl.uniform1f(uTime, elapsed / 1000);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      if (raw < 1) {
        rafRef.current = requestAnimationFrame(draw);
      } else {
        // Leave it clear so a spent sweep never sits on top of the card.
        gl.clear(gl.COLOR_BUFFER_BIT);
        onDoneRef.current?.();
      }
    };
    draw();

    return () => cancelAnimationFrame(rafRef.current);
  }, [active, duration, startDelay, initGL]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{
        display: "block",
        opacity: active ? 1 : 0,
        // Its own compositing layer, so a sweep never repaints the card under it.
        willChange: "opacity",
      }}
    />
  );
}
