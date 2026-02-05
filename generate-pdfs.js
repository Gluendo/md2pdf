#!/usr/bin/env node

/**
 * md2pdf - Markdown to PDF Generator
 *
 * Usage:
 *   node generate-pdfs.js <directory>    Generate PDFs for all .md files in directory
 *   node generate-pdfs.js <file.md>      Generate PDF for a single file
 *
 * Features:
 *   - Converts Mermaid diagrams to SVG before PDF generation
 *   - Applies customizable branding via brand.json
 */

const { mdToPdf } = require('md-to-pdf');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Configuration paths
const BRAND_CONFIG = path.join(__dirname, 'brand.json');
const CSS_PATH = path.join(__dirname, 'themes', 'pdf-theme.css');
const PUPPETEER_CONFIG = path.join(__dirname, 'puppeteer-config.json');
const OUTPUT_DIR = process.env.OUTPUT_DIR || path.join(__dirname, '..', 'output', 'pdf');
const TEMP_DIR = path.join(os.tmpdir(), 'md2pdf-' + Date.now());

// Load brand configuration
function loadBrandConfig() {
  const defaultBrand = {
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
    font: {
      family: 'system-ui, -apple-system, sans-serif',
      url: null
    }
  };

  if (fs.existsSync(BRAND_CONFIG)) {
    try {
      const brand = JSON.parse(fs.readFileSync(BRAND_CONFIG, 'utf-8'));
      return { ...defaultBrand, ...brand, colors: { ...defaultBrand.colors, ...brand.colors } };
    } catch (e) {
      console.warn('Warning: Could not parse brand.json, using defaults');
    }
  }
  return defaultBrand;
}

const brand = loadBrandConfig();

// Generate Mermaid config from brand colors
function generateMermaidConfig() {
  const c = brand.colors;
  return {
    theme: 'base',
    themeVariables: {
      // Core colors
      primaryColor: c.accent,
      primaryTextColor: c.primary,
      primaryBorderColor: c.primary,
      secondaryColor: c.lightGrey,
      secondaryTextColor: c.primary,
      secondaryBorderColor: c.primary,
      tertiaryColor: c.secondary,
      tertiaryTextColor: '#FFFFFF',
      tertiaryBorderColor: c.primary,
      lineColor: c.primary,
      textColor: '#333333',
      mainBkg: '#FFFFFF',
      nodeBorder: c.primary,
      clusterBkg: c.lightGrey,
      clusterBorder: c.primary,
      titleColor: c.primary,
      edgeLabelBackground: '#FFFFFF',
      nodeTextColor: c.primary,
      // Sequence diagrams
      actorBkg: c.primary,
      actorBorder: c.primary,
      actorTextColor: '#FFFFFF',
      actorLineColor: c.primary,
      signalColor: c.primary,
      signalTextColor: c.primary,
      labelBoxBkgColor: c.accent,
      labelBoxBorderColor: c.primary,
      labelTextColor: c.primary,
      loopTextColor: c.primary,
      noteBorderColor: c.secondary,
      noteBkgColor: c.lightGrey,
      noteTextColor: '#333333',
      activationBorderColor: c.primary,
      activationBkgColor: c.accent,
      sequenceNumberColor: '#FFFFFF',
      // Gantt charts
      sectionBkgColor: c.accent,
      altSectionBkgColor: c.lightGrey,
      sectionBkgColor2: c.secondary,
      taskBorderColor: c.primary,
      taskBkgColor: c.accent,
      taskTextColor: c.primary,
      taskTextLightColor: c.primary,
      taskTextOutsideColor: '#333333',
      taskTextClickableColor: c.primary,
      activeTaskBorderColor: c.primary,
      activeTaskBkgColor: c.secondary,
      gridColor: c.borderGrey,
      doneTaskBkgColor: c.secondary,
      doneTaskBorderColor: c.primary,
      critBorderColor: c.warning,
      critBkgColor: c.warning,
      todayLineColor: c.warning,
      // C4 diagrams
      personBorder: c.primary,
      personBkg: c.accent,
      containerBorder: c.primary,
      containerBkg: c.accent,
      container_bgColor: c.accent,
      container_borderColor: c.primary,
      external_container_bgColor: c.lightGrey,
      external_container_borderColor: '#999999',
      component_bgColor: c.accent,
      component_borderColor: c.primary,
      external_component_bgColor: c.lightGrey,
      external_component_borderColor: '#999999',
      person_bgColor: c.primary,
      person_borderColor: c.primary,
      external_person_bgColor: '#999999',
      external_person_borderColor: '#999999',
      system_bgColor: c.primary,
      system_borderColor: c.primary,
      external_system_bgColor: '#999999',
      external_system_borderColor: '#999999'
    },
    flowchart: {
      curve: 'basis',
      padding: 15,
      nodeSpacing: 50,
      rankSpacing: 50
    },
    sequence: {
      diagramMarginX: 50,
      diagramMarginY: 10,
      actorMargin: 50,
      width: 150,
      height: 65,
      boxMargin: 10,
      boxTextMargin: 5,
      noteMargin: 10,
      messageMargin: 35
    },
    c4: {
      personFontSize: 14,
      personFontWeight: 'normal',
      systemFontSize: 14,
      systemFontWeight: 'normal',
      containerFontSize: 14,
      containerFontWeight: 'normal',
      componentFontSize: 14,
      componentFontWeight: 'normal',
      c4ShapeInRow: 4,
      c4BoundaryInRow: 2
    }
  };
}

// Generate CSS variables from brand config
function generateBrandCSS() {
  let css = ':root {\n';
  css += `  --brand-primary: ${brand.colors.primary};\n`;
  css += `  --brand-accent: ${brand.colors.accent};\n`;
  css += `  --brand-secondary: ${brand.colors.secondary};\n`;
  css += `  --brand-warning: ${brand.colors.warning};\n`;
  css += `  --brand-light-grey: ${brand.colors.lightGrey};\n`;
  css += `  --brand-border-grey: ${brand.colors.borderGrey};\n`;
  css += '}\n';

  if (brand.font.url) {
    css = `@import url('${brand.font.url}');\n\n` + css;
  }

  return css;
}

// Generate datetime suffix: YYYYMMDD-HHmm
function getDateTimeSuffix() {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const time = now.toTimeString().slice(0, 5).replace(':', '');
  return `${date}-${time}`;
}

// Check if file contains Mermaid code blocks
function hasMermaid(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  return content.includes('```mermaid');
}

// Pre-process markdown with mermaid-cli to convert diagrams to SVG
function preprocessMermaid(inputPath, mermaidConfigPath) {
  const fileName = path.basename(inputPath);
  const outputPath = path.join(TEMP_DIR, fileName);

  try {
    // Build mmdc command with generated config
    let mmCmd = `npx mmdc -i "${inputPath}" -o "${outputPath}" -a "${TEMP_DIR}/" -q`;
    mmCmd += ` -c "${mermaidConfigPath}"`;

    // Add puppeteer config if it exists (needed for Docker)
    if (fs.existsSync(PUPPETEER_CONFIG)) {
      mmCmd += ` -p "${PUPPETEER_CONFIG}"`;
    }

    // Run mmdc to convert Mermaid blocks to SVG
    execSync(mmCmd, { cwd: __dirname, stdio: 'pipe' });
    return outputPath;
  } catch (error) {
    console.error(`  ⚠ Mermaid preprocessing failed, using original file`);
    return inputPath;
  }
}

// Build PDF options with brand config
function buildPdfOptions() {
  const fontFamily = brand.font.family || 'system-ui, -apple-system, sans-serif';

  return {
    stylesheet: CSS_PATH,
    css: `
      ${generateBrandCSS()}

      body {
        font-family: '${fontFamily.split(',')[0].replace(/'/g, '')}', ${fontFamily};
      }

      /* SVG diagram styling */
      img[src$=".svg"] {
        display: block;
        margin: 20px auto;
        max-width: 100%;
      }
    `,
    pdf_options: {
      format: 'A4',
      margin: {
        top: '25mm',
        right: '20mm',
        bottom: '25mm',
        left: '20mm'
      },
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: `
        <div style="width: 100%; font-size: 9px; font-family: '${fontFamily.split(',')[0].replace(/'/g, '')}', Arial, sans-serif; padding: 0 20mm;">
          <div style="float: right; color: ${brand.colors.primary};">
            <strong>${brand.header || brand.name}</strong>
          </div>
        </div>
      `,
      footerTemplate: `
        <div style="width: 100%; font-size: 9px; font-family: '${fontFamily.split(',')[0].replace(/'/g, '')}', Arial, sans-serif; padding: 0 20mm; display: flex; justify-content: space-between;">
          <span style="color: #999;">${brand.footer || ''}</span>
          <span style="color: #666;">Page <span class="pageNumber"></span> / <span class="totalPages"></span></span>
        </div>
      `
    },
    launch_options: {
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
  };
}

async function generatePdf(inputPath, dateSuffix, pdfOptions, mermaidConfigPath) {
  const fileName = path.basename(inputPath, '.md');
  const outputPath = path.join(OUTPUT_DIR, `${fileName}_${dateSuffix}.pdf`);

  console.log(`  Converting: ${path.basename(inputPath)} -> ${fileName}.pdf`);

  let processedPath = inputPath;

  // Pre-process Mermaid diagrams if present
  if (hasMermaid(inputPath)) {
    console.log(`    → Processing Mermaid diagrams...`);
    processedPath = preprocessMermaid(inputPath, mermaidConfigPath);
  }

  try {
    const pdf = await mdToPdf(
      { path: processedPath },
      pdfOptions
    );

    if (pdf) {
      fs.writeFileSync(outputPath, pdf.content);
      console.log(`  ✓ Generated: ${outputPath}`);
      return true;
    }
  } catch (error) {
    console.error(`  ✗ Error converting ${inputPath}:`, error.message);
    return false;
  }
}

// Clean up temp directory
function cleanup() {
  if (fs.existsSync(TEMP_DIR)) {
    fs.rmSync(TEMP_DIR, { recursive: true, force: true });
  }
}

// Center text in a box
function centerText(text, width) {
  const padding = Math.max(0, width - text.length);
  const leftPad = Math.floor(padding / 2);
  const rightPad = padding - leftPad;
  return ' '.repeat(leftPad) + text + ' '.repeat(rightPad);
}

async function main() {
  const target = process.argv[2];

  if (!target) {
    console.log('Usage: node generate-pdfs.js <directory|file.md>');
    console.log('');
    console.log('Examples:');
    console.log('  node generate-pdfs.js ../docs         # All docs');
    console.log('  node generate-pdfs.js ../README.md    # Single file');
    process.exit(1);
  }

  // Resolve path: if absolute, use as-is; if relative, resolve from cwd (not __dirname)
  // This allows Docker to work with paths relative to /docs mount point
  const targetPath = path.isAbsolute(target) ? target : path.resolve(process.cwd(), target);

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log(`Created output directory: ${OUTPUT_DIR}`);
  }

  // Create temp directory for Mermaid processing
  if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
  }

  // Generate Mermaid config from brand colors
  const mermaidConfigPath = path.join(TEMP_DIR, 'mermaid-config.json');
  fs.writeFileSync(mermaidConfigPath, JSON.stringify(generateMermaidConfig(), null, 2));

  // Build PDF options with brand config
  const pdfOptions = buildPdfOptions();

  // Display banner
  const title = `${brand.name} - PDF Generator`;
  const boxWidth = Math.max(60, title.length + 8);

  console.log('');
  console.log('╔' + '═'.repeat(boxWidth) + '╗');
  console.log('║' + centerText(title, boxWidth) + '║');
  console.log('╚' + '═'.repeat(boxWidth) + '╝');
  console.log('');

  const stats = fs.statSync(targetPath);
  let files = [];

  if (stats.isDirectory()) {
    // Get all .md files in directory, excluding templates and READMEs
    const allFiles = fs.readdirSync(targetPath);
    files = allFiles
      .filter(f => f.endsWith('.md'))
      .filter(f => !f.includes('template') && !f.toLowerCase().includes('readme'))
      .map(f => path.join(targetPath, f));

    console.log(`Found ${files.length} markdown files in ${target}`);
    console.log('');
  } else if (targetPath.endsWith('.md')) {
    files = [targetPath];
  } else {
    console.error('Error: Target must be a directory or .md file');
    process.exit(1);
  }

  let success = 0;
  let failed = 0;
  const dateSuffix = getDateTimeSuffix();

  for (const file of files) {
    const result = await generatePdf(file, dateSuffix, pdfOptions, mermaidConfigPath);
    if (result) success++;
    else failed++;
  }

  // Clean up temp files
  cleanup();

  console.log('');
  console.log('─'.repeat(boxWidth + 2));
  console.log(`Done! ${success} generated, ${failed} failed`);
  console.log(`Output: ${OUTPUT_DIR}`);
  console.log('');
}

main().catch((error) => {
  cleanup();
  console.error(error);
  process.exit(1);
});
