/**
 * Keeps only the first 15 images in public/vishmish (used for valentine bubbles).
 * Deletes the rest. Run: node scripts/trim-vishmish.js
 */
const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname, '..', 'public', 'vishmish');
const KEEP_COUNT = 15;

const files = fs.readdirSync(DIR).filter((f) => {
  const lower = f.toLowerCase();
  return lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.png');
});

const sorted = [...files].sort();
const toKeep = sorted.slice(0, KEEP_COUNT);
const toDelete = sorted.slice(KEEP_COUNT);

if (toDelete.length === 0) {
  console.log('No extra images to delete. Found', files.length, 'images (keeping all', KEEP_COUNT, 'or fewer).');
  process.exit(0);
}

console.log('Keeping', toKeep.length, 'images. Deleting', toDelete.length, '...');
for (const file of toDelete) {
  const filePath = path.join(DIR, file);
  fs.unlinkSync(filePath);
  console.log('  Deleted:', file);
}
console.log('Done.');
