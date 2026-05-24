const fs = require('fs');
let content = fs.readFileSync('src/translations.ts', 'utf-8');

let count = 0;
content = content.replace(/en:\s*\{/g, match => {
  count++;
  if (count === 2) return 'en2: {';
  return match;
});

const jsCode = content
  .replace('export const translations = ', 'module.exports.translations = ')
  .replace(/export type[\s\S]+/, '');

const m = { exports: {} };
eval('(function(module, exports) { ' + jsCode + ' })(m, m.exports);');

const t = m.exports.translations;
const en1Keys = Object.keys(t.en);

const newMs = { ...t.ms };
const newEn = {};

let isMalay = false;

for (const key of en1Keys) {
  if (key === 'weatherFeelsLike') {
    isMalay = true;
  }
  
  if (isMalay) {
    newMs[key] = t.en[key];
  } else {
    newEn[key] = t.en[key];
  }
}

for (const key of Object.keys(t.en2 || {})) {
  if (isMalay && newMs[key]) {
    newEn[key] = t.en2[key];
  } else if (!newEn[key]) {
    newEn[key] = t.en2[key];
  }
}

function serializeObj(obj) {
  return Object.entries(obj).map(([k, v]) => '    ' + k + ': ' + JSON.stringify(v) + ',').join('\n');
}

const finalOutput = `export const translations = {
  ms: {
${serializeObj(newMs)}
  },
  en: {
${serializeObj(newEn)}
  }
};

export type LangKey = keyof typeof translations.ms;
`;

fs.writeFileSync('src/translations.ts', finalOutput);
console.log('Fixed translations.ts perfectly!');
