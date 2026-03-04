import * as fs from 'fs';
import * as path from 'path';
import { execFileSync } from 'child_process';
import * as vscode from 'vscode';

const MACOS_PATHS = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  path.join(
    process.env.HOME || '~',
    'Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  ),
];

const LINUX_COMMANDS = [
  'google-chrome-stable',
  'google-chrome',
  'chromium-browser',
  'chromium',
];

const LINUX_PATHS = [
  '/usr/bin/google-chrome',
  '/usr/bin/chromium-browser',
  '/usr/bin/chromium',
  '/snap/bin/chromium',
];

function getWindowsPaths(): string[] {
  const programFiles = process.env['ProgramFiles'] || 'C:\\Program Files';
  const programFilesX86 =
    process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)';
  const localAppData =
    process.env.LOCALAPPDATA || path.join(process.env.HOME || '', 'AppData', 'Local');

  return [
    path.join(programFiles, 'Google', 'Chrome', 'Application', 'chrome.exe'),
    path.join(programFilesX86, 'Google', 'Chrome', 'Application', 'chrome.exe'),
    path.join(localAppData, 'Google', 'Chrome', 'Application', 'chrome.exe'),
    path.join(programFiles, 'Chromium', 'Application', 'chrome.exe'),
  ];
}

function whichSync(command: string): string | null {
  try {
    return execFileSync('which', [command], { encoding: 'utf-8' }).trim();
  } catch {
    return null;
  }
}

function findExecutable(paths: string[]): string | null {
  for (const p of paths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }
  return null;
}

export function detectChrome(): string {
  // 1. User-configured path in VSCode settings
  const configured = vscode.workspace
    .getConfiguration('md2pdf')
    .get<string>('chromePath', '');
  if (configured && fs.existsSync(configured)) {
    return configured;
  }

  // 2. CHROME_PATH environment variable
  const envPath = process.env.CHROME_PATH;
  if (envPath && fs.existsSync(envPath)) {
    return envPath;
  }

  // 3. Platform-specific detection
  const platform = process.platform;

  if (platform === 'darwin') {
    const found = findExecutable(MACOS_PATHS);
    if (found) return found;
  }

  if (platform === 'linux') {
    for (const cmd of LINUX_COMMANDS) {
      const resolved = whichSync(cmd);
      if (resolved) return resolved;
    }
    const found = findExecutable(LINUX_PATHS);
    if (found) return found;
  }

  if (platform === 'win32') {
    const found = findExecutable(getWindowsPaths());
    if (found) return found;
  }

  throw new Error(
    'Chrome/Chromium not found. Install Google Chrome or set the path in md2pdf.chromePath setting.'
  );
}
