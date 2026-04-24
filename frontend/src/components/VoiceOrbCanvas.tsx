import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import type { OrbState } from '../types/chat';

interface VoiceOrbCanvasProps {
  state: OrbState;
  amplitude: number; // 0 to 1
  onTap: () => void;
}

/* ── Colour Palette ── */
const COL_IDLE        = new THREE.Color(0x94a3b8); // Soft neutral grey
const COL_READY       = new THREE.Color(0xa0aec0); // Warm grey-blue
const COL_LISTEN_LO   = new THREE.Color(0x38bdf8); // Electric blue
const COL_LISTEN_HI   = new THREE.Color(0x06b6d4); // Bright cyan peak
const COL_PROCESS     = new THREE.Color(0x6366f1); // Deep blue-violet
const COL_SPEAK_A     = new THREE.Color(0x22d3ee); // Dynamic cyan
const COL_SPEAK_B     = new THREE.Color(0x3b82f6); // Dynamic blue
const COL_COMPLETE    = new THREE.Color(0x94a3b8); // Fade back to grey

/* Smooth lerp helper */
function lerpVal(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export default function VoiceOrbCanvas({ state, amplitude, onTap }: VoiceOrbCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<OrbState>(state);
  const ampRef = useRef(amplitude);

  // Keep refs updated for the render loop (avoids re-creating the scene)
  useEffect(() => { stateRef.current = state; }, [state]);
  useEffect(() => { ampRef.current = amplitude; }, [amplitude]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Cleanup any existing children
    while (container.firstChild) container.removeChild(container.firstChild);

    const SIZE = 200;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
    camera.position.z = 4;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(SIZE, SIZE);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    /* ── Particles ── */
    const PARTICLE_COUNT = 2200;
    const geometry = new THREE.BufferGeometry();
    const positions  = new Float32Array(PARTICLE_COUNT * 3);
    const basePositions = new Float32Array(PARTICLE_COUNT * 3); // Original sphere positions
    const velocities = new Float32Array(PARTICLE_COUNT * 3);
    const colors     = new Float32Array(PARTICLE_COUNT * 3);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const r = 0.8 * Math.pow(Math.random(), 0.5);
      const theta = Math.random() * Math.PI * 2;
      const phi   = Math.acos(2 * Math.random() - 1);
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);

      positions[i * 3]     = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
      basePositions[i * 3]     = x;
      basePositions[i * 3 + 1] = y;
      basePositions[i * 3 + 2] = z;

      velocities[i * 3]     = (Math.random() - 0.5) * 0.008;
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.008;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.008;

      colors[i * 3]     = COL_IDLE.r;
      colors[i * 3 + 1] = COL_IDLE.g;
      colors[i * 3 + 2] = COL_IDLE.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color',    new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.032,
      vertexColors: true,
      transparent: true,
      opacity: 0.88,
      blending: THREE.NormalBlending,
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    /* ── Inner Glow ── */
    const glowLight = new THREE.PointLight(0x94a3b8, 0.6, 5);
    scene.add(glowLight);

    /* ── Animation State ── */
    const currentColor = new THREE.Color(0x94a3b8);
    const targetColor  = new THREE.Color(0x94a3b8);
    let smoothedAmp = 0;
    let orbitalAngle = 0;
    let compressionFactor = 1.0; // 1.0 = normal, < 1.0 = compressed
    let ringPulse = 0; // For the reactive ring element

    /* ── Render Loop ── */
    let rafId: number;
    const renderLoop = () => {
      rafId = requestAnimationFrame(renderLoop);

      const now = Date.now() * 0.001;
      const s = stateRef.current;
      const rawAmp = ampRef.current;

      // Smooth amplitude
      smoothedAmp = lerpVal(smoothedAmp, rawAmp > 0.01 ? rawAmp : 0, 0.15);

      // Simulate subtle rhythm when speaking but no real volume
      let activeAmp = smoothedAmp;
      if (s === 'speaking' && activeAmp < 0.1) {
        activeAmp = Math.max(0, 0.12 + Math.sin(now * 7) * 0.1 + Math.sin(now * 13) * 0.05);
      }

      /* ── 1. TARGET COLOR per state ── */
      if (s === 'idle') {
        targetColor.copy(COL_IDLE);
      } else if (s === 'ready') {
        targetColor.copy(COL_READY);
      } else if (s === 'listening') {
        // ALWAYS bright electric blue — even before voice detected.
        // Amplitude only shifts the hue toward cyan for voice peaks.
        targetColor.copy(COL_LISTEN_LO);
        if (activeAmp > 0.05) {
          const t = Math.min(1, activeAmp * 2.5);
          targetColor.lerpColors(COL_LISTEN_LO, COL_LISTEN_HI, t);
        }
      } else if (s === 'processing') {
        targetColor.copy(COL_PROCESS);
      } else if (s === 'speaking') {
        const t = 0.5 + 0.5 * Math.sin(now * 2);
        targetColor.lerpColors(COL_SPEAK_A, COL_SPEAK_B, t);
      } else if (s === 'completed') {
        targetColor.copy(COL_COMPLETE);
      }

      // Color lerp speed: INSTANT for listening (must feel immediate on tap)
      const colorLerpSpeed =
        s === 'listening' ? 0.3 :
        s === 'speaking' ? 0.15 :
        s === 'completed' ? 0.02 :
        s === 'processing' ? 0.08 :
        0.04;
      currentColor.lerp(targetColor, colorLerpSpeed);

      /* ── 2. BREATHING + SCALE ── */
      let breatheSpeed = 0.3, breatheAmount = 0.015, baseScale = 1.0, scaleBoost = 0;

      if (s === 'idle') {
        breatheSpeed = 0.3; breatheAmount = 0.015;
      } else if (s === 'ready') {
        breatheSpeed = 0.5; breatheAmount = 0.02;
      } else if (s === 'listening') {
        breatheSpeed = 2.0; breatheAmount = 0.03; // Energetic base pulse
        baseScale = 1.04; // Slight expansion to feel "alive"
        scaleBoost = activeAmp * 0.15; // Strong voice reactivity
      } else if (s === 'processing') {
        breatheSpeed = 0.8; breatheAmount = 0.015;
        baseScale = 0.92; // Slight compression
      } else if (s === 'speaking') {
        breatheSpeed = 2.0; breatheAmount = 0.04;
        scaleBoost = activeAmp * 0.08;
      } else if (s === 'completed') {
        breatheSpeed = 0.4; breatheAmount = 0.012;
      }

      const pulse = baseScale + Math.sin(now * breatheSpeed) * breatheAmount + scaleBoost;
      particles.scale.setScalar(pulse);

      /* ── 3. ORBITAL ROTATION (processing) ── */
      if (s === 'processing') {
        orbitalAngle += 0.008;
        compressionFactor = lerpVal(compressionFactor, 0.7, 0.02);
      } else {
        orbitalAngle *= 0.98; // Slowly decay rotation
        compressionFactor = lerpVal(compressionFactor, 1.0, 0.03);
      }
      particles.rotation.y = orbitalAngle;
      particles.rotation.x = Math.sin(orbitalAngle * 0.5) * 0.15;

      /* ── 4. PARTICLE MOTION ── */
      const posAttr = geometry.attributes.position;
      const colAttr = geometry.attributes.color;

      let speedMult = 0.6, vibration = 0;
      if (s === 'idle') {
        speedMult = 0.4; vibration = 0;
      } else if (s === 'ready') {
        speedMult = 0.5; vibration = 0;
      } else if (s === 'listening') {
        speedMult = 1.5 + activeAmp * 6;
        // ALWAYS have base vibration so orb looks active even before user speaks
        vibration = 0.006 + activeAmp * 0.03;
      } else if (s === 'processing') {
        speedMult = 0.3; vibration = 0.002;
      } else if (s === 'speaking') {
        speedMult = 1.2 + activeAmp * 3;
        vibration = activeAmp * 0.012;
      } else if (s === 'completed') {
        speedMult = 0.3; vibration = 0;
      }

      const containRadius = s === 'processing' ? 0.7 : 1.0;

      for (let i = 0; i < PARTICLE_COUNT; i++) {
        let px = posAttr.getX(i);
        let py = posAttr.getY(i);
        let pz = posAttr.getZ(i);

        // Apply velocity + vibration
        px += velocities[i * 3] * speedMult + (Math.random() - 0.5) * vibration;
        py += velocities[i * 3 + 1] * speedMult + (Math.random() - 0.5) * vibration;
        pz += velocities[i * 3 + 2] * speedMult + (Math.random() - 0.5) * vibration;

        // Elastic containment with variable radius
        const dist = Math.sqrt(px * px + py * py + pz * pz);
        if (dist > containRadius) {
          const factor = 0.97;
          px *= factor;
          py *= factor;
          pz *= factor;
        }

        // During processing: gently pull particles inward
        if (s === 'processing' && dist > 0.5) {
          const pull = 0.002;
          px -= px * pull;
          py -= py * pull;
          pz -= pz * pull;
        }

        posAttr.setXYZ(i, px, py, pz);

        // Color update
        colAttr.setXYZ(i, currentColor.r, currentColor.g, currentColor.b);
      }

      posAttr.needsUpdate = true;
      colAttr.needsUpdate = true;

      /* ── 5. GLOW ── */
      glowLight.color.copy(currentColor);
      let baseIntensity = 0.5;
      if (s === 'idle') baseIntensity = 0.4;
      else if (s === 'ready') baseIntensity = 0.6;
      else if (s === 'listening') {
        // HIGH baseline glow — clearly visible even without voice
        baseIntensity = 2.0 + activeAmp * 3.0 + Math.sin(now * 3) * 0.3;
      }
      else if (s === 'processing') baseIntensity = 0.8 + Math.sin(now * 1.5) * 0.15;
      else if (s === 'speaking') baseIntensity = 1.5 + activeAmp * 1.5;
      else if (s === 'completed') baseIntensity = 0.5 + Math.sin(now * 0.5) * 0.1;

      glowLight.intensity = baseIntensity;

      /* ── 6. CSS Custom Properties ── */
      if (container) {
        container.style.setProperty('--orb-r', String(Math.floor(currentColor.r * 255)));
        container.style.setProperty('--orb-g', String(Math.floor(currentColor.g * 255)));
        container.style.setProperty('--orb-b', String(Math.floor(currentColor.b * 255)));
      }

      renderer.render(scene, camera);
    };

    renderLoop();

    return () => {
      cancelAnimationFrame(rafId);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
    };
  }, []); // Single mount — state/amplitude read via refs

  // Determine the data-state attribute for CSS styling
  const dataState = stateRef.current;

  return (
    <div
      ref={containerRef}
      onClick={onTap}
      data-orb-state={state}
      role="button"
      tabIndex={0}
      aria-label={`Voice orb — ${state}`}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onTap(); } }}
      className="voice-orb-canvas-container"
    >
      {/* Orb renders directly inside. Outer rings removed for cleaner 'energy core' look. */}
    </div>
  );
}
