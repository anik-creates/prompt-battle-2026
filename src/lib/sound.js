// Web Audio API Synthesizer for Prompt Battle
// Provides clean, cybernetic auditory cues without needing external media files

let audioCtx = null;

function getAudioContext() {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      audioCtx = new AudioContext();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function playTone(freq = 440, type = 'sine', duration = 0.15, gainVal = 0.1) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    gain.gain.setValueAtTime(gainVal, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (e) {
    console.warn('Audio tone error:', e);
  }
}

export function playCountdownTick() {
  playTone(880, 'sine', 0.08, 0.08);
}

export function playStartHorn() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    // Energetic ascending tech chime
    const notes = [440, 554.37, 659.25, 880];
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        playTone(freq, 'triangle', 0.25, 0.15);
      }, idx * 90);
    });
  } catch (e) {
    console.warn(e);
  }
}

export function playFinishFanfare() {
  try {
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        playTone(freq, 'sine', 0.35, 0.18);
      }, idx * 120);
    });
  } catch (e) {
    console.warn(e);
  }
}

export function playTimesUpAlert() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    [330, 293, 261].forEach((freq, idx) => {
      setTimeout(() => {
        playTone(freq, 'sawtooth', 0.3, 0.12);
      }, idx * 150);
    });
  } catch (e) {
    console.warn(e);
  }
}
