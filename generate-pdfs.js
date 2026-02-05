#!/usr/bin/env node

/**
 * md2pdf - Markdown to PDF Generator
 * Converts Markdown files to PDF with Mermaid diagram support
 */

const { mdToPdf } = require('md-to-pdf');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Paths
const APP_DIR = '/app';
const BRAND_PATH = process.env.BRAND_FILE || path.join(APP_DIR, 'brand.json');
const CSS_PATH = path.join(APP_DIR, 'themes', 'pdf-theme.css');
const PUPPETEER_CONFIG = path.join(APP_DIR, 'puppeteer-config.json');
const OUTPUT_DIR = process.env.OUTPUT_DIR || '/output';
const TEMP_DIR = path.join(os.tmpdir(), `md2pdf-${Date.now()}`);

// Load brand config with defaults
function loadBrand() {
  const defaults = {
    name: 'Document',
    header: '',
    footer: '',
    colors: {
      primary: '#1a365d',
      accent: '#3182ce',
      secondary: '#2c7a7b',
      warning: '#c53030',
      lightGrey: '#f7fafc',
      borderGrey: '#e2e8f0'
    },
    font: { family: 'system-ui, -apple-system, sans-serif', url: null }
  };

  if (fs.existsSync(BRAND_PATH)) {
    try {
      const brand = JSON.parse(fs.readFileSync(BRAND_PATH, 'utf-8'));
      return { ...defaults, ...brand, colors: { ...defaults.colors, ...brand.colors } };
    } catch (e) {
      console.warn('Warning: Could not parse brand.json, using defaults');
    }
  }
  return defaults;
}

const brand = loadBrand();

// Generate Mermaid theme config from brand colors
function getMermaidConfig() {
  const c = brand.colors;
  return {
    theme: 'base',
    themeVariables: {
      primaryColor: c.accent,
      primaryTextColor: c.primary,
      primaryBorderColor: c.primary,
      secondaryColor: c.lightGrey,
      lineColor: c.primary,
      textColor: '#333333',
      nodeBorder: c.primary,
      actorBkg: c.primary,
      actorTextColor: '#FFFFFF',
      noteBkgColor: c.lightGrey
    },
    flowchart: { curve: 'basis', padding: 15 },
    sequence: { actorMargin: 50, messageMargin: 35 }
  };
}

// Generate CSS variables from brand
function getBrandCSS() {
  let css = ':root {\n';
  Object.entries(brand.colors).forEach(([key, val]) => {
    css += `  --brand-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${val};\n`;
  });
  css += '}\n';
  if (brand.font.url) css = `@import url('${brand.font.url}');\n\n` + css;
  return css;
}

// Get timestamp suffix for output files
function getTimestamp() {
  const now = new Date();
  return now.toISOString().slice(0, 16).replace(/[-:T]/g, '').replace(/(\d{8})(\d{4})/, '$1-$2');
}

// Check if file has Mermaid blocks
function hasMermaid(filePath) {
  return fs.readFileSync(filePath, 'utf-8').includes('```mermaid');
}

// Pre-process Mermaid diagrams to SVG
function processMermaid(inputPath, configPath) {
  const outputPath = path.join(TEMP_DIR, path.basename(inputPath));
  try {
    let cmd = `npx mmdc -i "${inputPath}" -o "${outputPath}" -a "${TEMP_DIR}/" -q -c "${configPath}"`;
    if (fs.existsSync(PUPPETEER_CONFIG)) cmd += ` -p "${PUPPETEER_CONFIG}"`;
    execSync(cmd, { cwd: APP_DIR, stdio: 'pipe' });
    return outputPath;
  } catch {
    console.error('  ⚠ Mermaid processing failed, using original');
    return inputPath;
  }
}

// Build PDF generation options
function getPdfOptions() {
  const fontFamily = brand.font.family;
  const fontName = fontFamily.split(',')[0].replace(/'/g, '').trim();

  return {
    stylesheet: CSS_PATH,
    css: `${getBrandCSS()}\nbody { font-family: '${fontName}', ${fontFamily}; }\nimg[src$=".svg"] { display: block; margin: 20px auto; max-width: 100%; }`,
    pdf_options: {
      format: 'A4',
      margin: { top: '25mm', right: '20mm', bottom: '25mm', left: '20mm' },
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: `<div style="width:100%;font-size:9px;font-family:'${fontName}',sans-serif;padding:0 20mm;text-align:right;color:${brand.colors.primary}"><strong>${brand.header || brand.name}</strong></div>`,
      footerTemplate: `<div style="width:100%;font-size:9px;font-family:'${fontName}',sans-serif;padding:0 20mm;display:flex;justify-content:space-between"><span style="color:#999">${brand.footer}</span><span style="color:#666">Page <span class="pageNumber"></span>/<span class="totalPages"></span></span></div>`
    },
    launch_options: { args: ['--no-sandbox', '--disable-setuid-sandbox'] }
  };
}

// Convert a single file to PDF
async function convertFile(inputPath, timestamp, pdfOptions, mermaidConfig) {
  const name = path.basename(inputPath, '.md');
  const outputPath = path.join(OUTPUT_DIR, `${name}_${timestamp}.pdf`);

  console.log(`  ${path.basename(inputPath)}`);

  let processedPath = inputPath;
  if (hasMermaid(inputPath)) {
    console.log('    → Processing Mermaid diagrams...');
    processedPath = processMermaid(inputPath, mermaidConfig);
  }

  try {
    const pdf = await mdToPdf({ path: processedPath }, pdfOptions);
    if (pdf) {
      fs.writeFileSync(outputPath, pdf.content);
      console.log(`    ✓ ${outputPath}`);
      return true;
    }
  } catch (err) {
    console.error(`    ✗ Error: ${err.message}`);
  }
  return false;
}

// Show help
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

// Main
async function main() {
  const target = process.argv[2];

  if (!target || target === '--help' || target === '-h') {
    showHelp();
    process.exit(target ? 0 : 1);
  }

  const targetPath = path.isAbsolute(target) ? target : path.resolve(process.cwd(), target);

  if (!fs.existsSync(targetPath)) {
    console.error(`Error: Not found: ${target}`);
    process.exit(1);
  }

  // Setup
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.mkdirSync(TEMP_DIR, { recursive: true });

  const mermaidConfig = path.join(TEMP_DIR, 'mermaid.json');
  fs.writeFileSync(mermaidConfig, JSON.stringify(getMermaidConfig()));

  const pdfOptions = getPdfOptions();
  const timestamp = getTimestamp();

  // Get files to process
  const stats = fs.statSync(targetPath);
  let files = [];

  if (stats.isDirectory()) {
    files = fs.readdirSync(targetPath)
      .filter(f => f.endsWith('.md') && !f.toLowerCase().includes('readme'))
      .map(f => path.join(targetPath, f));
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

  // Process files
  console.log(`\n📄 Converting ${files.length} file(s)...\n`);

  let success = 0;
  for (const file of files) {
    if (await convertFile(file, timestamp, pdfOptions, mermaidConfig)) success++;
  }

  // Cleanup
  fs.rmSync(TEMP_DIR, { recursive: true, force: true });

  console.log(`\n✓ Done: ${success}/${files.length} converted\n`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
