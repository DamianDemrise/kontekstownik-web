// Pakuje dist/ do release/kontekstownik-dist-RRRR-MM-DD.zip (z ukrytym .htaccess).
import { execFileSync } from 'node:child_process';
import { mkdirSync, rmSync } from 'node:fs';
const date = new Date().toISOString().slice(0, 10);
const out = `release/kontekstownik-dist-${date}.zip`;
mkdirSync('release', { recursive: true });
rmSync(out, { force: true });
execFileSync('zip', ['-qr', `../${out}`, '.', '-x', '.DS_Store'], { cwd: 'dist', stdio: 'inherit' });
console.log(out);
