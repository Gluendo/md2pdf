import * as fs from 'fs';
import { BrandConfig, DEFAULT_BRAND } from './types';

/**
 * Load brand configuration from a JSON file, merging with defaults.
 */
export function loadBrandFromFile(filePath: string): BrandConfig {
  if (!fs.existsSync(filePath)) {
    return { ...DEFAULT_BRAND, colors: { ...DEFAULT_BRAND.colors }, font: { ...DEFAULT_BRAND.font } };
  }

  try {
    const brand = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    return mergeBrandWithDefaults(brand);
  } catch {
    console.warn('Warning: Could not parse brand.json, using defaults');
    return { ...DEFAULT_BRAND, colors: { ...DEFAULT_BRAND.colors }, font: { ...DEFAULT_BRAND.font } };
  }
}

/**
 * Merge a partial brand config with defaults.
 */
export function mergeBrandWithDefaults(partial: Partial<BrandConfig>): BrandConfig {
  return {
    ...DEFAULT_BRAND,
    ...partial,
    colors: { ...DEFAULT_BRAND.colors, ...partial.colors },
    font: { ...DEFAULT_BRAND.font, ...partial.font },
  };
}
