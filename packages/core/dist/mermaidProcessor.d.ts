import type { Browser } from 'puppeteer-core';
import { BrandConfig } from './types';
/**
 * Check if markdown content contains Mermaid diagram blocks.
 */
export declare function hasMermaid(content: string): boolean;
/**
 * Build Mermaid theme configuration from brand colors.
 */
export declare function getMermaidConfig(brand: BrandConfig): object;
export interface MermaidResult {
    content: string;
    tempDir: string;
    successCount: number;
    failCount: number;
}
/**
 * Process Mermaid diagrams in markdown content.
 * Extracts mermaid blocks, renders each to SVG, replaces with image references.
 *
 * @param resourcesPath - Directory containing mermaid.min.js and mermaid-render.html
 */
export declare function processMermaidDiagrams(content: string, baseName: string, brand: BrandConfig, browser: Browser, resourcesPath: string): Promise<MermaidResult>;
