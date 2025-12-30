import { useRef, useCallback, useEffect } from 'react';

const noteFrequencies: { [key: string]: number } = {
  'C': 130.81,
  'C#': 138.59,
  'D': 146.83,
  'D#': 155.56,
  'E': 164.81,
  'F': 174.61,
  'F#': 185.00,
  'G': 196.00,
  'G#': 207.65,
  'A': 220.00,
  'A#': 233.08,
  'B': 246.94,
};

export type ChordQuality = 'major' | 'minor' | 'diminished' | 'augmented' | 'power' | 'octave';
export type ChordExtension = 'none' | '6' | '7' | 'dom7' | '9' | '11' | '13';
export type ChordAlteration = 'none' | 'b5' | '#5' | 'b9' | '#9';
export type DroneSound = 'hammond' | 'organ' | 'piano' | 'horns' | 'guitar' | 'strings';
export type DroneMode = 'constant' | 'per-beat' | 'per-bar';
export type DroneProgression = 'none' | 'I-IV-V' | 'ii-V-I' | '12-bar-blues' | '8-bar-blues' | 
  'I-V-vi-IV' | 'vi-IV-I-V' | 'I-vi-ii-V' | 'I-vi-IV-V' | 'rhythm-changes' | 'autumn-leaves' |
  'i-VII-VI-V' | 'i-iv-VII-III' | 'i-VI-III-VII' | 'circle-of-fifths';

interface ProgressionChord {
  root: string;
  quality: ChordQuality;
  extension?: ChordExtension;
}

// Helper function to format chord name
export function formatChordName(
  root: string,
  quality: ChordQuality,
  extension: ChordExtension = 'none',
  alteration: ChordAlteration = 'none'
): string {
  let chordName = root;
  
  // Add quality suffix
  if (quality === 'minor') {
    chordName += 'm';
  } else if (quality === 'diminished') {
    chordName += '°';
  } else if (quality === 'augmented') {
    chordName += '+';
  } else if (quality === 'power') {
    chordName += '5';
  }
  // major and octave don't get a suffix for the basic triad
  
  // Add extension
  if (extension !== 'none' && quality !== 'power' && quality !== 'octave') {
    // Special case: major quality with 7 extension = major 7th (Cmaj7)
    if (quality === 'major' && extension === '7') {
      chordName += 'maj7';
    } else if (extension === 'dom7') {
      // Dominant 7th displayed as just "7" (e.g., G7)
      chordName += '7';
    } else {
      chordName += extension;
    }
  }
  
  // Add alteration
  if (alteration !== 'none' && quality !== 'power' && quality !== 'octave') {
    if (alteration === 'b5') {
      chordName += '♭5';
    } else if (alteration === '#5') {
      chordName += '#5';
    } else if (alteration === 'b9') {
      chordName += '♭9';
    } else if (alteration === '#9') {
      chordName += '#9';
    }
  }
  
  return chordName;
}

// Helper function to transpose a note by semitones
function transposeNoteHelper(baseNote: string, semitones: number): string {
  const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const baseIndex = notes.indexOf(baseNote);
  const newIndex = (baseIndex + semitones + 12) % 12;
  return notes[newIndex];
}

// Get chord for current position in progression (exported for use in TempoDisplay)
export function getProgressionChord(
  bar: number,
  root: string,
  quality: ChordQuality,
  progression: DroneProgression
): ProgressionChord {
  if (progression === 'none') {
    return { root, quality };
  }

  switch (progression) {
    case 'I-IV-V': {
      const barInPattern = bar % 8;
      const useSevenths = quality !== 'power' && quality !== 'octave';
      if (barInPattern < 2) {
        return { root, quality, extension: useSevenths ? '7' : undefined };
      } else if (barInPattern < 4) {
        return { root: transposeNoteHelper(root, 5), quality, extension: useSevenths ? '7' : undefined };
      } else if (barInPattern < 6) {
        return { root, quality, extension: useSevenths ? '7' : undefined };
      } else {
        // V chord should be dominant 7th
        const vQuality = quality === 'power' || quality === 'octave' ? quality : 'major';
        const vExtension = useSevenths ? 'dom7' : undefined;
        return { root: transposeNoteHelper(root, 7), quality: vQuality, extension: vExtension };
      }
    }

    case 'ii-V-I': {
      const barInPattern = bar % 4;
      if (barInPattern === 0) {
        // ii chord: minor 7th
        const iiQuality = quality === 'power' || quality === 'octave' ? quality : 'minor';
        const iiExtension = (quality === 'power' || quality === 'octave') ? undefined : '7';
        return { root: transposeNoteHelper(root, 2), quality: iiQuality, extension: iiExtension };
      } else if (barInPattern === 1) {
        // V chord: dominant 7th (major triad + minor 7th)
        const vQuality = quality === 'power' || quality === 'octave' ? quality : 'major';
        const vExtension = (quality === 'power' || quality === 'octave') ? undefined : 'dom7';
        return { root: transposeNoteHelper(root, 7), quality: vQuality, extension: vExtension };
      } else {
        // I chord: major 7th
        const iExtension = (quality === 'power' || quality === 'octave') ? undefined : '7';
        return { root, quality, extension: iExtension };
      }
    }

    case '12-bar-blues': {
      const barInPattern = bar % 12;
      const bluesQuality = quality === 'power' || quality === 'octave' ? quality : 'major';
      const bluesExtension = (quality === 'power' || quality === 'octave') ? undefined : 'dom7';
      if (barInPattern < 4) {
        return { root, quality: bluesQuality, extension: bluesExtension };
      } else if (barInPattern < 6) {
        return { root: transposeNoteHelper(root, 5), quality: bluesQuality, extension: bluesExtension };
      } else if (barInPattern < 8) {
        return { root, quality: bluesQuality, extension: bluesExtension };
      } else if (barInPattern === 8) {
        return { root: transposeNoteHelper(root, 7), quality: bluesQuality, extension: bluesExtension };
      } else if (barInPattern === 9) {
        return { root: transposeNoteHelper(root, 5), quality: bluesQuality, extension: bluesExtension };
      } else if (barInPattern === 10) {
        return { root, quality: bluesQuality, extension: bluesExtension };
      } else {
        return { root: transposeNoteHelper(root, 7), quality: bluesQuality, extension: bluesExtension };
      }
    }

    case '8-bar-blues': {
      const barInPattern = bar % 8;
      const bluesQuality = quality === 'power' || quality === 'octave' ? quality : 'major';
      const bluesExtension = (quality === 'power' || quality === 'octave') ? undefined : 'dom7';
      if (barInPattern < 2) {
        return { root, quality: bluesQuality, extension: bluesExtension };
      } else if (barInPattern < 4) {
        return { root: transposeNoteHelper(root, 5), quality: bluesQuality, extension: bluesExtension };
      } else if (barInPattern < 6) {
        return { root, quality: bluesQuality, extension: bluesExtension };
      } else if (barInPattern === 6) {
        return { root: transposeNoteHelper(root, 7), quality: bluesQuality, extension: bluesExtension };
      } else {
        return { root, quality: bluesQuality, extension: bluesExtension };
      }
    }

    case 'I-V-vi-IV': {
      const barInPattern = bar % 4;
      if (barInPattern === 0) {
        return { root, quality };
      } else if (barInPattern === 1) {
        const vQuality = quality === 'power' || quality === 'octave' ? quality : 'major';
        return { root: transposeNoteHelper(root, 7), quality: vQuality };
      } else if (barInPattern === 2) {
        const viQuality = quality === 'power' || quality === 'octave' ? quality : 'minor';
        return { root: transposeNoteHelper(root, 9), quality: viQuality };
      } else {
        return { root: transposeNoteHelper(root, 5), quality };
      }
    }

    case 'vi-IV-I-V': {
      const barInPattern = bar % 4;
      if (barInPattern === 0) {
        const viQuality = quality === 'power' || quality === 'octave' ? quality : 'minor';
        return { root: transposeNoteHelper(root, 9), quality: viQuality };
      } else if (barInPattern === 1) {
        return { root: transposeNoteHelper(root, 5), quality };
      } else if (barInPattern === 2) {
        return { root, quality };
      } else {
        const vQuality = quality === 'power' || quality === 'octave' ? quality : 'major';
        return { root: transposeNoteHelper(root, 7), quality: vQuality };
      }
    }

    case 'I-vi-ii-V': {
      const barInPattern = bar % 4;
      const useSevenths = quality !== 'power' && quality !== 'octave';
      if (barInPattern === 0) {
        // I chord: major 7th
        return { root, quality, extension: useSevenths ? '7' : undefined };
      } else if (barInPattern === 1) {
        // vi chord: minor 7th
        const viQuality = quality === 'power' || quality === 'octave' ? quality : 'minor';
        return { root: transposeNoteHelper(root, 9), quality: viQuality, extension: useSevenths ? '7' : undefined };
      } else if (barInPattern === 2) {
        // ii chord: minor 7th
        const iiQuality = quality === 'power' || quality === 'octave' ? quality : 'minor';
        return { root: transposeNoteHelper(root, 2), quality: iiQuality, extension: useSevenths ? '7' : undefined };
      } else {
        // V chord: dominant 7th
        const vQuality = quality === 'power' || quality === 'octave' ? quality : 'major';
        return { root: transposeNoteHelper(root, 7), quality: vQuality, extension: useSevenths ? 'dom7' : undefined };
      }
    }

    case 'I-vi-IV-V': {
      const barInPattern = bar % 4;
      if (barInPattern === 0) {
        return { root, quality };
      } else if (barInPattern === 1) {
        const viQuality = quality === 'power' || quality === 'octave' ? quality : 'minor';
        return { root: transposeNoteHelper(root, 9), quality: viQuality };
      } else if (barInPattern === 2) {
        return { root: transposeNoteHelper(root, 5), quality };
      } else {
        const vQuality = quality === 'power' || quality === 'octave' ? quality : 'major';
        return { root: transposeNoteHelper(root, 7), quality: vQuality };
      }
    }

    case 'rhythm-changes': {
      const barInPattern = bar % 32;
      
      if (barInPattern < 8 || (barInPattern >= 8 && barInPattern < 16) || barInPattern >= 24) {
        const aBarIndex = barInPattern < 8 ? barInPattern : (barInPattern < 16 ? barInPattern - 8 : barInPattern - 24);
        if (aBarIndex % 4 === 0) {
          return { root, quality };
        } else if (aBarIndex % 4 === 1) {
          const vi7Quality = quality === 'power' || quality === 'octave' ? quality : 'major';
          return { root: transposeNoteHelper(root, 9), quality: vi7Quality };
        } else if (aBarIndex % 4 === 2) {
          const iiQuality = quality === 'power' || quality === 'octave' ? quality : 'minor';
          return { root: transposeNoteHelper(root, 2), quality: iiQuality };
        } else {
          const vQuality = quality === 'power' || quality === 'octave' ? quality : 'major';
          return { root: transposeNoteHelper(root, 7), quality: vQuality };
        }
      } else {
        const bBarIndex = barInPattern - 16;
        if (bBarIndex < 2) {
          const iiiQuality = quality === 'power' || quality === 'octave' ? quality : 'major';
          return { root: transposeNoteHelper(root, 4), quality: iiiQuality };
        } else if (bBarIndex < 4) {
          const viQuality = quality === 'power' || quality === 'octave' ? quality : 'major';
          return { root: transposeNoteHelper(root, 9), quality: viQuality };
        } else if (bBarIndex < 6) {
          const iiQuality = quality === 'power' || quality === 'octave' ? quality : 'major';
          return { root: transposeNoteHelper(root, 2), quality: iiQuality };
        } else {
          const vQuality = quality === 'power' || quality === 'octave' ? quality : 'major';
          return { root: transposeNoteHelper(root, 7), quality: vQuality };
        }
      }
    }

    case 'autumn-leaves': {
      const barInPattern = bar % 8;
      const useSevenths = quality !== 'power' && quality !== 'octave';
      if (barInPattern === 0) {
        // ii chord: minor 7th
        const iiQuality = quality === 'power' || quality === 'octave' ? quality : 'minor';
        return { root: transposeNoteHelper(root, 2), quality: iiQuality, extension: useSevenths ? '7' : undefined };
      } else if (barInPattern === 1) {
        // V chord: dominant 7th
        const vQuality = quality === 'power' || quality === 'octave' ? quality : 'major';
        return { root: transposeNoteHelper(root, 7), quality: vQuality, extension: useSevenths ? 'dom7' : undefined };
      } else if (barInPattern === 2) {
        // I chord: major 7th
        return { root, quality, extension: useSevenths ? '7' : undefined };
      } else if (barInPattern === 3) {
        // IV chord: major 7th
        return { root: transposeNoteHelper(root, 5), quality, extension: useSevenths ? '7' : undefined };
      } else if (barInPattern === 4) {
        // vii chord: half-diminished 7th (diminished + minor 7th)
        const viiQuality = quality === 'power' || quality === 'octave' ? quality : 'diminished';
        return { root: transposeNoteHelper(root, 11), quality: viiQuality, extension: useSevenths ? '7' : undefined };
      } else if (barInPattern === 5) {
        // iii chord: minor 7th
        const iiiQuality = quality === 'power' || quality === 'octave' ? quality : 'minor';
        return { root: transposeNoteHelper(root, 4), quality: iiiQuality, extension: useSevenths ? '7' : undefined };
      } else {
        // vi chord: minor 7th
        const viQuality = quality === 'power' || quality === 'octave' ? quality : 'minor';
        return { root: transposeNoteHelper(root, 9), quality: viQuality, extension: useSevenths ? '7' : undefined };
      }
    }

    case 'i-VII-VI-V': {
      const barInPattern = bar % 4;
      if (barInPattern === 0) {
        const minorQuality = quality === 'power' || quality === 'octave' ? quality : 'minor';
        return { root, quality: minorQuality };
      } else if (barInPattern === 1) {
        const viiQuality = quality === 'power' || quality === 'octave' ? quality : 'major';
        return { root: transposeNoteHelper(root, 10), quality: viiQuality };
      } else if (barInPattern === 2) {
        const viQuality = quality === 'power' || quality === 'octave' ? quality : 'major';
        return { root: transposeNoteHelper(root, 8), quality: viQuality };
      } else {
        const vQuality = quality === 'power' || quality === 'octave' ? quality : 'major';
        return { root: transposeNoteHelper(root, 7), quality: vQuality };
      }
    }

    case 'i-iv-VII-III': {
      const barInPattern = bar % 4;
      if (barInPattern === 0) {
        const minorQuality = quality === 'power' || quality === 'octave' ? quality : 'minor';
        return { root, quality: minorQuality };
      } else if (barInPattern === 1) {
        const ivQuality = quality === 'power' || quality === 'octave' ? quality : 'minor';
        return { root: transposeNoteHelper(root, 5), quality: ivQuality };
      } else if (barInPattern === 2) {
        const viiQuality = quality === 'power' || quality === 'octave' ? quality : 'major';
        return { root: transposeNoteHelper(root, 10), quality: viiQuality };
      } else {
        const iiiQuality = quality === 'power' || quality === 'octave' ? quality : 'major';
        return { root: transposeNoteHelper(root, 3), quality: iiiQuality };
      }
    }

    case 'i-VI-III-VII': {
      const barInPattern = bar % 4;
      if (barInPattern === 0) {
        const minorQuality = quality === 'power' || quality === 'octave' ? quality : 'minor';
        return { root, quality: minorQuality };
      } else if (barInPattern === 1) {
        const viQuality = quality === 'power' || quality === 'octave' ? quality : 'major';
        return { root: transposeNoteHelper(root, 8), quality: viQuality };
      } else if (barInPattern === 2) {
        const iiiQuality = quality === 'power' || quality === 'octave' ? quality : 'major';
        return { root: transposeNoteHelper(root, 3), quality: iiiQuality };
      } else {
        const viiQuality = quality === 'power' || quality === 'octave' ? quality : 'major';
        return { root: transposeNoteHelper(root, 10), quality: viiQuality };
      }
    }

    case 'circle-of-fifths': {
      const barInPattern = bar % 8;
      const chords = [
        { semitones: 0, quality: quality },
        { semitones: 5, quality: quality },
        { semitones: 11, quality: quality === 'power' || quality === 'octave' ? quality : 'diminished' as ChordQuality },
        { semitones: 4, quality: quality === 'power' || quality === 'octave' ? quality : 'minor' as ChordQuality },
        { semitones: 9, quality: quality === 'power' || quality === 'octave' ? quality : 'minor' as ChordQuality },
        { semitones: 2, quality: quality === 'power' || quality === 'octave' ? quality : 'minor' as ChordQuality },
        { semitones: 7, quality: quality === 'power' || quality === 'octave' ? quality : 'major' as ChordQuality },
        { semitones: 0, quality: quality },
      ];
      const chord = chords[barInPattern];
      return { root: transposeNoteHelper(root, chord.semitones), quality: chord.quality };
    }

    default:
      return { root, quality };
  }
}

export function useDrone(
  root: string, 
  quality: ChordQuality,
  extension: ChordExtension = 'none',
  alteration: ChordAlteration = 'none',
  volume: number = 50,
  sound: DroneSound = 'hammond',
  mode: DroneMode = 'constant',
  tempo: number = 120,
  beatsPerMeasure: number = 4,
  progression: DroneProgression = 'none',
  currentBar: number = 0
) {
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorsRef = useRef<OscillatorNode[]>([]);
  const gainNodesRef = useRef<GainNode[]>([]);;
  const baseVolumesRef = useRef<number[]>([]);

  // Helper function to transpose a note by semitones
  const transposeNote = useCallback((baseNote: string, semitones: number): string => {
    return transposeNoteHelper(baseNote, semitones);
  }, []);

  const getChordIntervals = useCallback((
    quality: ChordQuality,
    extension: ChordExtension,
    alteration: ChordAlteration
  ): number[] => {
    let intervals: number[] = [];
    
    // Base triad
    switch (quality) {
      case 'major':
        intervals = [0, 4, 7];
        break;
      case 'minor':
        intervals = [0, 3, 7];
        break;
      case 'diminished':
        intervals = [0, 3, 6];
        break;
      case 'augmented':
        intervals = [0, 4, 8];
        break;
      case 'power':
        intervals = [0, 7];
        break;
      case 'octave':
        intervals = [0, 12];
        break;
    }
    
    // Apply alterations to 5th (not applicable to power or octave)
    if (quality !== 'power' && quality !== 'octave') {
      if (alteration === 'b5' && quality !== 'diminished' && quality !== 'augmented') {
        intervals[2] = 6;
      } else if (alteration === '#5' && quality !== 'augmented') {
        intervals[2] = 8;
      }
    }
    
    // Add extensions (not applicable to power or octave chords)
    if (quality !== 'power' && quality !== 'octave') {
      switch (extension) {
        case '6':
          intervals.push(9);
          break;
        case '7':
          // Major 7th for major chords, minor 7th for others
          if (quality === 'major') {
            intervals.push(11); // Major 7th
          } else if (quality === 'diminished') {
            intervals.push(9); // Diminished 7th
          } else {
            intervals.push(10); // Minor 7th
          }
          break;
        case 'dom7':
          // Dominant 7th: always uses minor 7th (10 semitones)
          intervals.push(10);
          break;
        case '9':
          if (quality === 'major') {
            intervals.push(11);
          } else {
            intervals.push(10);
          }
          if (alteration === 'b9') {
            intervals.push(13);
          } else if (alteration === '#9') {
            intervals.push(15);
          } else {
            intervals.push(14);
          }
          break;
        case '11':
          if (quality === 'major') {
            intervals.push(11);
          } else {
            intervals.push(10);
          }
          intervals.push(14);
          intervals.push(17);
          break;
        case '13':
          if (quality === 'major') {
            intervals.push(11);
          } else {
            intervals.push(10);
          }
          intervals.push(14);
          intervals.push(21);
          break;
      }
    }
    
    return intervals;
  }, []);

  const startDrone = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }

    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }

    // Stop any existing oscillators
    oscillatorsRef.current.forEach(osc => osc.stop());
    oscillatorsRef.current = [];
    gainNodesRef.current = [];
    baseVolumesRef.current = [];

    // Get the current chord based on progression
    const currentChord = getProgressionChord(currentBar, root, quality, progression);
    const rootFreq = noteFrequencies[currentChord.root];
    // Use the extension from the progression if available, otherwise use the user-selected one
    const effectiveExtension = currentChord.extension || extension;
    const intervals = getChordIntervals(currentChord.quality, effectiveExtension, alteration);

    // Play chord across multiple octaves for richer sound
    const octaves = [0, 1, 2];
    
    octaves.forEach((octaveShift) => {
      intervals.forEach((interval, index) => {
        const osc = audioContextRef.current!.createOscillator();
        const gain = audioContextRef.current!.createGain();

        // Calculate frequency for this note with octave shift
        const frequency = rootFreq * Math.pow(2, interval / 12) * Math.pow(2, octaveShift);
        osc.frequency.value = frequency;
        
        // Set oscillator type based on sound selection
        switch (sound) {
          case 'hammond':
          case 'organ':
            osc.type = 'sine';
            break;
          case 'piano':
            osc.type = 'triangle';
            break;
          case 'horns':
            osc.type = 'sawtooth';
            break;
          case 'guitar':
            osc.type = 'triangle';
            break;
          case 'strings':
            osc.type = 'sawtooth';
            break;
        }

        // Set base gain (volume) levels
        let volumeLevel = 0.03;
        if (octaveShift === 0) {
          volumeLevel = 0.02;
        } else if (octaveShift === 1) {
          volumeLevel = 0.015;
        } else {
          volumeLevel = 0.01;
        }
        
        // Adjust volume based on sound type
        if (sound === 'piano' || sound === 'guitar') {
          volumeLevel *= 1.5;
        } else if (sound === 'horns') {
          volumeLevel *= 1.2;
        } else if (sound === 'strings') {
          volumeLevel *= 0.8;
        }
        
        // Store base volume and apply user volume control
        baseVolumesRef.current.push(volumeLevel);
        
        // For constant mode, start at full volume
        // For per-beat/per-bar, start at 0 and trigger will ramp up
        if (mode === 'constant') {
          gain.gain.value = volumeLevel * (volume / 100);
        } else {
          gain.gain.value = 0;
        }

        osc.connect(gain);
        gain.connect(audioContextRef.current!.destination);

        osc.start();

        oscillatorsRef.current.push(osc);
        gainNodesRef.current.push(gain);
      });
    });
  }, [root, quality, extension, alteration, volume, sound, mode, getChordIntervals, currentBar, progression]);

  const stopDrone = useCallback(() => {
    oscillatorsRef.current.forEach(osc => {
      try {
        osc.stop();
      } catch (e) {
        // Oscillator may already be stopped
      }
    });
    oscillatorsRef.current = [];
    gainNodesRef.current = [];
    baseVolumesRef.current = [];
  }, []);

  // Trigger a sound (for per-beat or per-bar modes)
  const triggerDrone = useCallback(() => {
    if (!audioContextRef.current || mode === 'constant') return;
    
    const now = audioContextRef.current.currentTime;
    const attackTime = sound === 'strings' ? 0.05 : 0.01;
    
    // Calculate bar duration for per-bar mode
    let releaseTime: number;
    if (mode === 'per-bar') {
      // Duration of one full bar in seconds
      const secondsPerBeat = 60.0 / tempo;
      const barDuration = secondsPerBeat * beatsPerMeasure;
      // Fade over the entire bar minus attack time
      releaseTime = barDuration - attackTime;
    } else {
      // Per-beat mode uses fixed release times
      releaseTime = sound === 'piano' || sound === 'guitar' ? 0.5 : sound === 'strings' ? 0.3 : 0.1;
    }
    
    gainNodesRef.current.forEach((gain, index) => {
      const baseVolume = baseVolumesRef.current[index] || 0.015;
      const targetVolume = baseVolume * (volume / 100);
      
      // Cancel any scheduled values
      gain.gain.cancelScheduledValues(now);
      
      // Attack
      gain.gain.setValueAtTime(gain.gain.value, now);
      if (sound === 'strings') {
        // Slow attack for strings
        gain.gain.linearRampToValueAtTime(targetVolume, now + attackTime);
      } else {
        // Quick attack for others
        gain.gain.linearRampToValueAtTime(targetVolume, now + attackTime);
      }
      
      // Release/decay
      if (mode === 'per-bar') {
        // Slow linear fade to the end of the bar
        gain.gain.linearRampToValueAtTime(0, now + attackTime + releaseTime);
      } else {
        // Per-beat mode: decay for plucked instruments, shorter sustain for others
        if (sound === 'piano' || sound === 'guitar') {
          gain.gain.exponentialRampToValueAtTime(0.001, now + attackTime + releaseTime);
        } else if (sound === 'strings') {
          gain.gain.linearRampToValueAtTime(targetVolume * 0.7, now + attackTime + 0.1);
          gain.gain.linearRampToValueAtTime(0, now + attackTime + releaseTime);
        } else {
          gain.gain.linearRampToValueAtTime(0, now + attackTime + releaseTime);
        }
      }
    });
  }, [volume, sound, mode, tempo, beatsPerMeasure]);

  // Update volume without restarting oscillators
  useEffect(() => {
    if (mode === 'constant') {
      gainNodesRef.current.forEach((gain, index) => {
        const baseVolume = baseVolumesRef.current[index] || 0.015;
        gain.gain.setValueAtTime(baseVolume * (volume / 100), audioContextRef.current?.currentTime || 0);
      });
    }
  }, [volume, mode]);

  return { startDrone, stopDrone, triggerDrone };
}