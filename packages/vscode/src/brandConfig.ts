import * as path from 'path';
import * as vscode from 'vscode';
import { loadBrandFromFile, mergeBrandWithDefaults, BrandConfig, BrandColors, DEFAULT_BRAND } from '@md2pdf/core';

/**
 * Load brand configuration for the VSCode extension.
 * Resolution: workspace brand.json → VSCode settings overlay → defaults.
 */
export function loadBrandConfig(): BrandConfig {
  // Start with brand.json from workspace root (if it exists)
  let brand: BrandConfig;
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (workspaceFolders) {
    const brandPath = path.join(workspaceFolders[0].uri.fsPath, 'brand.json');
    brand = loadBrandFromFile(brandPath);
  } else {
    brand = mergeBrandWithDefaults({});
  }

  // Overlay VSCode settings (only non-default values)
  const config = vscode.workspace.getConfiguration('md2pdf.brand');

  const name = config.get<string>('name');
  if (name && name !== DEFAULT_BRAND.name) brand.name = name;

  const header = config.get<string>('header');
  if (header !== undefined && header !== DEFAULT_BRAND.header) brand.header = header;

  const footer = config.get<string>('footer');
  if (footer !== undefined && footer !== DEFAULT_BRAND.footer) brand.footer = footer;

  const colorKeys: (keyof BrandColors)[] = ['primary', 'accent', 'secondary', 'warning', 'lightGrey', 'borderGrey'];
  const colorsConfig = vscode.workspace.getConfiguration('md2pdf.brand.colors');
  for (const key of colorKeys) {
    const val = colorsConfig.get<string>(key);
    if (val && val !== DEFAULT_BRAND.colors[key]) {
      brand.colors[key] = val;
    }
  }

  const fontFamily = config.get<string>('font.family');
  if (fontFamily && fontFamily !== DEFAULT_BRAND.font.family) brand.font.family = fontFamily;

  const fontUrl = config.get<string | null>('font.url');
  if (fontUrl !== undefined && fontUrl !== DEFAULT_BRAND.font.url) brand.font.url = fontUrl;

  return brand;
}
