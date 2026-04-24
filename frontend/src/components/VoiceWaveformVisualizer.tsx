import React, { useRef, useEffect } from 'react';
import * as anime from 'animejs';
import * as THREE from 'three';
import type { OrbState } from '../types/chat';
import { FREQUENCY_BIN_COUNT } from '../hooks/useVoiceAnalyser';

const WIDTH = 300;
const HEIGHT = 120;
const CENTER_Y = HEIGHT / 2;
const MAX_AMPLITUDE = 42;
const LERP = 0.18;

const ELECTRIC_BLUE = 'rgba(0, 212, 255, 0.85)';
const FUSCHIA = 'rgba(255, 0, 255, 0.75)';
const PURPLE = 'rgba(156, 39, 176, 0.7)';
const CENTER_GLOW = 'rgba(255, 200, 255, 0.95)';
const DARK_BG_HEX = '#1a1b2e';

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

interface VoiceWaveformVisualizerProps {
  state: OrbState;
  onTap: () => void;
  label?: string;
  /** When listening, ref is updated every frame with frequency bin data */
  frequencyDataRef?: React.RefObject<Uint8Array>;
  /** Smoothed values for fallback when no ref */
  audio?: { smoothedRms: number; smoothedFrequency: number };
}

export default function VoiceWaveformVisualizer({
  state,
  onTap,
  label,
  frequencyDataRef,
  audio,
}: VoiceWaveformVisualizerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const animRef = useRef<number>(0);
  const smoothedAmpsRef = useRef<Float32Array>(new Float32Array(Math.floor(WIDTH / 2) + 1));
  const intensityRef = useRef(0);
  const intensityObj = useRef({ value: 0.15 });

  useEffect(() => {
    const obj = intensityObj.current;
    if (state === 'listening') {
      anime.animate(obj, { value: 1, duration: 500, ease: 'easeOutElastic(1, 0.4)' });
    } else if (state === 'idle' || state === 'off' || state === 'completed') {
      anime.animate(obj, { value: 0.15, duration: 600, ease: 'easeOutQuad' });
    } else if (state === 'speaking') {
      anime.animate(obj, { value: 0.65, duration: 300, ease: 'easeOutQuad' });
    } else if (state === 'processing') {
      anime.animate(obj, { value: 0.5, duration: 300, ease: 'easeOutQuad' });
    }
  }, [state]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = WIDTH * dpr;
    canvas.height = HEIGHT * dpr;
    canvas.style.width = `${WIDTH}px`;
    canvas.style.height = `${HEIGHT}px`;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const isListening = state === 'listening';
    const halfW = Math.floor(WIDTH / 2);
    const pointCount = halfW + 1;

    const loop = () => {
      const freqData = frequencyDataRef?.current ?? null;
      const targetIntensity = intensityObj.current.value;
      intensityRef.current = lerp(intensityRef.current, targetIntensity, 0.08);

      const amps = smoothedAmpsRef.current;
      if (isListening && freqData && freqData.length >= FREQUENCY_BIN_COUNT) {
        const binStep = FREQUENCY_BIN_COUNT / pointCount;
        for (let i = 0; i < pointCount; i++) {
          const binIdx = Math.min(Math.floor(i * binStep), FREQUENCY_BIN_COUNT - 1);
          const raw = freqData[binIdx] / 255;
          const centerBoost = 1 + 0.8 * Math.exp(-Math.pow((i - pointCount / 2) / (pointCount / 2), 2));
          const target = raw * centerBoost * MAX_AMPLITUDE * intensityRef.current;
          amps[i] = lerp(amps[i], target, LERP);
        }
      } else {
        const t = Date.now() * 0.002;
        for (let i = 0; i < pointCount; i++) {
          const phase = (i / pointCount) * Math.PI * 2 + t;
          const centerFactor = Math.exp(-Math.pow((i - pointCount / 2) / (pointCount / 3), 2));
          const target = (0.3 + 0.2 * Math.sin(phase) + (audio?.smoothedFrequency ?? 0) * 0.5) * MAX_AMPLITUDE * centerFactor * intensityRef.current;
          amps[i] = lerp(amps[i], target, 0.04);
        }
      }

      const cx = (WIDTH * dpr) / 2;
      const cy = (CENTER_Y) * dpr;
      const scaleX = (WIDTH * dpr) / (2 * (pointCount - 1));

      ctx.save();
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const drawWave = (amplitudeScale: number, color: string, blur: number, lineWidth: number, reverse = false) => {
        ctx.shadowColor = color;
        ctx.shadowBlur = blur * dpr;
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth * dpr;
        ctx.beginPath();
        for (let i = 0; i < pointCount; i++) {
          const x = cx - (pointCount - 1 - i) * scaleX;
          const y = cy + (reverse ? -1 : 1) * amps[i] * amplitudeScale * dpr;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        for (let i = pointCount - 2; i >= 0; i--) {
          const x = cx - (pointCount - 1 - i) * scaleX;
          const y = cy - (reverse ? -1 : 1) * amps[i] * amplitudeScale * dpr;
          ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();
      };

      const intensity = intensityRef.current;
      drawWave(1.2, ELECTRIC_BLUE, 25, 2.5);
      drawWave(1.0, FUSCHIA, 18, 2);
      drawWave(0.85, PURPLE, 12, 1.5);
      ctx.shadowBlur = 0;
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
      gradient.addColorStop(0, 'transparent');
      gradient.addColorStop(0.4, CENTER_GLOW);
      gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.9)');
      gradient.addColorStop(0.6, CENTER_GLOW);
      gradient.addColorStop(1, 'transparent');
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 1.5 * dpr;
      ctx.globalAlpha = 0.5 + 0.5 * intensity;
      drawWave(0.7, 'rgba(255,255,255,0.9)', 8, 1);
      ctx.globalAlpha = 1;

      ctx.restore();
      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [state, frequencyDataRef, audio?.smoothedFrequency]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let renderer: THREE.WebGLRenderer | null = null;
    let material: THREE.ShaderMaterial | null = null;
    let geometry: THREE.PlaneGeometry | null = null;
    let threeAnimId = 0;

    try {
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(DARK_BG_HEX);
      const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 2);
      camera.position.z = 1;
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
      renderer.setSize(WIDTH, HEIGHT);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setClearColor(0x000000, 0);
      geometry = new THREE.PlaneGeometry(2, 2);
      material = new THREE.ShaderMaterial({
        transparent: true,
        uniforms: {
          uTime: { value: 0 },
          uIntensity: { value: 0.2 },
        },
        vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform float uTime;
          uniform float uIntensity;
          varying vec2 vUv;
          void main() {
            float glow = 0.15 + 0.08 * sin(uTime * 0.5) + uIntensity * 0.3;
            vec3 blue = vec3(0.0, 0.5, 0.8);
            vec3 pink = vec3(0.9, 0.2, 0.6);
            float t = vUv.x;
            vec3 col = mix(blue, pink, t) * glow;
            gl_FragColor = vec4(col, 0.25 + 0.15 * (1.0 - abs(vUv.y - 0.5) * 2.0));
          }
        `,
      });
      const mesh = new THREE.Mesh(geometry, material);
      scene.add(mesh);
      sceneRef.current = scene;
      rendererRef.current = renderer;
      meshRef.current = mesh;

      const firstChild = container.firstChild;
      if (firstChild) container.insertBefore(renderer.domElement, firstChild);
      else container.appendChild(renderer.domElement);

      const uniformIntensity = material.uniforms.uIntensity;
      const uniformTime = material.uniforms.uTime;
      let t = 0;
      const threeLoop = () => {
        t += 0.016;
        uniformTime.value = t;
        uniformIntensity.value = 0.15 + 0.1 * Math.sin(t * 0.8);
        renderer?.render(scene, camera);
        threeAnimId = requestAnimationFrame(threeLoop);
      };
      threeAnimId = requestAnimationFrame(threeLoop);
    } catch (_) {
      // Three.js unavailable or failed; 2D waveform still works
    }

    return () => {
      if (threeAnimId) cancelAnimationFrame(threeAnimId);
      if (renderer) {
        renderer.dispose();
        if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
      }
      if (material) (material as THREE.Material).dispose();
      if (geometry) geometry.dispose();
      sceneRef.current = null;
      rendererRef.current = null;
      meshRef.current = null;
    };
  }, []);

  return (
    <div className="flex flex-col items-center chat-orb-container">
      <button
        type="button"
        onClick={onTap}
        className="orb-touch-area relative overflow-hidden rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8696A0] cursor-pointer touch-button border border-white/10"
        style={{
          minWidth: WIDTH,
          minHeight: HEIGHT,
          width: WIDTH,
          height: HEIGHT,
          background: `linear-gradient(135deg, ${DARK_BG_HEX} 0%, #0f0f1a 100%)`,
        }}
        aria-label={label ?? 'Voice input'}
      >
        <div ref={containerRef} className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ width: WIDTH, height: HEIGHT }}>
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ width: WIDTH, height: HEIGHT, position: 'absolute', zIndex: 1 }}
          />
        </div>
      </button>
      {label && (
        <span className="mt-2 text-xs tracking-widest uppercase text-[#8696A0] font-medium">
          {label}
        </span>
      )}
    </div>
  );
}
