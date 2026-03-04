import { describe, it, expect, afterAll, beforeAll } from 'vitest';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import puppeteer, { Browser } from 'puppeteer-core';
import { chromePath } from '../helpers/findChrome';
import { processMermaidDiagrams, getMermaidConfig } from '../../src/mermaidProcessor';
import { DEFAULT_BRAND } from '../../src/types';

const REPO_ROOT = path.resolve(__dirname, '..', '..', '..', '..');
const RESOURCES = path.join(REPO_ROOT, 'resources');

// Mermaid needs the IIFE bundle — check if it exists in various locations
function findMermaidResources(): string | undefined {
  // In dev: mermaid.min.js is in node_modules
  const mermaidJsInResources = path.join(RESOURCES, 'mermaid.min.js');
  if (fs.existsSync(mermaidJsInResources)) return RESOURCES;

  // Copy mermaid.min.js to a temp resources dir for testing
  try {
    const mermaidPkg = require.resolve('mermaid');
    const mermaidMinJs = path.join(path.dirname(mermaidPkg), 'mermaid.min.js');
    if (fs.existsSync(mermaidMinJs)) {
      const tmpResources = fs.mkdtempSync(path.join(os.tmpdir(), 'md2pdf-resources-'));
      fs.cpSync(mermaidMinJs, path.join(tmpResources, 'mermaid.min.js'));
      fs.cpSync(path.join(RESOURCES, 'mermaid-render.html'), path.join(tmpResources, 'mermaid-render.html'));
      return tmpResources;
    }
  } catch {}

  return undefined;
}

describe.skipIf(!chromePath)('mermaidProcessor (integration)', () => {
  let browser: Browser;
  let resourcesPath: string | undefined;
  let tmpResourcesCreated = false;

  beforeAll(async () => {
    browser = await puppeteer.launch({
      executablePath: chromePath!,
      headless: 'shell' as const,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });
    resourcesPath = findMermaidResources();
    if (resourcesPath && resourcesPath !== RESOURCES) {
      tmpResourcesCreated = true;
    }
  });

  afterAll(async () => {
    await browser?.close();
    if (tmpResourcesCreated && resourcesPath) {
      fs.rmSync(resourcesPath, { recursive: true, force: true });
    }
  });

  it('renders a flowchart to SVG', async () => {
    if (!resourcesPath) return;

    const content = '# Test\n\n```mermaid\ngraph TD\n    A[Start] --> B[End]\n```\n';
    const result = await processMermaidDiagrams(
      content,
      'test',
      DEFAULT_BRAND,
      browser,
      resourcesPath
    );

    try {
      expect(result.successCount).toBe(1);
      expect(result.failCount).toBe(0);
      expect(result.content).toContain('![](test-1.svg)');
      expect(result.content).not.toContain('```mermaid');

      // Check SVG file was created
      const svgPath = path.join(result.tempDir, 'test-1.svg');
      expect(fs.existsSync(svgPath)).toBe(true);
      const svgContent = fs.readFileSync(svgPath, 'utf-8');
      expect(svgContent).toContain('<svg');
      expect(svgContent).toContain('Start');
    } finally {
      fs.rmSync(result.tempDir, { recursive: true, force: true });
    }
  });

  it('handles invalid mermaid gracefully', async () => {
    if (!resourcesPath) return;

    const content = '```mermaid\nthis is not valid mermaid at all\n```\n';
    const result = await processMermaidDiagrams(
      content,
      'bad',
      DEFAULT_BRAND,
      browser,
      resourcesPath
    );

    try {
      expect(result.failCount).toBe(1);
      expect(result.successCount).toBe(0);
      // Original content should be preserved when rendering fails
      expect(result.content).toContain('```mermaid');
    } finally {
      fs.rmSync(result.tempDir, { recursive: true, force: true });
    }
  });

  it('processes multiple diagrams', async () => {
    if (!resourcesPath) return;

    const content = '```mermaid\ngraph TD\n    A-->B\n```\n\n```mermaid\ngraph LR\n    C-->D\n```\n';
    const result = await processMermaidDiagrams(
      content,
      'multi',
      DEFAULT_BRAND,
      browser,
      resourcesPath
    );

    try {
      expect(result.successCount).toBe(2);
      expect(result.content).toContain('![](multi-1.svg)');
      expect(result.content).toContain('![](multi-2.svg)');
    } finally {
      fs.rmSync(result.tempDir, { recursive: true, force: true });
    }
  });
});
