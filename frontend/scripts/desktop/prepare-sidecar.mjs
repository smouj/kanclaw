import { copyFile, cp, mkdir, rm, stat, writeFile } from 'fs/promises';
import { execFileSync } from 'child_process';
import path from 'path';

const root = process.cwd();
const standaloneRoot = path.join(root, '.next', 'standalone');
const staticRoot = path.join(root, '.next', 'static');
const publicRoot = path.join(root, 'public');
const tempRoot = path.join(root, '.desktop-sidecar');
const binariesRoot = path.join(root, 'src-tauri', 'binaries');
const bootstrapSource = path.join(root, 'scripts', 'desktop', 'server-bootstrap.cjs');
const bootstrapTarget = path.join(standaloneRoot, 'server-bootstrap.cjs');

async function exists(target) {
  try {
    await stat(target);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  if (!(await exists(path.join(standaloneRoot, 'server.js')))) {
    throw new Error('No se encontró `.next/standalone/server.js`. Ejecuta `yarn build` antes.');
  }

  await mkdir(path.join(standaloneRoot, '.next'), { recursive: true });
  await cp(staticRoot, path.join(standaloneRoot, '.next', 'static'), { recursive: true });

  if (await exists(publicRoot)) {
    await cp(publicRoot, path.join(standaloneRoot, 'public'), { recursive: true });
  }

  await copyFile(bootstrapSource, bootstrapTarget);
  await mkdir(tempRoot, { recursive: true });
  await rm(tempRoot, { recursive: true, force: true });
  await cp(standaloneRoot, tempRoot, { recursive: true });

  await writeFile(
    path.join(tempRoot, 'package.json'),
    JSON.stringify(
      {
        name: 'kanclaw-next-sidecar',
        private: true,
        bin: 'server-bootstrap.cjs',
      },
      null,
      2,
    ),
  );

  await mkdir(binariesRoot, { recursive: true });
  const outputBase = path.join(binariesRoot, 'kanclaw-next-server');

  execFileSync(
    path.join(root, 'node_modules', '.bin', 'pkg'),
    ['server-bootstrap.cjs', '--target', 'node18-linux-x64,node18-macos-x64,node18-win-x64', '--output', outputBase],
    { cwd: tempRoot, stdio: 'inherit' },
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});