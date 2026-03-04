import * as fs from 'fs';
import * as path from 'path';
import puppeteer from 'puppeteer-core';
import type { Browser } from 'puppeteer-core';
import { BrandConfig } from './types';
import { markdownToHtml } from './markdown';
import { generatePdf } from './pdfGenerator';
import { hasMermaid, processMermaidDiagrams } from './mermaidProcessor';

export interface ConvertOptions {
  mdFilePath: string;
  outputPath: string;
  brand: BrandConfig;
  chromePath: string;
  /** Directory containing mermaid.min.js and mermaid-render.html */
  resourcesPath: string;
  /** Path to pdf-theme.css */
  themeCssPath: string;
  /** Progress callback */
  onProgress?: (message: string, percent: number) => void;
  /** Return true to cancel the conversion */
  cancelled?: () => boolean;
}

export interface ConvertResult {
  mermaidDiagramsFailed: number;
}

/**
 * Full conversion pipeline: markdown file -> PDF file.
 */
export async function convertMarkdownToPdf(options: ConvertOptions): Promise<ConvertResult> {
  const { mdFilePath, outputPath, brand, chromePath, resourcesPath, themeCssPath, onProgress, cancelled } = options;
  let browser: Browser | undefined;
  let tempDir: string | undefined;
  let mermaidFailed = 0;

  const progress = (msg: string, pct: number) => onProgress?.(msg, pct);
  const checkCancelled = () => { if (cancelled?.()) throw new Error('Cancelled'); };

  try {
    // Step 1: Read markdown
    progress('Reading markdown...', 5);
    checkCancelled();
    let content = fs.readFileSync(mdFilePath, 'utf-8');
    const baseName = path.basename(mdFilePath, '.md');
    let basedir = path.dirname(mdFilePath);

    // Step 2: Process Mermaid diagrams (if any)
    if (hasMermaid(content)) {
      progress('Launching Chrome for diagrams...', 10);
      checkCancelled();

      browser = await puppeteer.launch({
        executablePath: chromePath,
        headless: 'shell' as const,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
        protocolTimeout: 120_000,
      });

      progress('Rendering Mermaid diagrams...', 15);
      checkCancelled();

      const result = await processMermaidDiagrams(
        content,
        baseName,
        brand,
        browser,
        resourcesPath
      );
      content = result.content;
      tempDir = result.tempDir;
      basedir = tempDir;
      mermaidFailed = result.failCount;
    }

    // Step 3: Convert markdown to HTML
    progress('Converting to HTML...', 40);
    checkCancelled();
    const html = markdownToHtml(content, baseName);

    // Step 4: Generate PDF
    progress('Generating PDF...', 60);
    checkCancelled();

    const relativePath = tempDir
      ? '.'
      : path.relative(basedir, path.dirname(mdFilePath)) || '.';

    const { content: pdfContent, browser: usedBrowser } = await generatePdf(
      html,
      { chromePath, brand, basedir, relativePath, themeCssPath },
      browser
    );
    browser = usedBrowser;

    // Step 5: Write output
    progress('Writing PDF...', 90);
    const outputDir = path.dirname(outputPath);
    fs.mkdirSync(outputDir, { recursive: true });
    fs.writeFileSync(outputPath, pdfContent);

    progress('Done!', 100);
    return { mermaidDiagramsFailed: mermaidFailed };
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
    if (tempDir) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  }
}
