#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import { convertMarkdownToPdf, loadBrandFromFile } from '@md2pdf/core';

// Resolve paths relative to the monorepo root
const REPO_ROOT = path.resolve(__dirname, '..', '..', '..');
const BRAND_PATH = process.env.BRAND_FILE || path.join(REPO_ROOT, 'brand.json');
const THEME_CSS_PATH = path.join(REPO_ROOT, 'themes', 'pdf-theme.css');
const RESOURCES_PATH = path.join(REPO_ROOT, 'resources');
const OUTPUT_DIR = process.env.OUTPUT_DIR || '/output';

function getChromePath(): string {
  return (
    process.env.PUPPETEER_EXECUTABLE_PATH ||
    process.env.CHROME_PATH ||
    '/usr/bin/chromium'
  );
}

function getTimestamp(): string {
  const now = new Date();
  return now
    .toISOString()
    .slice(0, 16)
    .replace(/[-:T]/g, '')
    .replace(/(\d{8})(\d{4})/, '$1-$2');
}

function showHelp(): void {
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

async function main(): Promise<void> {
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

  const brand = loadBrandFromFile(BRAND_PATH);
  const chromePath = getChromePath();
  const timestamp = getTimestamp();

  // Get files to process
  const stats = fs.statSync(targetPath);
  let files: string[] = [];

  if (stats.isDirectory()) {
    files = fs
      .readdirSync(targetPath)
      .filter((f) => f.endsWith('.md') && !f.toLowerCase().includes('readme'))
      .map((f) => path.join(targetPath, f));
  } else if (targetPath.endsWith('.md')) {
    files = [targetPath];
  } else {
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
      const result = await convertMarkdownToPdf({
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
        console.error(
          `    ⚠ ${result.mermaidDiagramsFailed} Mermaid diagram(s) failed`
        );
      }

      console.log(`    ✓ ${outputPath}`);
      success++;
    } catch (err: any) {
      console.error(`    ✗ Error: ${err.message}`);
    }
  }

  console.log(`\n✓ Done: ${success}/${files.length} converted\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
