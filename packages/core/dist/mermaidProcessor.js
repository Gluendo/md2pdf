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
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasMermaid = hasMermaid;
exports.getMermaidConfig = getMermaidConfig;
exports.processMermaidDiagrams = processMermaidDiagrams;
const fs = __importStar(require("fs"));
const os = __importStar(require("os"));
const path = __importStar(require("path"));
const url = __importStar(require("url"));
const MERMAID_REGEX = /```mermaid\n([\s\S]*?)```/g;
/**
 * Check if markdown content contains Mermaid diagram blocks.
 */
function hasMermaid(content) {
    return content.includes('```mermaid');
}
/**
 * Build Mermaid theme configuration from brand colors.
 */
function getMermaidConfig(brand) {
    const c = brand.colors;
    return {
        theme: 'base',
        themeVariables: {
            background: '#FFFFFF',
            primaryColor: c.accent,
            primaryTextColor: c.primary,
            primaryBorderColor: c.primary,
            secondaryColor: c.lightGrey,
            secondaryTextColor: c.primary,
            secondaryBorderColor: c.borderGrey,
            tertiaryColor: c.secondary,
            tertiaryTextColor: '#FFFFFF',
            tertiaryBorderColor: c.primary,
            nodeBkg: c.accent,
            nodeBorder: c.primary,
            nodeTextColor: c.primary,
            mainBkg: '#FFFFFF',
            clusterBkg: c.lightGrey,
            clusterBorder: c.primary,
            lineColor: c.primary,
            textColor: '#333333',
            titleColor: c.primary,
            edgeLabelBackground: '#FFFFFF',
            actorBkg: c.primary,
            actorBorder: c.primary,
            actorTextColor: '#FFFFFF',
            actorLineColor: c.primary,
            signalColor: c.primary,
            signalTextColor: c.primary,
            noteBkgColor: c.lightGrey,
            noteBorderColor: c.borderGrey,
            noteTextColor: '#333333',
            activationBkgColor: c.accent,
            activationBorderColor: c.primary,
        },
        flowchart: { curve: 'basis', padding: 15 },
        sequence: { actorMargin: 50, messageMargin: 35 },
    };
}
/**
 * Render a single Mermaid diagram definition to SVG using a Puppeteer browser.
 */
async function renderMermaidToSvg(browser, definition, mermaidConfig, mermaidJsPath, renderHtmlPath) {
    const page = await browser.newPage();
    try {
        await page.goto(url.pathToFileURL(renderHtmlPath).href);
        await page.addScriptTag({ path: mermaidJsPath });
        const svgXml = await page.$eval('#container', 
        // @ts-ignore - runs in browser context
        async (container, def, config) => {
            const { mermaid } = globalThis;
            mermaid.initialize({ startOnLoad: false, ...config });
            const { svg } = await mermaid.render('rendered-svg', def, container);
            container.innerHTML = svg;
            const svgEl = container.querySelector('svg');
            if (svgEl?.style) {
                svgEl.style.backgroundColor = 'white';
            }
            const xmlSerializer = new XMLSerializer();
            return xmlSerializer.serializeToString(svgEl);
        }, definition, mermaidConfig);
        return new TextEncoder().encode(svgXml);
    }
    finally {
        await page.close();
    }
}
/**
 * Process Mermaid diagrams in markdown content.
 * Extracts mermaid blocks, renders each to SVG, replaces with image references.
 *
 * @param resourcesPath - Directory containing mermaid.min.js and mermaid-render.html
 */
async function processMermaidDiagrams(content, baseName, brand, browser, resourcesPath) {
    const mermaidConfig = getMermaidConfig(brand);
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'md2pdf-'));
    const mermaidJsPath = path.join(resourcesPath, 'mermaid.min.js');
    const renderHtmlPath = path.join(resourcesPath, 'mermaid-render.html');
    const matches = [...content.matchAll(MERMAID_REGEX)];
    let processed = content;
    let successCount = 0;
    let failCount = 0;
    for (let idx = 0; idx < matches.length; idx++) {
        const match = matches[idx];
        const definition = match[1].trim();
        const svgName = `${baseName}-${idx + 1}.svg`;
        const svgPath = path.join(tempDir, svgName);
        try {
            const data = await renderMermaidToSvg(browser, definition, mermaidConfig, mermaidJsPath, renderHtmlPath);
            fs.writeFileSync(svgPath, data);
            processed = processed.replace(match[0], `![](${svgName})`);
            successCount++;
        }
        catch (e) {
            const msg = e?.message?.split('\n')[0] || 'unknown error';
            console.error(`Mermaid diagram ${idx + 1} failed: ${msg}`);
            failCount++;
        }
    }
    return { content: processed, tempDir, successCount, failCount };
}
//# sourceMappingURL=mermaidProcessor.js.map