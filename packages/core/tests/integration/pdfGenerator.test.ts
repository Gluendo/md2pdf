import { describe, it, expect, afterAll, beforeAll } from 'vitest';
import * as path from 'path';
import puppeteer, { Browser } from 'puppeteer-core';
import { chromePath } from '../helpers/findChrome';
import { generatePdf } from '../../src/pdfGenerator';
import { DEFAULT_BRAND } from '../../src/types';

const REPO_ROOT = path.resolve(__dirname, '..', '..', '..', '..');
const THEME_CSS = path.join(REPO_ROOT, 'themes', 'pdf-theme.css');
const FIXTURES = path.join(__dirname, '..', 'fixtures');

describe.skipIf(!chromePath)('pdfGenerator', () => {
  let browser: Browser;

  beforeAll(async () => {
    browser = await puppeteer.launch({
      executablePath: chromePath!,
      headless: 'shell' as const,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });
  });

  afterAll(async () => {
    await browser?.close();
  });

  it('generates a valid PDF buffer from simple HTML', async () => {
    const html = '<!DOCTYPE html><html><head><title>Test</title></head><body><h1>Hello</h1><p>World</p></body></html>';

    const result = await generatePdf(
      html,
      {
        chromePath: chromePath!,
        brand: DEFAULT_BRAND,
        basedir: FIXTURES,
        relativePath: '.',
        themeCssPath: THEME_CSS,
      },
      browser
    );

    expect(result.content).toBeInstanceOf(Buffer);
    expect(result.content.length).toBeGreaterThan(100);

    // PDF magic bytes: %PDF
    const header = result.content.subarray(0, 5).toString('ascii');
    expect(header).toBe('%PDF-');
  });

  it('applies theme CSS (content is styled)', async () => {
    const html = '<!DOCTYPE html><html><head><title>Test</title></head><body><h1>Styled</h1></body></html>';

    const result = await generatePdf(
      html,
      {
        chromePath: chromePath!,
        brand: DEFAULT_BRAND,
        basedir: FIXTURES,
        relativePath: '.',
        themeCssPath: THEME_CSS,
      },
      browser
    );

    // PDF should be non-trivially sized (theme CSS adds complexity)
    expect(result.content.length).toBeGreaterThan(1000);
  });
});
