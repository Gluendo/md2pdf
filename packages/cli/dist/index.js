#!/usr/bin/env node
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
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const core_1 = require("@md2pdf/core");
// Resolve paths relative to the monorepo root
const REPO_ROOT = path.resolve(__dirname, '..', '..', '..');
const BRAND_PATH = process.env.BRAND_FILE || path.join(REPO_ROOT, 'brand.json');
const THEME_CSS_PATH = path.join(REPO_ROOT, 'themes', 'pdf-theme.css');
const RESOURCES_PATH = path.join(REPO_ROOT, 'resources');
const OUTPUT_DIR = process.env.OUTPUT_DIR || '/output';
function getChromePath() {
    return (process.env.PUPPETEER_EXECUTABLE_PATH ||
        process.env.CHROME_PATH ||
        '/usr/bin/chromium');
}
function getTimestamp() {
    const now = new Date();
    return now
        .toISOString()
        .slice(0, 16)
        .replace(/[-:T]/g, '')
        .replace(/(\d{8})(\d{4})/, '$1-$2');
}
function showHelp() {
    console.log(`
md2pdf - Markdown to PDF Generator

Usage:
  docker run --rm -v $(pwd):/docs -v $(pwd)/output:/output ghcr.io/gluendo/md2pdf <file.md|directory>

Examples:
  # Convert a single file
  docker run --rm -v $(pwd):/docs -v $(pwd)/output:/output ghcr.io/gluendo/md2pdf README.md

  # Convert all .md files in docs/
  docker run --rm -v $(pwd):/docs -v $(pwd)/output:/output ghcr.io/gluendo/md2pdf docs/

  # Use custom branding
  docker run --rm -v $(pwd):/docs -v $(pwd)/output:/output -v $(pwd)/brand.json:/app/brand.json ghcr.io/gluendo/md2pdf doc.md

Output: output/<filename>_YYYYMMDD-HHmm.pdf
`);
}
async function main() {
    const target = process.argv[2];
    if (!target || target === '--help' || target === '-h') {
        showHelp();
        process.exit(target ? 0 : 1);
    }
    const targetPath = path.isAbsolute(target)
        ? target
        : path.resolve(process.cwd(), target);
    if (!fs.existsSync(targetPath)) {
        console.error(`Error: Not found: ${target}`);
        process.exit(1);
    }
    // Setup
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    const brand = (0, core_1.loadBrandFromFile)(BRAND_PATH);
    const chromePath = getChromePath();
    const timestamp = getTimestamp();
    // Get files to process
    const stats = fs.statSync(targetPath);
    let files = [];
    if (stats.isDirectory()) {
        files = fs
            .readdirSync(targetPath)
            .filter((f) => f.endsWith('.md') && !f.toLowerCase().includes('readme'))
            .map((f) => path.join(targetPath, f));
    }
    else if (targetPath.endsWith('.md')) {
        files = [targetPath];
    }
    else {
        console.error('Error: Target must be a .md file or directory');
        process.exit(1);
    }
    if (files.length === 0) {
        console.log('No markdown files found');
        process.exit(0);
    }
    console.log(`\n📄 Converting ${files.length} file(s)...\n`);
    let success = 0;
    for (const file of files) {
        const name = path.basename(file, '.md');
        const outputPath = path.join(OUTPUT_DIR, `${name}_${timestamp}.pdf`);
        console.log(`  ${path.basename(file)}`);
        try {
            const result = await (0, core_1.convertMarkdownToPdf)({
                mdFilePath: file,
                outputPath,
                brand,
                chromePath,
                resourcesPath: RESOURCES_PATH,
                themeCssPath: THEME_CSS_PATH,
                onProgress: (message) => {
                    console.log(`    → ${message}`);
                },
            });
            if (result.mermaidDiagramsFailed > 0) {
                console.error(`    ⚠ ${result.mermaidDiagramsFailed} Mermaid diagram(s) failed`);
            }
            console.log(`    ✓ ${outputPath}`);
            success++;
        }
        catch (err) {
            console.error(`    ✗ Error: ${err.message}`);
        }
    }
    console.log(`\n✓ Done: ${success}/${files.length} converted\n`);
}
main().catch((err) => {
    console.error(err);
    process.exit(1);
});
//# sourceMappingURL=index.js.map