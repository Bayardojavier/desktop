const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function pad2(n) {
  return String(n).padStart(2, '0');
}

function timestamp() {
  const d = new Date();
  return [
    d.getFullYear(),
    pad2(d.getMonth() + 1),
    pad2(d.getDate()),
    '_',
    pad2(d.getHours()),
    pad2(d.getMinutes()),
    pad2(d.getSeconds()),
  ].join('');
}

function main() {
  const root = path.resolve(__dirname, '..');
  const pkgPath = path.join(root, 'package.json');
  const pkg = readJson(pkgPath);
  const version = pkg.version || '0.0.0';

  const outDir = path.join(root, 'out');
  if (fs.existsSync(outDir)) {
    const archiveRoot = path.join(root, 'out_archive');
    fs.mkdirSync(archiveRoot, { recursive: true });

    const dest = path.join(archiveRoot, `out_${version}_${timestamp()}`);
    try {
      fs.renameSync(outDir, dest);
      console.log(`Archived 'out' (moved) -> ${path.relative(root, dest)}`);
    } catch (err) {
      // En Windows es común que algún proceso tenga un handle abierto (antivirus/indexer),
      // lo que hace fallar rename con EPERM. En ese caso, hacemos copia.
      if (err && (err.code === 'EPERM' || err.code === 'EACCES')) {
        console.warn(`Warning: rename failed (${err.code}). Falling back to copy...`);
        fs.cpSync(outDir, dest, { recursive: true });
        console.log(`Archived 'out' (copied) -> ${path.relative(root, dest)}`);

        // Intentar limpiar 'out' para que el siguiente make no mezcle artefactos.
        try {
          fs.rmSync(outDir, { recursive: true, force: true });
          console.log("Cleaned existing 'out' folder.");
        } catch (rmErr) {
          console.warn(`Warning: could not remove 'out' (${rmErr.code || rmErr}). Continuing...`);
        }
      } else {
        throw err;
      }
    }
  } else {
    console.log("No existing 'out' folder to archive.");
  }

  const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const res = spawnSync(npmCmd, ['run', 'make'], {
    cwd: root,
    stdio: 'inherit',
  });

  process.exit(res.status ?? 1);
}

main();
