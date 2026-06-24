import { useState, useEffect } from 'react';
import { Play, Pause, SkipForward, Volume2, VolumeX, Music } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Track {
  name: string;
  tempo: number;
  bass: number[];
  lead: number[];
}

const TRACKS: Track[] = [
  {
    name: 'BREACH_THE_MAIN_FRAME.syn',
    tempo: 130,
    bass: [33, 33, 33, 33, 37, 37, 37, 37, 38, 38, 38, 38, 35, 35, 35, 35], // Am - F - G - Em (MIDI notes)
    lead: [57, 60, 64, 60, 62, 65, 69, 65, 64, 67, 71, 67, 59, 62, 66, 62]
  },
  {
    name: 'NEON_INTRUDER_2077.syn',
    tempo: 140,
    bass: [33, 33, 33, 33, 41, 41, 41, 41, 38, 38, 38, 38, 36, 36, 36, 36],
    lead: [69, 72, 76, 79, 69, 72, 76, 79, 67, 71, 74, 77, 65, 69, 72, 76]
  },
  {
    name: 'CHILL_CYBER_DECK.syn',
    tempo: 110,
    bass: [29, 29, 29, 29, 31, 31, 31, 31, 33, 33, 33, 33, 33, 33, 33, 33],
    lead: [57, 60, 62, 64, 57, 60, 62, 64, 59, 62, 64, 67, 59, 62, 64, 67]
  }
];

class SynthSequencer {
  audioCtx: AudioContext | null = null;
  masterGain: GainNode | null = null;
  isPlaying: boolean = false;
  tempo: number = 120;
  nextNoteTime: number = 0.0;
  currentStep: number = 0;
  intervalId: any = null;
  trackIndex: number = 0;
  volume: number = 0.15;

  init() {
    if (this.audioCtx) return;
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    this.audioCtx = new AudioContextClass();
    this.masterGain = this.audioCtx.createGain();
    this.masterGain.gain.setValueAtTime(this.volume, this.audioCtx.currentTime);
    this.masterGain.connect(this.audioCtx.destination);
  }

  setVolume(vol: number) {
    this.volume = vol;
    if (this.masterGain && this.audioCtx) {
      this.masterGain.gain.setValueAtTime(vol, this.audioCtx.currentTime);
    }
  }

  start(trackIndex: number, onStepChange?: (step: number) => void) {
    this.init();
    if (this.isPlaying) {
      this.stop();
    }
    
    this.isPlaying = true;
    this.trackIndex = trackIndex;
    this.tempo = TRACKS[trackIndex].tempo;
    this.currentStep = 0;

    if (this.audioCtx) {
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      this.nextNoteTime = this.audioCtx.currentTime + 0.05;
    }
    
    this.intervalId = setInterval(() => {
      this.scheduler(onStepChange);
    }, 45);
  }

  stop() {
    this.isPlaying = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  scheduler(onStepChange?: (step: number) => void) {
    if (!this.audioCtx) return;
    const scheduleAheadTime = 0.1;
    while (this.nextNoteTime < this.audioCtx.currentTime + scheduleAheadTime) {
      this.scheduleNote(this.currentStep, this.nextNoteTime);
      
      if (onStepChange) {
        // Trigger step update for visual equalizer
        onStepChange(this.currentStep);
      }
      
      this.advanceNote();
    }
  }

  advanceNote() {
    const secondsPerBeat = 60.0 / this.tempo;
    const stepDuration = secondsPerBeat / 4; // sixteenth notes
    this.nextNoteTime += stepDuration;
    this.currentStep = (this.currentStep + 1) % 16;
  }

  scheduleNote(step: number, time: number) {
    if (!this.audioCtx || !this.masterGain) return;
    const track = TRACKS[this.trackIndex];

    const bassMidi = track.bass[step % track.bass.length];
    const bassFreq = Math.pow(2, (bassMidi - 69) / 12) * 440;

    const leadMidi = track.lead[step % track.lead.length];
    const leadFreq = Math.pow(2, (leadMidi - 69) / 12) * 440;

    // --- PLAY SYNTH KICK BEAT ---
    const isDrumStep = step % 4 === 0;
    if (isDrumStep) {
      const kickOsc = this.audioCtx.createOscillator();
      const kickGain = this.audioCtx.createGain();
      kickOsc.frequency.setValueAtTime(140, time);
      kickOsc.frequency.exponentialRampToValueAtTime(0.01, time + 0.12);
      
      kickGain.gain.setValueAtTime(0.25, time);
      kickGain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);
      
      kickOsc.connect(kickGain);
      kickGain.connect(this.masterGain);
      kickOsc.start(time);
      kickOsc.stop(time + 0.12);
    } else {
      // Warm analog sawtooth bass
      const bassOsc = this.audioCtx.createOscillator();
      const bassGain = this.audioCtx.createGain();
      const bassFilter = this.audioCtx.createBiquadFilter();

      bassOsc.type = 'sawtooth';
      bassOsc.frequency.setValueAtTime(bassFreq, time);

      bassFilter.type = 'lowpass';
      bassFilter.frequency.setValueAtTime(220, time);
      bassFilter.frequency.exponentialRampToValueAtTime(70, time + 0.18);

      bassGain.gain.setValueAtTime(0.001, time);
      bassGain.gain.linearRampToValueAtTime(0.15, time + 0.01);
      bassGain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);

      bassOsc.connect(bassFilter);
      bassFilter.connect(bassGain);
      bassGain.connect(this.masterGain);

      bassOsc.start(time);
      bassOsc.stop(time + 0.2);
    }

    // --- PLAY MELODIC LEAD LINE ---
    const leadStepPattern = [1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 0];
    if (leadStepPattern[step % 16] === 1) {
      const leadOsc = this.audioCtx.createOscillator();
      const leadGain = this.audioCtx.createGain();
      const leadFilter = this.audioCtx.createBiquadFilter();

      // Alternate square and triangle for a lovely cyber synth sound
      leadOsc.type = step % 2 === 0 ? 'square' : 'triangle';
      leadOsc.frequency.setValueAtTime(leadFreq, time);

      leadFilter.type = 'bandpass';
      leadFilter.frequency.setValueAtTime(1100, time);
      leadFilter.Q.setValueAtTime(2.5, time);
      leadFilter.frequency.exponentialRampToValueAtTime(500, time + 0.14);

      leadGain.gain.setValueAtTime(0.001, time);
      leadGain.gain.linearRampToValueAtTime(0.045, time + 0.01);
      leadGain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);

      leadOsc.connect(leadFilter);
      leadFilter.connect(leadGain);
      leadGain.connect(this.masterGain);

      leadOsc.start(time);
      leadOsc.stop(time + 0.15);
    }
  }
}

// Single instance to prevent multiple audio tracks playing simultaneously
const sequencerInstance = new SynthSequencer();

export default function TurntablePlayer({ lang }: { lang: 'pt' | 'en' }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [trackIndex, setTrackIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [volume, setVolume] = useState(0.15);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    // Sync isPlaying with sequencer state
    return () => {
      sequencerInstance.stop();
    };
  }, []);

  const togglePlay = () => {
    try {
      if (isPlaying) {
        sequencerInstance.stop();
        setIsPlaying(false);
      } else {
        const audioContextInit = window.AudioContext || (window as any).webkitAudioContext;
        if (audioContextInit) {
          sequencerInstance.start(trackIndex, (step) => {
            setCurrentStep(step);
          });
          setIsPlaying(true);
        }
      }
    } catch (e) {
      console.warn('Audio Context initialization failed or suspended', e);
    }
  };

  const nextTrack = () => {
    const nextIdx = (trackIndex + 1) % TRACKS.length;
    setTrackIndex(nextIdx);
    if (isPlaying) {
      sequencerInstance.start(nextIdx, (step) => {
        setCurrentStep(step);
      });
    }
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    setIsMuted(newVol === 0);
    sequencerInstance.setVolume(newVol);
  };

  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      sequencerInstance.setVolume(volume || 0.15);
    } else {
      setIsMuted(true);
      sequencerInstance.setVolume(0);
    }
  };

  const currentTrack = TRACKS[trackIndex];

  return (
    <div className="fixed bottom-6 right-6 z-[999] font-mono pointer-events-none">
      {/* Container is wrapped to separate pointer events */}
      <div className="flex flex-col items-end gap-3 pointer-events-auto">
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 20, stiffness: 200 }}
              className="w-72 bg-[#1c1412] border-2 border-tomato p-4 text-almond shadow-[0_0_25px_rgba(240,83,65,0.25)] relative overflow-hidden"
            >
              {/* Corner tech accents */}
              <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-tomato"></div>
              <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-tomato"></div>
              <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-tomato"></div>
              <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-tomato"></div>

              <div className="flex items-center justify-between mb-3 border-b border-rosy/30 pb-2">
                <span className="text-[10px] font-bold tracking-widest text-rosy animate-pulse">
                  DECK_01_SYNTH_ACTIVE
                </span>
                <span className="text-[10px] text-rosy/60">
                  V_2.77
                </span>
              </div>

              {/* Scrolling Track Name display */}
              <div className="bg-[#120c0b] border border-rosy/30 p-2 text-center text-xs text-almond font-mono mb-4 overflow-hidden relative rounded">
                <div className="whitespace-nowrap inline-block animate-[marquee_8s_linear_infinite] hover:[animation-play-state:paused] font-bold">
                  {isPlaying ? '▶ ' : '⏸ '} {currentTrack.name} [{currentTrack.tempo} BPM]
                </div>
              </div>

              {/* Waveform Equalizer simulation */}
              <div className="flex items-end justify-between h-8 px-2 gap-[3px] mb-4 border-b border-rosy/20 pb-2">
                {Array.from({ length: 16 }).map((_, idx) => {
                  const isActive = isPlaying && currentStep === idx;
                  const randomHeight = isPlaying ? (isActive ? '100%' : `${Math.floor(Math.random() * 70) + 10}%`) : '15%';
                  return (
                    <motion.div
                      key={idx}
                      animate={{ height: randomHeight }}
                      transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                      className={`w-full rounded-t-sm transition-colors duration-150 ${
                        isActive ? 'bg-white' : isPlaying ? 'bg-tomato' : 'bg-rosy/25'
                      }`}
                      style={{ height: '15%' }}
                    />
                  );
                })}
              </div>

              {/* Synthesizer Deck Controls */}
              <div className="flex items-center justify-between gap-2 mb-4">
                <button
                  onClick={togglePlay}
                  className="flex-1 bg-tomato text-white font-bold py-1 px-3 border border-transparent hover:bg-black hover:text-tomato hover:border-tomato transition-all flex items-center justify-center gap-1.5 text-xs cursor-pointer"
                  title={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-3.5 h-3.5 fill-current" />
                      <span>PAUSAR</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>PLAY</span>
                    </>
                  )}
                </button>

                <button
                  onClick={nextTrack}
                  className="bg-[#120c0b] hover:bg-rosy/20 border border-rosy/60 text-almond p-1.5 transition-all text-xs cursor-pointer"
                  title="Next Track"
                >
                  <SkipForward className="w-4 h-4" />
                </button>
              </div>

              {/* Volume Slider & Mute */}
              <div className="flex items-center gap-2 text-xs border-t border-rosy/20 pt-2">
                <button
                  onClick={toggleMute}
                  className="text-almond hover:text-tomato transition-all cursor-pointer"
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="0.4"
                  step="0.02"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                  className="w-full accent-tomato h-1 bg-[#120c0b] border border-rosy/30 rounded outline-none cursor-pointer"
                />
              </div>

              {/* Interactive Info Footer */}
              <div className="text-[9px] text-almond/40 mt-3 text-center tracking-tighter">
                {lang === 'pt' ? '* ARRASTE O TOCA-DISCOS PARA COLOCAR ONDE QUISER *' : '* DRAG TURNTABLE TO ADJUST POSITION *'}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Draggable Vinyl Turntable Base */}
        <motion.div
          drag
          dragMomentum={false}
          className="flex items-center gap-2 pointer-events-auto cursor-grab active:cursor-grabbing"
          title={lang === 'pt' ? 'Arraste ou clique para ver tocador' : 'Drag or click to open player'}
        >
          {/* Label indicating track is playing */}
          {isPlaying && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-black border border-tomato text-tomato px-2 py-0.5 text-[9px] font-bold tracking-wider rounded shadow-md flex items-center gap-1"
            >
              <Music className="w-2.5 h-2.5 text-rosy animate-bounce" />
              <span>LIVE_SYNTH</span>
            </motion.div>
          )}

          <div className="relative">
            {/* Pulsing indicator ring when playing */}
            {isPlaying && (
              <span className="absolute -inset-1 border border-rosy rounded-full animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite] opacity-75" />
            )}

            {/* Turntable Core Box */}
            <div 
              onClick={() => setIsOpen(!isOpen)}
              className={`w-16 h-16 rounded-xl bg-black border-2 transition-all p-1.5 flex items-center justify-center shadow-lg relative cursor-pointer ${
                isOpen ? 'border-rosy scale-110' : 'border-tomato hover:scale-105'
              }`}
            >
              {/* Outer metal plate */}
              <div className="absolute inset-1 border border-neutral-800 rounded-lg pointer-events-none" />

              {/* Vinyl Groove circle */}
              <div 
                className={`w-12 h-12 rounded-full bg-[#111111] border-2 border-neutral-700 flex items-center justify-center relative relative-spin shadow-inner ${
                  isPlaying ? 'spin-active' : ''
                }`}
                style={{
                  backgroundImage: 'radial-gradient(circle, #333333 10%, #111111 60%, #000000 100%)'
                }}
              >
                {/* Vinyl Tracks/Grooves */}
                <div className="absolute inset-1.5 border border-neutral-900 rounded-full opacity-60" />
                <div className="absolute inset-3 border border-neutral-900 rounded-full opacity-40" />
                <div className="absolute inset-4.5 border border-neutral-800 rounded-full opacity-25" />

                {/* Central record label (rosy or tomato based on state) */}
                <div className={`w-4 h-4 rounded-full flex items-center justify-center transition-colors ${
                  isPlaying ? 'bg-rosy' : 'bg-tomato'
                }`}>
                  {/* Spindle hole */}
                  <div className="w-1.5 h-1.5 rounded-full bg-black" />
                </div>
              </div>

              {/* DJ Needle arm (tonearm) dropping onto the vinyl */}
              <motion.div
                className="absolute top-2 right-2 w-7 h-1.5 bg-rosy origin-right rounded-full pointer-events-none"
                animate={{
                  rotate: isPlaying ? -28 : -65,
                  scale: isPlaying ? 0.95 : 1
                }}
                transition={{ type: 'spring', stiffness: 100, damping: 10 }}
                style={{
                  top: '12px',
                  right: '12px',
                  height: '2px',
                  transformOrigin: '90% 50%'
                }}
              >
                {/* Metal needle cartridge heads */}
                <div className="absolute left-0 top-[-2px] w-2.5 h-1 bg-tomato rounded-sm transform rotate-[45deg]" />
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Tailwind inline animation styles */}
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
      `}</style>
    </div>
  );
}
