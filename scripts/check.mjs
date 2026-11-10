import {execFileSync} from 'node:child_process';import {readFileSync,copyFileSync} from 'node:fs';
copyFileSync('src/domain.mjs','public/domain.mjs');
for(const path of ['src/api.mjs','src/shared-auth.mjs','src/validation.mjs','src/domain.mjs','netlify/functions/api.mjs','public/app.js','public/sw.js'])execFileSync(process.execPath,['--check',path],{stdio:'inherit'});
JSON.parse(readFileSync('public/manifest.webmanifest','utf8'));
console.log('OK: JavaScript syntax, shared logic and web manifest.');
