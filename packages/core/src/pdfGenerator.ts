import * as fs from 'fs';
import * as path from 'path';
import puppeteer from 'puppeteer-core';
import type { Browser } from 'puppeteer-core';
import { BrandConfig } from './types';
import { buildBrandCSS } from './cssBuilder';
import { startFileServer, stopFileServer, FileServer } from './fileServer';

export interface PdfOptions {
  chromePath: string;
  brand: BrandConfig;
  basedir: string;
  relativePath: string;
  themeCssPath: string;
}

/**
 * Generate a PDF buffer from an HTML string.
 */
export async function generatePdf(
  html: string,
  options: PdfOptions,
  existingBrowser?: Browser
): Promise<{ content: Buffer; browser: Browser }> {
  const { chromePath, brand, basedir, relativePath, themeCssPath } = options;

  const browser =
    existingBrowser ||
    (await puppeteer.launch({
      executablePath: chromePath,
      headless: 'shell' as const,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      protocolTimeout: 120_000,
    }));

  let fileServer: FileServer | undefined;

  try {
    fileServer = await startFileServer(basedir);
    const page = await browser.newPage();

    try {
      // Build the base URL for resolving relative asset paths (images, SVGs)
      const baseUrlPath = relativePath === '.'
        ? ''
        : relativePath.split(path.sep).join(path.posix.sep) + '/';
      const baseUrl = `http://localhost:${fileServer.port}/${baseUrlPath}`;

      // Inject <base> tag into the HTML so relative URLs resolve via file server
      const htmlWithBase = html.replace(
        /<head>/i,
        `<head><base href="${baseUrl}">`
      );

      // Set content directly — no navigation needed
      await page.setContent(htmlWithBase, { waitUntil: 'load', timeout: 30_000 });

      // Wait for images/assets to finish loading
      await page.evaluate(() =>
        Promise.all(
          Array.from(document.images)
            .filter(img => !img.complete)
            .map(img => new Promise<void>(res => { img.onload = img.onerror = () => res(); }))
        )
      );

      // Inject theme CSS from file
      const themeCSS = fs.readFileSync(themeCssPath, 'utf-8');
      await page.addStyleTag({ content: themeCSS });

      // Inject brand CSS variables + font
      const brandCSS = buildBrandCSS(brand);
      await page.addStyleTag({ content: brandCSS });

      // Emulate screen media for consistent rendering
      await page.emulateMediaType('screen');

      // Build header/footer templates
      const fontName = brand.font.family.split(',')[0].replace(/'/g, '').trim();

      const headerTemplate = `<div style="width:100%;font-size:9px;font-family:'${fontName}',sans-serif;padding:0 20mm;text-align:right;color:${brand.colors.primary}"><strong>${brand.header || brand.name}</strong></div>`;

      const footerTemplate = `<div style="width:100%;font-size:9px;font-family:'${fontName}',sans-serif;padding:0 20mm;display:flex;justify-content:space-between"><span style="color:#999">${brand.footer}</span><span style="color:#666">Page <span class="pageNumber"></span>/<span class="totalPages"></span></span></div>`;

      // Generate PDF
      const pdfBuffer = await page.pdf({
        format: 'A4',
        margin: { top: '25mm', right: '20mm', bottom: '25mm', left: '20mm' },
        printBackground: true,
        displayHeaderFooter: true,
        headerTemplate,
        footerTemplate,
        outline: true,
      });

      return { content: Buffer.from(pdfBuffer), browser };
    } finally {
      await page.close();
    }
  } finally {
    if (fileServer) {
      await stopFileServer(fileServer).catch(() => {});
    }
  }
}
