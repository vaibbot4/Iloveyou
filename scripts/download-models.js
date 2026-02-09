/**
 * Downloads face-api.js model weights into public/models.
 * Run: node scripts/download-models.js
 */
const fs = require('fs');
const path = require('path');
const https = require('https');

const BASE = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';
const OUT_DIR = path.join(__dirname, '..', 'public', 'models');

const FILES = [
  'ssd_mobilenetv1_model-weights_manifest.json',
  'ssd_mobilenetv1_model-shard1',
  'ssd_mobilenetv1_model-shard2',
  'face_landmark_68_model-weights_manifest.json',
  'face_landmark_68_model-shard1',
  'face_recognition_model-weights_manifest.json',
  'face_recognition_model-shard1',
  'face_recognition_model-shard2',
];

function download(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode === 302 || res.statusCode === 301) {
        return download(res.headers.location).then(resolve).catch(reject);
      }
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

async function main() {
  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  }
  for (const file of FILES) {
    const url = `${BASE}/${file}`;
    process.stdout.write(`Downloading ${file}... `);
    try {
      const data = await download(url);
      fs.writeFileSync(path.join(OUT_DIR, file), data);
      console.log('OK');
    } catch (e) {
      console.log('FAIL:', e.message);
      process.exit(1);
    }
  }
  console.log('Done. Models are in public/models');
}

main();
