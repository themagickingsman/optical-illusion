const fs = require('fs');
const cp = require('child_process');

try {
  fs.rmSync('.next', { recursive: true, force: true });
  console.log("Cleared .next");
} catch(e) {}

try {
  fs.rmSync('tsconfig.tsbuildinfo', { force: true });
  console.log("Cleared tsconfig.tsbuildinfo");
} catch(e) {}

try {
  console.log("Running TSC...");
  const output = cp.execSync('npx tsc --noEmit', { encoding: 'utf-8', stdio: 'pipe' });
  console.log("TSC SUCCESS");
} catch (e) {
  console.error("TS Error:");
  console.error(e.stdout || e.message);
}
