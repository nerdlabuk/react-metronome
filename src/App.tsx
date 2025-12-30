import { useState, useEffect, useRef } from 'react';
import { MetronomeControls } from './components/MetronomeControls';
import { DroneControls } from './components/DroneControls';
import { TempoDisplay } from './components/TempoDisplay';
import { useMetronome } from './hooks/useMetronome';
import { useDrone, ChordQuality, ChordExtension, ChordAlteration, DroneSound, DroneMode, DroneProgression } from './hooks/useDrone';

export default function App() {
  const [tempo, setTempo] = useState(120);
  const [swing, setSwing] = useState(0);
  const [beatsPerMeasure, setBeatsPerMeasure] = useState(4);
  const [isPlaying, setIsPlaying] = useState(false);
  const [droneEnabled, setDroneEnabled] = useState(false);
  const [droneRoot, setDroneRoot] = useState('C');
  const [droneQuality, setDroneQuality] = useState<ChordQuality>('major');
  const [droneExtension, setDroneExtension] = useState<ChordExtension>('none');
  const [droneAlteration, setDroneAlteration] = useState<ChordAlteration>('none');
  const [droneVolume, setDroneVolume] = useState(50);
  const [droneSound, setDroneSound] = useState<DroneSound>('hammond');
  const [droneMode, setDroneMode] = useState<DroneMode>('constant');
  const [droneProgression, setDroneProgression] = useState<DroneProgression>('none');
  const [currentBar, setCurrentBar] = useState(0);

  const { startMetronome, stopMetronome, currentBeat } = useMetronome(tempo, swing, beatsPerMeasure);
  const { startDrone, stopDrone, triggerDrone } = useDrone(droneRoot, droneQuality, droneExtension, droneAlteration, droneVolume, droneSound, droneMode, tempo, beatsPerMeasure, droneProgression, currentBar);

  // Use refs to store the latest drone functions to avoid dependency issues
  const droneActionsRef = useRef({ startDrone, stopDrone, triggerDrone });
  
  useEffect(() => {
    droneActionsRef.current = { startDrone, stopDrone, triggerDrone };
  }, [startDrone, stopDrone, triggerDrone]);

  const handlePlayPause = () => {
    if (isPlaying) {
      stopMetronome();
      if (droneEnabled) {
        stopDrone();
      }
      setIsPlaying(false);
      setCurrentBar(0); // Reset bar counter when stopping
    } else {
      setCurrentBar(0); // Reset bar counter when starting
      startMetronome();
      if (droneEnabled) {
        startDrone();
      }
      setIsPlaying(true);
    }
  };

  useEffect(() => {
    if (droneEnabled && isPlaying) {
      droneActionsRef.current.startDrone();
      // Immediately trigger the new sound for per-beat and per-bar modes
      if (droneMode !== 'constant') {
        // Use setTimeout to ensure oscillators are created first
        setTimeout(() => {
          droneActionsRef.current.triggerDrone();
        }, 10);
      }
    } else {
      droneActionsRef.current.stopDrone();
    }
    
    return () => droneActionsRef.current.stopDrone();
  }, [droneEnabled, droneRoot, droneQuality, droneExtension, droneAlteration, droneSound, droneMode, droneProgression, isPlaying]);

  // Trigger drone on beat changes (for per-beat and per-bar modes)
  useEffect(() => {
    if (!droneEnabled || !isPlaying) return;
    
    // Track bar changes (beat 1 = new bar)
    if (currentBeat === 0) {
      setCurrentBar(prev => prev + 1);
      
      // Restart drone for progression changes
      if (droneProgression !== 'none') {
        droneActionsRef.current.stopDrone();
        setTimeout(() => {
          droneActionsRef.current.startDrone();
          if (droneMode === 'per-bar') {
            setTimeout(() => droneActionsRef.current.triggerDrone(), 10);
          } else if (droneMode === 'per-beat') {
            // Also trigger for per-beat on beat 1 when progression is active
            setTimeout(() => droneActionsRef.current.triggerDrone(), 10);
          }
        }, 10);
      } else if (droneMode === 'per-beat') {
        // No progression, just trigger beat 1 normally
        droneActionsRef.current.triggerDrone();
      } else if (droneMode === 'per-bar') {
        // Only trigger if not using progression (progression handles it above)
        droneActionsRef.current.triggerDrone();
      }
    } else if (droneMode === 'per-beat') {
      // Trigger on beats 2, 3, 4, etc.
      droneActionsRef.current.triggerDrone();
    }
  }, [currentBeat, droneEnabled, isPlaying, droneMode, droneProgression]);

  useEffect(() => {
    if (isPlaying) {
      stopMetronome();
      startMetronome();
    }
  }, [tempo, swing, beatsPerMeasure]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white p-4 pb-8">
      <div className="max-w-md mx-auto space-y-6">
        {/* Tempo Display */}
        <TempoDisplay 
          tempo={tempo} 
          isPlaying={isPlaying} 
          currentBeat={currentBeat} 
          beatsPerMeasure={beatsPerMeasure}
          droneEnabled={droneEnabled}
          droneRoot={droneRoot}
          droneQuality={droneQuality}
          droneExtension={droneExtension}
          droneAlteration={droneAlteration}
          droneProgression={droneProgression}
          currentBar={currentBar}
        />

        {/* Main Controls */}
        <MetronomeControls
          tempo={tempo}
          setTempo={setTempo}
          swing={swing}
          setSwing={setSwing}
          beatsPerMeasure={beatsPerMeasure}
          setBeatsPerMeasure={setBeatsPerMeasure}
          isPlaying={isPlaying}
          onPlayPause={handlePlayPause}
        />

        {/* Drone Controls */}
        <DroneControls
          enabled={droneEnabled}
          setEnabled={setDroneEnabled}
          root={droneRoot}
          setRoot={setDroneRoot}
          quality={droneQuality}
          setQuality={setDroneQuality}
          extension={droneExtension}
          setExtension={setDroneExtension}
          alteration={droneAlteration}
          setAlteration={setDroneAlteration}
          volume={droneVolume}
          setVolume={setDroneVolume}
          sound={droneSound}
          setSound={setDroneSound}
          mode={droneMode}
          setMode={setDroneMode}
          progression={droneProgression}
          setProgression={setDroneProgression}
        />
      </div>
    </div>
  );
}