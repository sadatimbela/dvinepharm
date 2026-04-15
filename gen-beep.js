const fs = require('fs');
const path = require('path');

const generateBeep = () => {
  const sampleRate = 44100;
  const duration = 0.15;
  const numSamples = sampleRate * duration;
  const buffer = Buffer.alloc(44 + numSamples * 2);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + numSamples * 2, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(numSamples * 2, 40);

  const frequency = 880; // A5 - satisfying POS beep tone
  const amplitude = 32767 * 0.5;
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    // Add a slight envelope so it doesn't pop
    const env = Math.max(0, 1 - (i / numSamples)); 
    const sample = Math.round(amplitude * env * Math.sin(2 * Math.PI * frequency * t));
    buffer.writeInt16LE(sample, 44 + i * 2);
  }

  const outPath = path.join(__dirname, 'public', 'beep.wav');
  fs.writeFileSync(outPath, buffer);
  console.log('Created: ' + outPath);
};

generateBeep();
