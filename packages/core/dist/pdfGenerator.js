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
exports.generatePdf = generatePdf;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const puppeteer_core_1 = __importDefault(require("puppeteer-core"));
const cssBuilder_1 = require("./cssBuilder");
const fileServer_1 = require("./fileServer");
/**
 * Generate a PDF buffer from an HTML string.
 */
async function generatePdf(html, options, existingBrowser) {
    const { chromePath, brand, basedir, relativePath, themeCssPath } = options;
    const browser = existingBrowser ||
        (await puppeteer_core_1.default.launch({
            executablePath: chromePath,
            headless: 'shell',
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
            protocolTimeout: 120_000,
        }));
    let fileServer;
    try {
        fileServer = await (0, fileServer_1.startFileServer)(basedir);
        const page = await browser.newPage();
        try {
            // Build the base URL for resolving relative asset paths (images, SVGs)
            const baseUrlPath = relativePath === '.'
                ? ''
                : relativePath.split(path.sep).join(path.posix.sep) + '/';
            const baseUrl = `http://localhost:${fileServer.port}/${baseUrlPath}`;
            // Inject <base> tag into the HTML so relative URLs resolve via file server
            const htmlWithBase = html.replace(/<head>/i, `<head><base href="${baseUrl}">`);
            // Set content directly — no navigation needed
            await page.setContent(htmlWithBase, { waitUntil: 'load', timeout: 30_000 });
            // Wait for images/assets to finish loading
            await page.evaluate(() => Promise.all(Array.from(document.images)
                .filter(img => !img.complete)
                .map(img => new Promise(res => { img.onload = img.onerror = () => res(); }))));
            // Inject theme CSS from file
            const themeCSS = fs.readFileSync(themeCssPath, 'utf-8');
            await page.addStyleTag({ content: themeCSS });
            // Inject brand CSS variables + font
            const brandCSS = (0, cssBuilder_1.buildBrandCSS)(brand);
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
        }
        finally {
            await page.close();
        }
    }
    finally {
        if (fileServer) {
            await (0, fileServer_1.stopFileServer)(fileServer).catch(() => { });
        }
    }
}
//# sourceMappingURL=pdfGenerator.js.map