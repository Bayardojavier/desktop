/*
  Fix common Spanish mojibake sequences found in manual_usuario HTML files.

  This tool is intentionally conservative:
  - Only rewrites a file if it detects known broken sequences.
  - Creates a backup copy of every changed file under a timestamped folder.

  Usage:
    node tools/fix-manual-mojibake.js
*/

const fs = require('fs');
const path = require('path');

const workspaceRoot = path.resolve(__dirname, '..');
const manualDir = path.join(workspaceRoot, 'manual_usuario');

function pad2(n) {
  return String(n).padStart(2, '0');
}

function makeTimestamp() {
  const d = new Date();
  return (
    d.getFullYear() +
    pad2(d.getMonth() + 1) +
    pad2(d.getDate()) +
    '_' +
    pad2(d.getHours()) +
    pad2(d.getMinutes()) +
    pad2(d.getSeconds())
  );
}

const backupRoot = path.join(
  manualDir,
  `__backup_mojibake_${makeTimestamp()}`
);

/**
 * Apply a set of deterministic string replacements.
 *
 * Notes:
 * - Many files contain the pattern "ónX" which comes from "ÃX" after a bad transform.
 * - Some files contain "ó³" (missing the "n"), so we also normalize that.
 */
function fixMojibake(text) {
  const replacements = [
    // Special-case: missing the 'n'
    ['ó³', 'ó'],
    ['á¡', 'á'],
    ['é©', 'é'],
    ['í\u00ad', 'í'],
    ['úº', 'ú'],
    ['ñ±', 'ñ'],

    // Primary broken pattern: "ón" + second byte rendered as CP1252 char
    ['ón¡', 'á'],
    ['ón©', 'é'],
    ['ón\u00ad', 'í'],
    ['ón³', 'ó'],
    ['ónº', 'ú'],
    ['ón±', 'ñ'],

    // Uppercase vowels / Ñ / Ü that can show up as CP1252 control/quote glyphs
    ['ón\u0081', 'Á'], // Ã? (C3 81)
    ['ón‰', 'É'],      // Ã‰ (C3 89)
    ['ón\u008d', 'Í'], // Ã\x8D (C3 8D)
    ['ón“', 'Ó'],      // Ã“ (C3 93)
    ['ónš', 'Ú'],      // Ãš (C3 9A)
    ['ón‘', 'Ñ'],      // Ã‘ (C3 91)
    ['ónœ', 'Ü'],      // Ãœ (C3 9C)

    // Lowercase ü is often rendered as ¼ in CP1252 (0xBC)
    ['ón¼', 'ü'],

    // Fallback: classic UTF-8-as-CP1252 mojibake
    ['Ã¡', 'á'],
    ['Ã©', 'é'],
    ['Ã\u00ad', 'í'],
    ['Ãí', 'í'],
    ['Ã³', 'ó'],
    ['Ãº', 'ú'],
    ['Ã±', 'ñ'],
    ['Ã', 'Á'],
    ['Ã‰', 'É'],
    ['Ã\u008d', 'Í'],
    ['Ã“', 'Ó'],
    ['Ãš', 'Ú'],
    ['Ã‘', 'Ñ'],
    ['Ãœ', 'Ü'],
    ['Ã¼', 'ü'],
  ];

  let out = text;
  for (const [from, to] of replacements) {
    const fromValue = from.includes('\\u') ? from.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16))) : from;
    out = out.split(fromValue).join(to);
  }
  return out;
}

function shouldProcess(text) {
  return /ón[¡©\u00ad³º±\u0081‰\u008d“š‘œ¼]|ó³|Ã[¡©\u00ad³º±\u0081‰\u008d“š‘œ¼]/.test(text);
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function* walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walk(fullPath);
    } else {
      yield fullPath;
    }
  }
}

function relativeToManual(absolutePath) {
  return path.relative(manualDir, absolutePath);
}

function main() {
  if (!fs.existsSync(manualDir)) {
    console.error(`No existe la carpeta: ${manualDir}`);
    process.exitCode = 1;
    return;
  }

  let scanned = 0;
  let changed = 0;

  for (const filePath of walk(manualDir)) {
    if (!filePath.toLowerCase().endsWith('.html')) continue;

    scanned++;

    const original = fs.readFileSync(filePath, 'utf8');
    if (!shouldProcess(original)) continue;

    const fixed = fixMojibake(original);
    if (fixed === original) continue;

    const rel = relativeToManual(filePath);
    const backupPath = path.join(backupRoot, rel);
    ensureDir(path.dirname(backupPath));

    fs.writeFileSync(backupPath, original, 'utf8');
    fs.writeFileSync(filePath, fixed, 'utf8');

    changed++;
  }

  console.log(`Escaneados: ${scanned} HTML`);
  console.log(`Corregidos: ${changed} archivos`);
  if (changed > 0) {
    console.log(`Backup: ${backupRoot}`);
  }
}

main();
