import { ChordQuality, ChordExtension, ChordAlteration, DroneSound, DroneMode, DroneProgression } from '../hooks/useDrone';

interface DroneControlsProps {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
  root: string;
  setRoot: (root: string) => void;
  quality: ChordQuality;
  setQuality: (quality: ChordQuality) => void;
  extension: ChordExtension;
  setExtension: (extension: ChordExtension) => void;
  alteration: ChordAlteration;
  setAlteration: (alteration: ChordAlteration) => void;
  volume: number;
  setVolume: (volume: number) => void;
  sound: DroneSound;
  setSound: (sound: DroneSound) => void;
  mode: DroneMode;
  setMode: (mode: DroneMode) => void;
  progression: DroneProgression;
  setProgression: (progression: DroneProgression) => void;
}

const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const qualities: Array<{ label: string; value: ChordQuality }> = [
  { label: 'Maj', value: 'major' },
  { label: 'Min', value: 'minor' },
  { label: 'Aug', value: 'augmented' },
  { label: 'Dim', value: 'diminished' },
  { label: 'Power', value: 'power' },
  { label: 'Octave', value: 'octave' },
];

const extensions: Array<{ label: string; value: ChordExtension }> = [
  { label: 'Triad', value: 'none' },
  { label: '6', value: '6' },
  { label: '7', value: '7' },
  { label: 'dom7', value: 'dom7' },
  { label: '9', value: '9' },
  { label: '11', value: '11' },
  { label: '13', value: '13' },
];

const alterations: Array<{ label: string; value: ChordAlteration }> = [
  { label: 'Natural', value: 'none' },
  { label: '♭5', value: 'b5' },
  { label: '#5', value: '#5' },
  { label: '♭9', value: 'b9' },
  { label: '#9', value: '#9' },
];

const sounds: Array<{ label: string; value: DroneSound }> = [
  { label: 'Hammond', value: 'hammond' },
  { label: 'Organ', value: 'organ' },
  { label: 'Piano', value: 'piano' },
  { label: 'Horns', value: 'horns' },
  { label: 'Guitar', value: 'guitar' },
  { label: 'Strings', value: 'strings' },
];

const modes: Array<{ label: string; value: DroneMode }> = [
  { label: 'Constant', value: 'constant' },
  { label: 'Per Beat', value: 'per-beat' },
  { label: 'Per Bar', value: 'per-bar' },
];

const progressions: Array<{ label: string; value: DroneProgression }> = [
  { label: 'None', value: 'none' },
  { label: 'I-IV-V', value: 'I-IV-V' },
  { label: 'ii-V-I', value: 'ii-V-I' },
  { label: '12 Bar Blues', value: '12-bar-blues' },
  { label: '8 Bar Blues', value: '8-bar-blues' },
  { label: 'I-V-vi-IV', value: 'I-V-vi-IV' },
  { label: 'vi-IV-I-V', value: 'vi-IV-I-V' },
  { label: 'I-vi-ii-V', value: 'I-vi-ii-V' },
  { label: 'I-vi-IV-V', value: 'I-vi-IV-V' },
  { label: 'Rhythm Changes', value: 'rhythm-changes' },
  { label: 'Autumn Leaves', value: 'autumn-leaves' },
  { label: 'i-VII-VI-V', value: 'i-VII-VI-V' },
  { label: 'i-iv-VII-III', value: 'i-iv-VII-III' },
  { label: 'i-VI-III-VII', value: 'i-VI-III-VII' },
  { label: 'Circle of Fifths', value: 'circle-of-fifths' },
];

// Function to determine if an extension is valid for a given quality
function isExtensionValid(quality: ChordQuality, extension: ChordExtension): boolean {
  if (extension === 'none') return true;
  
  // Power and octave chords don't support extensions
  if (quality === 'power' || quality === 'octave') return false;
  
  // dom7 is only for major quality (dominant 7th = major triad + minor 7th)
  if (extension === 'dom7') {
    return quality === 'major';
  }
  
  // Augmented and diminished chords typically only use 7th extensions
  if (quality === 'augmented' || quality === 'diminished') {
    return extension === '7';
  }
  
  // All other extensions valid for major and minor
  return true;
}

// Function to determine if an alteration is valid
function isAlterationValid(
  quality: ChordQuality, 
  extension: ChordExtension, 
  alteration: ChordAlteration
): boolean {
  if (alteration === 'none') return true;
  
  // Power and octave chords don't support alterations
  if (quality === 'power' || quality === 'octave') return false;
  
  // b5 and #5 alterations
  if (alteration === 'b5') {
    // Don't allow b5 on diminished (already has b5) or augmented (has #5)
    if (quality === 'diminished' || quality === 'augmented') return false;
    // b5 works with 7th extensions
    return extension === '7' || extension === '9' || extension === '11' || extension === '13';
  }
  
  if (alteration === '#5') {
    // Don't allow #5 on augmented (already has #5)
    if (quality === 'augmented') return false;
    // #5 works with 7th extensions
    return extension === '7' || extension === '9' || extension === '11' || extension === '13';
  }
  
  // b9 and #9 alterations only work with extended chords
  if (alteration === 'b9' || alteration === '#9') {
    return extension === '9' || extension === '11' || extension === '13';
  }
  
  return false;
}

// Generate chord symbol
function getChordSymbol(
  root: string,
  quality: ChordQuality,
  extension: ChordExtension,
  alteration: ChordAlteration
): string {
  let symbol = root;
  
  // Add quality
  if (quality === 'minor') symbol += 'm';
  else if (quality === 'augmented') symbol += '+';
  else if (quality === 'diminished') symbol += '°';
  else if (quality === 'power') symbol += '5';
  else if (quality === 'octave') return symbol; // Just return root for octave
  
  // Add extension
  if (extension !== 'none') {
    if (quality === 'major' && extension === '7') {
      symbol += 'maj7';
    } else if (quality === 'diminished' && extension === '7') {
      symbol += '7';
    } else {
      symbol += extension;
    }
  }
  
  // Add alteration
  if (alteration !== 'none') {
    if (alteration === 'b5') symbol += '♭5';
    else if (alteration === '#5') symbol += '#5';
    else if (alteration === 'b9') symbol += '♭9';
    else if (alteration === '#9') symbol += '#9';
  }
  
  return symbol;
}

export function DroneControls({
  enabled,
  setEnabled,
  root,
  setRoot,
  quality,
  setQuality,
  extension,
  setExtension,
  alteration,
  setAlteration,
  volume,
  setVolume,
  sound,
  setSound,
  mode,
  setMode,
  progression,
  setProgression,
}: DroneControlsProps) {
  const handleQualityChange = (newQuality: ChordQuality) => {
    setQuality(newQuality);
    // Reset extension if not valid
    if (!isExtensionValid(newQuality, extension)) {
      setExtension('none');
    }
    // Reset alteration if not valid
    if (!isAlterationValid(newQuality, extension, alteration)) {
      setAlteration('none');
    }
  };

  const handleExtensionChange = (newExtension: ChordExtension) => {
    setExtension(newExtension);
    // Reset alteration if not valid
    if (!isAlterationValid(quality, newExtension, alteration)) {
      setAlteration('none');
    }
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur rounded-2xl p-6 border border-slate-700 space-y-6">
      {/* Header with toggle */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl">
            Drone {enabled && `- ${getChordSymbol(root, quality, extension, alteration)}`}
          </h2>
          <p className="text-sm text-slate-400">Background chord</p>
        </div>
        <button
          onClick={() => setEnabled(!enabled)}
          className={`relative w-14 h-8 rounded-full transition-colors ${
            enabled ? 'bg-green-600' : 'bg-slate-700'
          }`}
        >
          <div
            className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
              enabled ? 'translate-x-6' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {enabled && (
        <>
          {/* Volume Slider */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-sm text-slate-400 uppercase tracking-wider">Volume</label>
              <span className="text-slate-300">{volume}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={(e) => setVolume(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <div className="flex justify-between text-xs text-slate-500">
              <span>Silent</span>
              <span>Max</span>
            </div>
          </div>

          {/* Sound Type */}
          <div className="space-y-3">
            <label className="text-sm text-slate-400 uppercase tracking-wider">Sound</label>
            <div className="grid grid-cols-3 gap-2">
              {sounds.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setSound(s.value)}
                  className={`py-2 px-3 rounded-lg transition-colors ${
                    sound === s.value
                      ? 'bg-cyan-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Mode */}
          <div className="space-y-3">
            <label className="text-sm text-slate-400 uppercase tracking-wider">Mode</label>
            <div className="grid grid-cols-3 gap-2">
              {modes.map((m) => (
                <button
                  key={m.value}
                  onClick={() => setMode(m.value)}
                  className={`py-2 px-3 rounded-lg transition-colors ${
                    mode === m.value
                      ? 'bg-pink-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Progression */}
          <div className="space-y-3">
            <label className="text-sm text-slate-400 uppercase tracking-wider">Progression</label>
            <div className="grid grid-cols-3 gap-2">
              {progressions.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setProgression(p.value)}
                  className={`py-2 px-3 rounded-lg transition-colors ${
                    progression === p.value
                      ? 'bg-yellow-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Root Note */}
          <div className="space-y-3">
            <label className="text-sm text-slate-400 uppercase tracking-wider">Root Note</label>
            <div className="grid grid-cols-6 gap-2">
              {notes.map((note) => (
                <button
                  key={note}
                  onClick={() => setRoot(note)}
                  className={`py-2 px-3 rounded-lg transition-colors ${
                    root === note
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {note}
                </button>
              ))}
            </div>
          </div>

          {/* Quality */}
          <div className="space-y-3">
            <label className="text-sm text-slate-400 uppercase tracking-wider">Quality</label>
            <div className="grid grid-cols-3 gap-2">
              {qualities.map((q) => (
                <button
                  key={q.value}
                  onClick={() => handleQualityChange(q.value)}
                  className={`py-3 px-4 rounded-lg transition-colors ${
                    quality === q.value
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {q.label}
                </button>
              ))}
            </div>
          </div>

          {/* Extension */}
          <div className="space-y-3">
            <label className="text-sm text-slate-400 uppercase tracking-wider">Extension</label>
            <div className="grid grid-cols-3 gap-2">
              {extensions.map((ext) => {
                const valid = isExtensionValid(quality, ext.value);
                return (
                  <button
                    key={ext.value}
                    onClick={() => valid && handleExtensionChange(ext.value)}
                    disabled={!valid}
                    className={`py-3 px-4 rounded-lg transition-colors ${
                      extension === ext.value
                        ? 'bg-emerald-600 text-white'
                        : valid
                        ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    {ext.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Alteration */}
          <div className="space-y-3">
            <label className="text-sm text-slate-400 uppercase tracking-wider">Alteration</label>
            <div className="grid grid-cols-3 gap-2">
              {alterations.map((alt) => {
                const valid = isAlterationValid(quality, extension, alt.value);
                return (
                  <button
                    key={alt.value}
                    onClick={() => valid && setAlteration(alt.value)}
                    disabled={!valid}
                    className={`py-3 px-4 rounded-lg transition-colors ${
                      alteration === alt.value
                        ? 'bg-orange-600 text-white'
                        : valid
                        ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    {alt.label}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}