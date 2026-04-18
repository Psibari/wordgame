/**
 * Generate WAV sound files for POLYPLEX game audio.
 * Run: node scripts/generate-sounds.js
 */
const fs = require('fs');
const path = require('path');

const SAMPLE_RATE = 44100;
const OUTPUT_DIR = path.join(__dirname, '..', 'assets', 'sounds');

function createWavBuffer(samples, sampleRate = SAMPLE_RATE) {
  const numSamples = samples.length;
  const byteRate = sampleRate * 2; // 16-bit mono
  const dataSize = numSamples * 2;
  const fileSize = 44 + dataSize;

  const buffer = Buffer.alloc(fileSize);
  let offset = 0;

  // RIFF header
  buffer.write('RIFF', offset); offset += 4;
  buffer.writeUInt32LE(fileSize - 8, offset); offset += 4;
  buffer.write('WAVE', offset); offset += 4;

  // fmt chunk
  buffer.write('fmt ', offset); offset += 4;
  buffer.writeUInt32LE(16, offset); offset += 4; // chunk size
  buffer.writeUInt16LE(1, offset); offset += 2;  // PCM
  buffer.writeUInt16LE(1, offset); offset += 2;  // mono
  buffer.writeUInt32LE(sampleRate, offset); offset += 4;
  buffer.writeUInt32LE(byteRate, offset); offset += 4;
  buffer.writeUInt16LE(2, offset); offset += 2;  // block align
  buffer.writeUInt16LE(16, offset); offset += 2; // bits per sample

  // data chunk
  buffer.write('data', offset); offset += 4;
  buffer.writeUInt32LE(dataSize, offset); offset += 4;

  for (let i = 0; i < numSamples; i++) {
    const val = Math.max(-1, Math.min(1, samples[i]));
    buffer.writeInt16LE(Math.round(val * 32767), offset);
    offset += 2;
  }

  return buffer;
}

function sine(freq, duration, volume = 0.5) {
  const numSamples = Math.round(SAMPLE_RATE * duration);
  const samples = new Float64Array(numSamples);
  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    // Apply envelope (attack/release)
    const attackLen = Math.min(0.01, duration * 0.1);
    const releaseLen = Math.min(0.05, duration * 0.3);
    let env = 1;
    if (t < attackLen) env = t / attackLen;
    else if (t > duration - releaseLen) env = (duration - t) / releaseLen;
    samples[i] = Math.sin(2 * Math.PI * freq * t) * volume * env;
  }
  return samples;
}

function mix(arrays) {
  const maxLen = Math.max(...arrays.map(a => a.length));
  const result = new Float64Array(maxLen);
  for (const arr of arrays) {
    for (let i = 0; i < arr.length; i++) {
      result[i] += arr[i];
    }
  }
  // Normalize
  let max = 0;
  for (let i = 0; i < result.length; i++) max = Math.max(max, Math.abs(result[i]));
  if (max > 1) for (let i = 0; i < result.length; i++) result[i] /= max;
  return result;
}

function concat(...arrays) {
  const totalLen = arrays.reduce((sum, a) => sum + a.length, 0);
  const result = new Float64Array(totalLen);
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
}

function offsetStart(arr, delaySec) {
  const delaySamples = Math.round(SAMPLE_RATE * delaySec);
  const result = new Float64Array(arr.length + delaySamples);
  result.set(arr, delaySamples);
  return result;
}

function silence(duration) {
  return new Float64Array(Math.round(SAMPLE_RATE * duration));
}

// === SOUND DEFINITIONS ===

// Correct: Bright ascending two-tone (C5 to E5)
function generateCorrect() {
  const t1 = sine(523.25, 0.08, 0.6); // C5
  const t2 = sine(659.25, 0.12, 0.7); // E5
  // Add harmonics for richness
  const h1 = sine(1046.5, 0.08, 0.15); // C6 overtone
  const h2 = sine(1318.5, 0.12, 0.2);  // E6 overtone
  const part1 = mix([t1, h1]);
  const part2 = mix([t2, h2]);
  return concat(part1, part2);
}

// Wrong: Descending minor second buzz
function generateWrong() {
  const t1 = sine(329.63, 0.12, 0.5); // E4
  const t2 = sine(311.13, 0.18, 0.4); // Eb4
  const buzz1 = sine(164.81, 0.12, 0.2); // E3 undertone
  const buzz2 = sine(155.56, 0.18, 0.15);
  const part1 = mix([t1, buzz1]);
  const part2 = mix([t2, buzz2]);
  return concat(part1, part2);
}

// Combo 3x: Rising three-note arpeggio (C5-E5-G5)
function generateCombo3() {
  const n1 = sine(523.25, 0.1, 0.55); // C5
  const n2 = sine(659.25, 0.1, 0.6);  // E5
  const n3 = sine(783.99, 0.18, 0.65); // G5
  const h1 = sine(1046.5, 0.1, 0.15);
  const h2 = sine(1318.5, 0.1, 0.18);
  const h3 = sine(1567.98, 0.18, 0.2);
  const p1 = mix([n1, h1]);
  const p2 = mix([n2, h2]);
  const p3 = mix([n3, h3]);
  return concat(p1, p2, p3);
}

// Combo 5x: Rising four-note arpeggio (C5-E5-G5-C6) with shimmer
function generateCombo5() {
  const n1 = sine(523.25, 0.08, 0.5);   // C5
  const n2 = sine(659.25, 0.08, 0.55);  // E5
  const n3 = sine(783.99, 0.08, 0.6);   // G5
  const n4 = sine(1046.5, 0.22, 0.7);   // C6
  const shimmer = sine(2093, 0.22, 0.15); // C7 shimmer
  const h4 = mix([n4, shimmer]);
  const p1 = mix([n1, sine(1046.5, 0.08, 0.12)]);
  const p2 = mix([n2, sine(1318.5, 0.08, 0.15)]);
  const p3 = mix([n3, sine(1567.98, 0.08, 0.18)]);
  return concat(p1, p2, p3, h4);
}

// Level Up: Triumphant fanfare
function generateLevelUp() {
  const n1 = sine(523.25, 0.12, 0.5); // C5
  const n2 = sine(659.25, 0.12, 0.55); // E5
  const n3 = sine(783.99, 0.12, 0.6); // G5
  const gap = silence(0.05);
  // Final chord: C major (C5+E5+G5+C6) sustained
  const chord = mix([
    sine(523.25, 0.4, 0.4),
    sine(659.25, 0.4, 0.35),
    sine(783.99, 0.4, 0.35),
    sine(1046.5, 0.4, 0.45),
    sine(2093, 0.4, 0.1), // shimmer
  ]);
  return concat(n1, n2, n3, gap, chord);
}

// Daily Win: Victory jingle
function generateDailyWin() {
  const notes = [
    sine(523.25, 0.1, 0.45),  // C5
    sine(587.33, 0.1, 0.5),   // D5
    sine(659.25, 0.1, 0.55),  // E5
    sine(783.99, 0.1, 0.6),   // G5
  ];
  const gap = silence(0.06);
  // Final chord
  const finalChord = mix([
    sine(523.25, 0.5, 0.35),
    sine(659.25, 0.5, 0.35),
    sine(783.99, 0.5, 0.4),
    sine(1046.5, 0.5, 0.45),
    sine(1318.5, 0.5, 0.15), // bright overtone
  ]);
  return concat(notes[0], notes[1], notes[2], notes[3], gap, finalChord);
}

// Timer Tick: Short click
function generateTimerTick() {
  const numSamples = Math.round(SAMPLE_RATE * 0.06);
  const samples = new Float64Array(numSamples);
  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    // Quick tick with fast decay
    const env = Math.exp(-t * 80);
    samples[i] = (
      Math.sin(2 * Math.PI * 800 * t) * 0.5 +
      Math.sin(2 * Math.PI * 1600 * t) * 0.2 +
      Math.sin(2 * Math.PI * 2400 * t) * 0.1
    ) * env * 0.7;
  }
  return samples;
}

// Background Music: Ambient pad loop (8 seconds)
function generateBgMusic() {
  const duration = 8.0;
  const numSamples = Math.round(SAMPLE_RATE * duration);
  const samples = new Float64Array(numSamples);

  // Chord progression: Am - F - C - G (2 seconds each)
  const chords = [
    [220, 261.63, 329.63],      // Am: A3, C4, E4
    [174.61, 220, 261.63],      // F: F3, A3, C4
    [261.63, 329.63, 392],      // C: C4, E4, G4
    [196, 246.94, 293.66],      // G: G3, B3, D4
  ];

  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    const chordIdx = Math.floor((t / duration) * 4) % 4;
    const chord = chords[chordIdx];

    // Smooth crossfade between chords
    const chordPos = ((t / duration) * 4) % 1;
    let crossfade = 1;
    if (chordPos < 0.05) crossfade = chordPos / 0.05;
    if (chordPos > 0.95) crossfade = (1 - chordPos) / 0.05;

    // Pad sound with slow LFO
    const lfo = 0.8 + 0.2 * Math.sin(2 * Math.PI * 0.3 * t);

    let val = 0;
    for (const freq of chord) {
      val += Math.sin(2 * Math.PI * freq * t) * 0.12;
      // Add soft detuned voice for width
      val += Math.sin(2 * Math.PI * (freq * 1.002) * t) * 0.06;
      val += Math.sin(2 * Math.PI * (freq * 0.998) * t) * 0.06;
    }

    // Global fade for loop seamlessness
    let loopEnv = 1;
    if (t < 0.5) loopEnv = t / 0.5;
    if (t > duration - 0.5) loopEnv = (duration - t) / 0.5;

    samples[i] = val * lfo * crossfade * loopEnv * 0.6;
  }

  return samples;
}

// === GENERATE ALL FILES ===
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const sounds = {
  'correct.wav': generateCorrect(),
  'wrong.wav': generateWrong(),
  'combo_3.wav': generateCombo3(),
  'combo_5.wav': generateCombo5(),
  'level_up.wav': generateLevelUp(),
  'daily_win.wav': generateDailyWin(),
  'timer_tick.wav': generateTimerTick(),
  'bg_music.wav': generateBgMusic(),
};

for (const [filename, samples] of Object.entries(sounds)) {
  const buffer = createWavBuffer(samples);
  const filepath = path.join(OUTPUT_DIR, filename);
  fs.writeFileSync(filepath, buffer);
  console.log(`Generated ${filename} (${(buffer.length / 1024).toFixed(1)} KB, ${(samples.length / SAMPLE_RATE).toFixed(2)}s)`);
}

console.log('\nAll sounds generated successfully!');
