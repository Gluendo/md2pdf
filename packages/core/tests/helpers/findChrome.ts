import * as fs from 'fs';
import { execFileSync } from 'child_process';

const MACOS_PATHS = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
];

const LINUX_COMMANDS = ['google-chrome-stable', 'google-chrome', 'chromium-browser', 'chromium'];

const LINUX_PATHS = ['/usr/bin/google-chrome', '/usr/bin/chromium-browser', '/usr/bin/chromium'];

function whichSync(cmd: string): string | null {
  try {
    return execFileSync('which', [cmd], { encoding: 'utf-8' }).trim();
  } catch {
    return null;
  }
}

export function findChrome(): string | undefined {
  // Environment variable
  for (const envVar of ['CHROME_PATH', 'PUPPETEER_EXECUTABLE_PATH']) {
    const val = process.env[envVar];
    if (val && fs.existsSync(val)) return val;
  }

  // macOS
  if (process.platform === 'darwin') {
    for (const p of MACOS_PATHS) {
      if (fs.existsSync(p)) return p;
    }
  }

  // Linux
  if (process.platform === 'linux') {
    for (const cmd of LINUX_COMMANDS) {
      const resolved = whichSync(cmd);
      if (resolved) return resolved;
    }
    for (const p of LINUX_PATHS) {
      if (fs.existsSync(p)) return p;
    }
  }

  return undefined;
}

export const chromePath = findChrome();
