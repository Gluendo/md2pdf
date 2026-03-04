import { BrandConfig } from './types';
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
export declare function convertMarkdownToPdf(options: ConvertOptions): Promise<ConvertResult>;
