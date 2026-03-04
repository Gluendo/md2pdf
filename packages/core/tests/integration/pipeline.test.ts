import { describe, it, expect, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { chromePath } from '../helpers/findChrome';
import { convertMarkdownToPdf } from '../../src/pipeline';
import { loadBrandFromFile } from '../../src/brandConfig';
import { DEFAULT_BRAND } from '../../src/types';

const REPO_ROOT = path.resolve(__dirname, '..', '..', '..', '..');
const THEME_CSS = path.join(REPO_ROOT, 'themes', 'pdf-theme.css');
const FIXTURES = path.join(__dirname, '..', 'fixtures');

function findResourcesPath(): string {
  // Build a temp resources dir with mermaid.min.js + mermaid-render.html
  const tmpResources = fs.mkdtempSync(path.join(os.tmpdir(), 'md2pdf-resources-'));
  try {
    const mermaidPkg = require.resolve('mermaid');
    const mermaidMinJs = path.join(path.dirname(mermaidPkg), 'mermaid.min.js');
    fs.cpSync(mermaidMinJs, path.join(tmpResources, 'mermaid.min.js'));
  } catch {}
  const renderHtml = path.join(REPO_ROOT, 'resources', 'mermaid-render.html');
  if (fs.existsSync(renderHtml)) {
    fs.cpSync(renderHtml, path.join(tmpResources, 'mermaid-render.html'));
  }
  return tmpResources;
}

describe.skipIf(!chromePath)('pipeline (end-to-end)', () => {
  let tmpOutputDir: string;
  let resourcesPath: string;

  afterEach(() => {
    if (tmpOutputDir) {
      fs.rmSync(tmpOutputDir, { recursive: true, force: true });
    }
    if (resourcesPath) {
      fs.rmSync(resourcesPath, { recursive: true, force: true });
    }
  });

  function setup() {
    tmpOutputDir = fs.mkdtempSync(path.join(os.tmpdir(), 'md2pdf-output-'));
    resourcesPath = findResourcesPath();
  }

  it('converts simple markdown to a valid PDF', async () => {
    setup();
    const outputPath = path.join(tmpOutputDir, 'simple.pdf');

    await convertMarkdownToPdf({
      mdFilePath: path.join(FIXTURES, 'simple.md'),
      outputPath,
      brand: DEFAULT_BRAND,
      chromePath: chromePath!,
      resourcesPath,
      themeCssPath: THEME_CSS,
    });

    expect(fs.existsSync(outputPath)).toBe(true);
    const pdfBuffer = fs.readFileSync(outputPath);
    expect(pdfBuffer.length).toBeGreaterThan(1000);
    expect(pdfBuffer.subarray(0, 5).toString('ascii')).toBe('%PDF-');
  });

  it('converts markdown with mermaid diagrams', async () => {
    setup();
    const outputPath = path.join(tmpOutputDir, 'mermaid.pdf');

    const result = await convertMarkdownToPdf({
      mdFilePath: path.join(FIXTURES, 'mermaid.md'),
      outputPath,
      brand: DEFAULT_BRAND,
      chromePath: chromePath!,
      resourcesPath,
      themeCssPath: THEME_CSS,
    });

    expect(fs.existsSync(outputPath)).toBe(true);
    const pdfBuffer = fs.readFileSync(outputPath);
    expect(pdfBuffer.length).toBeGreaterThan(1000);
    expect(result.mermaidDiagramsFailed).toBe(0);
  });

  it('works with custom brand configuration', async () => {
    setup();
    const outputPath = path.join(tmpOutputDir, 'custom-brand.pdf');
    const brand = loadBrandFromFile(path.join(FIXTURES, 'brand-custom.json'));

    await convertMarkdownToPdf({
      mdFilePath: path.join(FIXTURES, 'simple.md'),
      outputPath,
      brand,
      chromePath: chromePath!,
      resourcesPath,
      themeCssPath: THEME_CSS,
    });

    expect(fs.existsSync(outputPath)).toBe(true);
    const pdfBuffer = fs.readFileSync(outputPath);
    expect(pdfBuffer.length).toBeGreaterThan(1000);
  });

  it('calls onProgress callback with status messages', async () => {
    setup();
    const outputPath = path.join(tmpOutputDir, 'progress.pdf');
    const messages: string[] = [];

    await convertMarkdownToPdf({
      mdFilePath: path.join(FIXTURES, 'simple.md'),
      outputPath,
      brand: DEFAULT_BRAND,
      chromePath: chromePath!,
      resourcesPath,
      themeCssPath: THEME_CSS,
      onProgress: (msg) => messages.push(msg),
    });

    expect(messages.length).toBeGreaterThan(0);
    expect(messages).toContain('Reading markdown...');
    expect(messages).toContain('Converting to HTML...');
    expect(messages).toContain('Generating PDF...');
    expect(messages).toContain('Done!');
  });

  it('respects cancellation', async () => {
    setup();
    const outputPath = path.join(tmpOutputDir, 'cancelled.pdf');

    await expect(
      convertMarkdownToPdf({
        mdFilePath: path.join(FIXTURES, 'simple.md'),
        outputPath,
        brand: DEFAULT_BRAND,
        chromePath: chromePath!,
        resourcesPath,
        themeCssPath: THEME_CSS,
        cancelled: () => true, // Cancel immediately
      })
    ).rejects.toThrow('Cancelled');

    expect(fs.existsSync(outputPath)).toBe(false);
  });

  it('creates output directory if it does not exist', async () => {
    setup();
    const nestedDir = path.join(tmpOutputDir, 'deeply', 'nested', 'dir');
    const outputPath = path.join(nestedDir, 'output.pdf');

    await convertMarkdownToPdf({
      mdFilePath: path.join(FIXTURES, 'simple.md'),
      outputPath,
      brand: DEFAULT_BRAND,
      chromePath: chromePath!,
      resourcesPath,
      themeCssPath: THEME_CSS,
    });

    expect(fs.existsSync(outputPath)).toBe(true);
  });

  it('non-regression: simple PDF size is within expected range', async () => {
    setup();
    const outputPath = path.join(tmpOutputDir, 'regression.pdf');

    await convertMarkdownToPdf({
      mdFilePath: path.join(FIXTURES, 'simple.md'),
      outputPath,
      brand: DEFAULT_BRAND,
      chromePath: chromePath!,
      resourcesPath,
      themeCssPath: THEME_CSS,
    });

    const pdfSize = fs.statSync(outputPath).size;
    // A simple markdown PDF should be between 5KB and 500KB
    // This catches empty pages (<5KB) or massive bloat (>500KB)
    expect(pdfSize).toBeGreaterThan(5_000);
    expect(pdfSize).toBeLessThan(500_000);
  });
});
