import { Play, Pause } from 'lucide-react';

interface MetronomeControlsProps {
  tempo: number;
  setTempo: (tempo: number) => void;
  swing: number;
  setSwing: (swing: number) => void;
  beatsPerMeasure: number;
  setBeatsPerMeasure: (beats: number) => void;
  isPlaying: boolean;
  onPlayPause: () => void;
}

const commonTimeSignatures = [
  { label: '2/4', value: 2 },
  { label: '3/4', value: 3 },
  { label: '4/4', value: 4 },
  { label: '5/4', value: 5 },
  { label: '6/8', value: 6 },
  { label: '7/8', value: 7 },
  { label: '9/8', value: 9 },
  { label: '12/8', value: 12 },
];

export function MetronomeControls({
  tempo,
  setTempo,
  swing,
  setSwing,
  beatsPerMeasure,
  setBeatsPerMeasure,
  isPlaying,
  onPlayPause,
}: MetronomeControlsProps) {
  const handleTempoChange = (value: string) => {
    const newTempo = parseInt(value);
    if (newTempo >= 20 && newTempo <= 300) {
      setTempo(newTempo);
    }
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur rounded-2xl p-6 border border-slate-700 space-y-6">
      {/* Tempo Slider */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <label className="text-sm text-slate-400 uppercase tracking-wider">Tempo</label>
          <input
            type="number"
            value={tempo}
            onChange={(e) => handleTempoChange(e.target.value)}
            className="w-20 bg-slate-700 border border-slate-600 rounded-lg px-3 py-1 text-right"
            min="20"
            max="300"
          />
        </div>
        <input
          type="range"
          min="20"
          max="300"
          value={tempo}
          onChange={(e) => setTempo(parseInt(e.target.value))}
          className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
        />
        <div className="flex justify-between text-xs text-slate-500">
          <span>20</span>
          <span>300</span>
        </div>
      </div>

      {/* Time Signature */}
      <div className="space-y-3">
        <label className="text-sm text-slate-400 uppercase tracking-wider">Time Signature</label>
        <div className="grid grid-cols-4 gap-2">
          {commonTimeSignatures.map((sig) => (
            <button
              key={sig.value}
              onClick={() => setBeatsPerMeasure(sig.value)}
              className={`py-2 px-3 rounded-lg transition-colors ${
                beatsPerMeasure === sig.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {sig.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2 items-center">
          <input
            type="number"
            value={beatsPerMeasure}
            onChange={(e) => {
              const val = parseInt(e.target.value);
              if (val >= 1 && val <= 16) setBeatsPerMeasure(val);
            }}
            className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2"
            min="1"
            max="16"
            placeholder="Custom"
          />
          <span className="text-slate-400">beats</span>
        </div>
      </div>

      {/* Swing */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <label className="text-sm text-slate-400 uppercase tracking-wider">Swing</label>
          <span className="text-slate-300">{swing}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={swing}
          onChange={(e) => setSwing(parseInt(e.target.value))}
          className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
        />
        <div className="flex justify-between text-xs text-slate-500">
          <span>Straight</span>
          <span>Max Swing</span>
        </div>
      </div>

      {/* Play/Pause Button */}
      <button
        onClick={onPlayPause}
        className={`w-full py-4 rounded-xl flex items-center justify-center gap-3 transition-all ${
          isPlaying
            ? 'bg-red-600 hover:bg-red-700'
            : 'bg-green-600 hover:bg-green-700'
        }`}
      >
        {isPlaying ? (
          <>
            <Pause size={24} fill="white" />
            <span className="text-lg">Stop</span>
          </>
        ) : (
          <>
            <Play size={24} fill="white" />
            <span className="text-lg">Start</span>
          </>
        )}
      </button>
    </div>
  );
}
