import type { Browser } from 'puppeteer-core';
import { BrandConfig } from './types';
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
export declare function generatePdf(html: string, options: PdfOptions, existingBrowser?: Browser): Promise<{
    content: Buffer;
    browser: Browser;
}>;
