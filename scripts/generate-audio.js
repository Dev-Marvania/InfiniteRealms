const fs = require('fs');
const path = require('path');

const SAMPLE_RATE = 22050;
const AUDIO_DIR = path.join(__dirname, '..', 'assets', 'audio');

function createWavBuffer(samples, sampleRate = SAMPLE_RATE) {
  const numSamples = samples.length;
  const byteRate = sampleRate * 2;
  const dataSize = numSamples * 2;
  const fileSize = 44 + dataSize;

  const buffer = Buffer.alloc(fileSize);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(fileSize - 8, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  for (let i = 0; i < numSamples; i++) {
    const val = Math.max(-1, Math.min(1, samples[i]));
    const intVal = Math.round(val * 32767);
    buffer.writeInt16LE(intVal, 44 + i * 2);
  }

  return buffer;
}

function envelope(t, attack, decay, sustain, release, duration) {
  if (t < attack) return t / attack;
  if (t < attack + decay) return 1 - (1 - sustain) * ((t - attack) / decay);
  if (t < duration - release) return sustain;
  return sustain * ((duration - t) / release);
}

function generateMove() {
  const duration = 0.25;
  const numSamples = Math.floor(SAMPLE_RATE * duration);
  const samples = new Float32Array(numSamples);

  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    const freq = 300 + (t / duration) * 400;
    const env = envelope(t, 0.01, 0.05, 0.4, 0.1, duration);
    samples[i] = Math.sin(2 * Math.PI * freq * t) * env * 0.3;
  }
  return samples;
}

function generateAttack() {
  const duration = 0.3;
  const numSamples = Math.floor(SAMPLE_RATE * duration);
  const samples = new Float32Array(numSamples);

  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    const freq = 120 + Math.sin(t * 40) * 60;
    const env = envelope(t, 0.005, 0.08, 0.3, 0.15, duration);
    const noise = (Math.random() * 2 - 1) * 0.15 * env;
    samples[i] = (Math.sin(2 * Math.PI * freq * t) * env * 0.35 + noise);
  }
  return samples;
}

function generateHack() {
  const duration = 0.4;
  const numSamples = Math.floor(SAMPLE_RATE * duration);
  const samples = new Float32Array(numSamples);

  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    const step = Math.floor(t * 12);
    const freqs = [440, 520, 660, 440, 880, 520, 660, 880, 990, 440, 660, 880];
    const freq = freqs[step % freqs.length];
    const env = envelope(t, 0.005, 0.02, 0.5, 0.1, duration);
    samples[i] = (Math.sin(2 * Math.PI * freq * t) * 0.5 +
      Math.sin(2 * Math.PI * freq * 1.5 * t) * 0.15) * env * 0.25;
  }
  return samples;
}

function generateSearch() {
  const duration = 0.35;
  const numSamples = Math.floor(SAMPLE_RATE * duration);
  const samples = new Float32Array(numSamples);

  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    const sweep = 200 + Math.sin(t * 8 * Math.PI) * 150;
    const env = envelope(t, 0.02, 0.1, 0.3, 0.15, duration);
    samples[i] = Math.sin(2 * Math.PI * sweep * t) * env * 0.2;
  }
  return samples;
}

function generateRest() {
  const duration = 0.5;
  const numSamples = Math.floor(SAMPLE_RATE * duration);
  const samples = new Float32Array(numSamples);

  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    const freq = 330;
    const env = envelope(t, 0.05, 0.15, 0.25, 0.25, duration);
    samples[i] = (Math.sin(2 * Math.PI * freq * t) * 0.4 +
      Math.sin(2 * Math.PI * freq * 2 * t) * 0.2 +
      Math.sin(2 * Math.PI * freq * 3 * t) * 0.1) * env * 0.2;
  }
  return samples;
}

function generateItem() {
  const duration = 0.3;
  const numSamples = Math.floor(SAMPLE_RATE * duration);
  const samples = new Float32Array(numSamples);

  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    const f1 = t < 0.15 ? 523 : 659;
    const env = envelope(t, 0.01, 0.05, 0.5, 0.12, duration);
    samples[i] = Math.sin(2 * Math.PI * f1 * t) * env * 0.25;
  }
  return samples;
}

function generateAmbient() {
  const duration = 4.0;
  const numSamples = Math.floor(SAMPLE_RATE * duration);
  const samples = new Float32Array(numSamples);

  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    const loopEnv = Math.sin(Math.PI * t / duration);

    const base = Math.sin(2 * Math.PI * 55 * t) * 0.3;
    const sub = Math.sin(2 * Math.PI * 82.5 * t) * 0.15;
    const pad = Math.sin(2 * Math.PI * 110 * t + Math.sin(t * 0.5) * 0.3) * 0.1;
    const shimmer = Math.sin(2 * Math.PI * 220 * t + Math.sin(t * 2) * 2) * 0.04;
    const drift = Math.sin(2 * Math.PI * 165 * t + Math.sin(t * 0.3) * 1.5) * 0.06;

    samples[i] = (base + sub + pad + shimmer + drift) * loopEnv * 0.2;
  }
  return samples;
}

function generateSceneEnter() {
  const duration = 0.8;
  const numSamples = Math.floor(SAMPLE_RATE * duration);
  const samples = new Float32Array(numSamples);

  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    const env = envelope(t, 0.02, 0.2, 0.3, 0.35, duration);
    const sweep = 200 + (t / duration) * 600;
    const tone1 = Math.sin(2 * Math.PI * sweep * t) * 0.2;
    const tone2 = Math.sin(2 * Math.PI * (sweep * 0.5) * t) * 0.15;
    const shimmer = Math.sin(2 * Math.PI * 1200 * t + Math.sin(t * 6) * 3) * 0.06 * Math.max(0, 1 - t / duration);
    const whoosh = (Math.random() * 2 - 1) * 0.08 * Math.max(0, 1 - t * 3);
    samples[i] = (tone1 + tone2 + shimmer + whoosh) * env * 0.3;
  }
  return samples;
}

function generateError() {
  const duration = 0.2;
  const numSamples = Math.floor(SAMPLE_RATE * duration);
  const samples = new Float32Array(numSamples);

  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    const freq = 180 - (t / duration) * 80;
    const env = envelope(t, 0.005, 0.03, 0.4, 0.08, duration);
    const distort = Math.sin(2 * Math.PI * freq * t);
    samples[i] = Math.tanh(distort * 2) * env * 0.25;
  }
  return samples;
}

const sounds = {
  move: generateMove(),
  attack: generateAttack(),
  hack: generateHack(),
  search: generateSearch(),
  rest: generateRest(),
  item: generateItem(),
  ambient: generateAmbient(),
  error: generateError(),
  scene_enter: generateSceneEnter(),
};

if (!fs.existsSync(AUDIO_DIR)) {
  fs.mkdirSync(AUDIO_DIR, { recursive: true });
}

for (const [name, samples] of Object.entries(sounds)) {
  const wavBuffer = createWavBuffer(samples);
  const filePath = path.join(AUDIO_DIR, `${name}.wav`);
  fs.writeFileSync(filePath, wavBuffer);
  console.log(`Generated: ${name}.wav (${wavBuffer.length} bytes, ${samples.length / SAMPLE_RATE}s)`);
}

console.log('\nAll audio files generated successfully!');
