import { useEffect, useState } from 'react';
import { getProgressionChord, formatChordName, ChordQuality, ChordExtension, ChordAlteration, DroneProgression } from '../hooks/useDrone';

interface TempoDisplayProps {
  tempo: number;
  isPlaying: boolean;
  currentBeat: number;
  beatsPerMeasure: number;
  droneEnabled: boolean;
  droneRoot: string;
  droneQuality: ChordQuality;
  droneExtension: ChordExtension;
  droneAlteration: ChordAlteration;
  droneProgression: DroneProgression;
  currentBar: number;
}

export function TempoDisplay({ tempo, isPlaying, currentBeat, beatsPerMeasure, droneEnabled, droneRoot, droneQuality, droneExtension, droneAlteration, droneProgression, currentBar }: TempoDisplayProps) {
  const [flash, setFlash] = useState<'none' | 'white' | 'green'>('none');
  
  // Get current and next chords
  const currentChord = droneEnabled && droneProgression !== 'none' 
    ? getProgressionChord(currentBar, droneRoot, droneQuality, droneProgression)
    : null;
  
  const nextChord = droneEnabled && droneProgression !== 'none'
    ? getProgressionChord(currentBar + 1, droneRoot, droneQuality, droneProgression)
    : null;
  
  const currentChordName = currentChord 
    ? formatChordName(currentChord.root, currentChord.quality, currentChord.extension || droneExtension, droneAlteration)
    : '';
  
  const nextChordName = nextChord 
    ? formatChordName(nextChord.root, nextChord.quality, nextChord.extension || droneExtension, droneAlteration)
    : '';
  
  useEffect(() => {
    if (isPlaying) {
      // Trigger flash on beat
      if (currentBeat === 0) {
        setFlash('white');
      } else {
        setFlash('green');
      }
      
      // Fade out flash
      const timer = setTimeout(() => setFlash('none'), 400);
      return () => clearTimeout(timer);
    }
  }, [currentBeat, isPlaying]);

  const progress = isPlaying ? (currentBeat / beatsPerMeasure) * 100 : 0;
  const circleSize = 280;
  const strokeWidth = 20;
  const radius = (circleSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="flex justify-center items-center py-8">
      <div className="relative" style={{ width: circleSize, height: circleSize }}>
        <svg
          width={circleSize}
          height={circleSize}
          className="transform -rotate-90"
        >
          {/* Background circle */}
          <circle
            cx={circleSize / 2}
            cy={circleSize / 2}
            r={radius}
            fill="none"
            stroke="rgb(30, 41, 59)"
            strokeWidth={strokeWidth}
          />
          
          {/* Beat segments */}
          {Array.from({ length: beatsPerMeasure }).map((_, index) => {
            const segmentAngle = 360 / beatsPerMeasure;
            const startAngle = index * segmentAngle;
            const endAngle = startAngle + segmentAngle;
            
            // Calculate segment path
            const startRad = (startAngle * Math.PI) / 180;
            const endRad = (endAngle * Math.PI) / 180;
            
            const innerRadius = radius - strokeWidth / 2;
            const outerRadius = radius + strokeWidth / 2;
            
            const x1 = circleSize / 2 + innerRadius * Math.cos(startRad);
            const y1 = circleSize / 2 + innerRadius * Math.sin(startRad);
            const x2 = circleSize / 2 + outerRadius * Math.cos(startRad);
            const y2 = circleSize / 2 + outerRadius * Math.sin(startRad);
            
            return (
              <line
                key={index}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="rgb(15, 23, 42)"
                strokeWidth="2"
              />
            );
          })}
          
          {/* Progress circle - soothing green */}
          <circle
            cx={circleSize / 2}
            cy={circleSize / 2}
            r={radius}
            fill="none"
            stroke="rgb(52, 211, 153)"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={circumference - (progress / 100) * circumference}
            strokeLinecap="round"
            className="transition-all duration-75 ease-linear"
          />
          
          {/* Flash overlay */}
          {flash !== 'none' && (
            <circle
              cx={circleSize / 2}
              cy={circleSize / 2}
              r={radius}
              fill="none"
              stroke={flash === 'white' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(52, 211, 153, 0.6)'}
              strokeWidth={strokeWidth}
              className="animate-pulse"
              style={{
                animation: 'flashFade 0.4s ease-out'
              }}
            />
          )}
        </svg>
        
        {/* Tempo number in center */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-7xl tabular-nums tracking-tight">{tempo}</div>
          <div className="text-slate-400 uppercase tracking-wider text-sm mt-2">BPM</div>
          {/* Chord display - side by side */}
          {currentChordName && isPlaying && (
            <div className="mt-4 flex items-center gap-4">
              <div className="text-center">
                <div className="text-emerald-400 text-xs uppercase tracking-wider mb-1">Now</div>
                <div className="text-xl">{currentChordName}</div>
              </div>
              {nextChordName && nextChordName !== currentChordName && (
                <>
                  <div className="text-slate-600">→</div>
                  <div className="text-center">
                    <div className="text-slate-500 text-xs uppercase tracking-wider mb-1">Next</div>
                    <div className="text-slate-400">{nextChordName}</div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
      
      <style>{`
        @keyframes flashFade {
          0% {
            opacity: 1;
          }
          100% {
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}