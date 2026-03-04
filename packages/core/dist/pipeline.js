"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertMarkdownToPdf = convertMarkdownToPdf;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const puppeteer_core_1 = __importDefault(require("puppeteer-core"));
const markdown_1 = require("./markdown");
const pdfGenerator_1 = require("./pdfGenerator");
const mermaidProcessor_1 = require("./mermaidProcessor");
/**
 * Full conversion pipeline: markdown file -> PDF file.
 */
async function convertMarkdownToPdf(options) {
    const { mdFilePath, outputPath, brand, chromePath, resourcesPath, themeCssPath, onProgress, cancelled } = options;
    let browser;
    let tempDir;
    let mermaidFailed = 0;
    const progress = (msg, pct) => onProgress?.(msg, pct);
    const checkCancelled = () => { if (cancelled?.())
        throw new Error('Cancelled'); };
    try {
        // Step 1: Read markdown
        progress('Reading markdown...', 5);
        checkCancelled();
        let content = fs.readFileSync(mdFilePath, 'utf-8');
        const baseName = path.basename(mdFilePath, '.md');
        let basedir = path.dirname(mdFilePath);
        // Step 2: Process Mermaid diagrams (if any)
        if ((0, mermaidProcessor_1.hasMermaid)(content)) {
            progress('Launching Chrome for diagrams...', 10);
            checkCancelled();
            browser = await puppeteer_core_1.default.launch({
                executablePath: chromePath,
                headless: 'shell',
                args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
                protocolTimeout: 120_000,
            });
            progress('Rendering Mermaid diagrams...', 15);
            checkCancelled();
            const result = await (0, mermaidProcessor_1.processMermaidDiagrams)(content, baseName, brand, browser, resourcesPath);
            content = result.content;
            tempDir = result.tempDir;
            basedir = tempDir;
            mermaidFailed = result.failCount;
        }
        // Step 3: Convert markdown to HTML
        progress('Converting to HTML...', 40);
        checkCancelled();
        const html = (0, markdown_1.markdownToHtml)(content, baseName);
        // Step 4: Generate PDF
        progress('Generating PDF...', 60);
        checkCancelled();
        const relativePath = tempDir
            ? '.'
            : path.relative(basedir, path.dirname(mdFilePath)) || '.';
        const { content: pdfContent, browser: usedBrowser } = await (0, pdfGenerator_1.generatePdf)(html, { chromePath, brand, basedir, relativePath, themeCssPath }, browser);
        browser = usedBrowser;
        // Step 5: Write output
        progress('Writing PDF...', 90);
        const outputDir = path.dirname(outputPath);
        fs.mkdirSync(outputDir, { recursive: true });
        fs.writeFileSync(outputPath, pdfContent);
        progress('Done!', 100);
        return { mermaidDiagramsFailed: mermaidFailed };
    }
    finally {
        if (browser) {
            await browser.close().catch(() => { });
        }
        if (tempDir) {
            fs.rmSync(tempDir, { recursive: true, force: true });
        }
    }
}
//# sourceMappingURL=pipeline.js.map