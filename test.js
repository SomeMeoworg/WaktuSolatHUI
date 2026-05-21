import fs from 'fs';

const content = fs.readFileSync('src/lib/zones.ts', 'utf-8');

// Simple regex to find duplicate strings in objects
const matches = [...content.matchAll(/v:\s*"([^"]+)"/g)].map(m => m[1]);

const seen = new Set();
const dups = new Set();
for (const match of matches) {
  if (seen.has(match)) {
    dups.add(match);
  }
  seen.add(match);
}

console.log("duplicates:", Array.from(dups));
