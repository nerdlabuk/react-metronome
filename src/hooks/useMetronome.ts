import { useRef, useCallback, useState, useEffect } from 'react';

export function useMetronome(tempo: number, swing: number, beatsPerMeasure: number) {
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextNoteTimeRef = useRef(0);
  const currentBeatRef = useRef(0);
  const timerIdRef = useRef<number | null>(null);
  const [currentBeat, setCurrentBeat] = useState(0);

  const scheduleAheadTime = 0.1; // seconds
  const scheduleIntervalTime = 25; // milliseconds

  const playClick = useCallback((time: number, isAccent: boolean, swingIntensity: number = 1.0) => {
    if (!audioContextRef.current) return;

    if (isAccent) {
      // Beat 1 - Bass Drum (Kick)
      const osc = audioContextRef.current.createOscillator();
      const gain = audioContextRef.current.createGain();
      const filter = audioContextRef.current.createBiquadFilter();

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(audioContextRef.current.destination);

      // Bass drum characteristics
      osc.type = 'sine';
      
      // Start oscillator slightly early to prevent clicks
      const startTime = Math.max(0, time - 0.001);
      osc.frequency.setValueAtTime(120, startTime);
      osc.frequency.exponentialRampToValueAtTime(35, time + 0.06);

      filter.type = 'lowpass';
      filter.frequency.value = 150;
      filter.Q.value = 0.5;

      // Very smooth attack to prevent click, starting from absolute zero
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0, time); // Stay at zero until actual beat time
      gain.gain.linearRampToValueAtTime(0.9, time + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);

      osc.start(startTime);
      osc.stop(time + 0.2);
    } else {
      // Other beats - Hi-Hat
      const bufferSize = audioContextRef.current.sampleRate * 0.05;
      const buffer = audioContextRef.current.createBuffer(1, bufferSize, audioContextRef.current.sampleRate);
      const data = buffer.getChannelData(0);

      // Generate white noise for hi-hat
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = audioContextRef.current.createBufferSource();
      const filter = audioContextRef.current.createBiquadFilter();
      const gain = audioContextRef.current.createGain();

      noise.buffer = buffer;
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(audioContextRef.current.destination);

      // Hi-hat characteristics - high-pass filtered noise
      filter.type = 'highpass';
      filter.frequency.value = 7000;
      filter.Q.value = 1;

      // Vary volume based on swing intensity - swung beats are slightly softer
      const volume = 0.3 * (0.7 + (swingIntensity * 0.3));
      gain.gain.setValueAtTime(volume, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + 0.05);

      noise.start(time);
      noise.stop(time + 0.05);
    }
  }, []);

  const scheduler = useCallback(() => {
    if (!audioContextRef.current) return;

    while (nextNoteTimeRef.current < audioContextRef.current.currentTime + scheduleAheadTime) {
      const isAccent = currentBeatRef.current === 0;
      
      // Calculate swing intensity for this beat (used for volume variation)
      let swingIntensity = 1.0;
      if (swing > 0 && currentBeatRef.current % 2 === 1) {
        // Off-beats are slightly softer in swing
        swingIntensity = 0.85;
      }
      
      // Add subtle humanization - tiny random timing variation
      const humanization = (Math.random() - 0.5) * 0.003; // ±1.5ms variation
      const playTime = nextNoteTimeRef.current + humanization;
      
      playClick(playTime, isAccent, swingIntensity);
      
      // Update the current beat state
      setCurrentBeat(currentBeatRef.current);

      // Calculate next note time
      const secondsPerBeat = 60.0 / tempo;
      let nextBeatTime = secondsPerBeat;

      // Apply swing - using triplet-based feel
      if (swing > 0 && beatsPerMeasure > 1) {
        // Convert swing percentage to triplet ratio
        // 0% swing = straight (1:1 ratio = 0.5:0.5)
        // 50% swing = medium triplet feel (0.6:0.4)  
        // 100% swing = full triplet (0.667:0.333 or 2:1 ratio)
        const swingAmount = swing / 100;
        const tripletRatio = 0.5 + (swingAmount * 0.167); // Maps 0-100 to 0.5-0.667
        
        if (currentBeatRef.current % 2 === 0) {
          // Even beats (downbeats) are longer
          nextBeatTime = secondsPerBeat * tripletRatio * 2;
        } else {
          // Odd beats (upbeats) are shorter
          nextBeatTime = secondsPerBeat * (1 - tripletRatio) * 2;
        }
      }

      nextNoteTimeRef.current += nextBeatTime;
      currentBeatRef.current = (currentBeatRef.current + 1) % beatsPerMeasure;
    }
  }, [tempo, swing, beatsPerMeasure, playClick]);

  const startMetronome = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }

    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }

    currentBeatRef.current = 0;
    setCurrentBeat(0);
    nextNoteTimeRef.current = audioContextRef.current.currentTime;

    const tick = () => {
      scheduler();
      timerIdRef.current = window.setTimeout(tick, scheduleIntervalTime);
    };

    tick();
  }, [scheduler]);

  const stopMetronome = useCallback(() => {
    if (timerIdRef.current !== null) {
      clearTimeout(timerIdRef.current);
      timerIdRef.current = null;
    }
    setCurrentBeat(0);
  }, []);

  return { startMetronome, stopMetronome, currentBeat };
}