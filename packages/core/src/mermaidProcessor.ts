import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as url from 'url';
import type { Browser, Page } from 'puppeteer-core';
import { BrandConfig } from './types';

const MERMAID_REGEX = /```mermaid\n([\s\S]*?)```/g;

/**
 * Check if markdown content contains Mermaid diagram blocks.
 */
export function hasMermaid(content: string): boolean {
  return content.includes('```mermaid');
}

/**
 * Build Mermaid theme configuration from brand colors.
 */
export function getMermaidConfig(brand: BrandConfig): object {
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
async function renderMermaidToSvg(
  browser: Browser,
  definition: string,
  mermaidConfig: object,
  mermaidJsPath: string,
  renderHtmlPath: string
): Promise<Uint8Array> {
  const page: Page = await browser.newPage();
  try {
    await page.goto(url.pathToFileURL(renderHtmlPath).href);
    await page.addScriptTag({ path: mermaidJsPath });

    const svgXml = await page.$eval(
      '#container',
      // @ts-ignore - runs in browser context
      async (container: HTMLElement, def: string, config: object): Promise<string> => {
        const { mermaid } = globalThis as any;
        mermaid.initialize({ startOnLoad: false, ...config });
        const { svg } = await mermaid.render('rendered-svg', def, container);
        container.innerHTML = svg;
        const svgEl = container.querySelector('svg');
        if (svgEl?.style) {
          svgEl.style.backgroundColor = 'white';
        }
        const xmlSerializer = new XMLSerializer();
        return xmlSerializer.serializeToString(svgEl!);
      },
      definition,
      mermaidConfig
    );

    return new TextEncoder().encode(svgXml as string);
  } finally {
    await page.close();
  }
}

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
export async function processMermaidDiagrams(
  content: string,
  baseName: string,
  brand: BrandConfig,
  browser: Browser,
  resourcesPath: string
): Promise<MermaidResult> {
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
      const data = await renderMermaidToSvg(
        browser,
        definition,
        mermaidConfig,
        mermaidJsPath,
        renderHtmlPath
      );
      fs.writeFileSync(svgPath, data);
      processed = processed.replace(match[0], `![](${svgName})`);
      successCount++;
    } catch (e: any) {
      const msg = e?.message?.split('\n')[0] || 'unknown error';
      console.error(`Mermaid diagram ${idx + 1} failed: ${msg}`);
      failCount++;
    }
  }

  return { content: processed, tempDir, successCount, failCount };
}
