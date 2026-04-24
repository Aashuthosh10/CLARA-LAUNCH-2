import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import VoiceOrbCanvas from './VoiceOrbCanvas';
import type { OrbState } from '../types/chat';

interface VoiceOrbProps {
  state: OrbState;
  onTap: () => void;
  amplitude?: number; // 0 to 1
  label?: string;     // Override auto-generated label
}

/* State → label mapping */
const STATE_LABELS: Record<OrbState, string | null> = {
  idle: null,
  ready: null,
  listening: 'Listening...',
  processing: 'Thinking...',
  speaking: 'Speaking...',
  completed: 'Tap to Speak',
};

export default function VoiceOrb({ state, onTap, amplitude = 0, label }: VoiceOrbProps) {
  const displayLabel = label ?? STATE_LABELS[state];

  // Determine if the orb should visually invite interaction
  const isInteractive = state === 'idle' || state === 'ready' || state === 'completed';

  return (
    <div
      className={`voice-orb-wrapper ${isInteractive ? 'voice-orb-interactive' : ''}`}
      data-orb-state={state}
    >
      <VoiceOrbCanvas
        state={state}
        amplitude={amplitude}
        onTap={onTap}
      />

      {/* State Label */}
      <AnimatePresence mode="wait">
        {displayLabel && (
          <motion.div
            key={displayLabel}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className={`orb-state-label ${state === 'completed' ? 'orb-state-label--cta' : ''}`}
          >
            {displayLabel}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Completion pulse ring — draws attention to "Tap to Speak" */}
      <AnimatePresence>
        {state === 'completed' && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.2, opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="orb-completion-ring"
          />
        )}
      </AnimatePresence>
    </div>
  );
}
