import { describe, it, expect } from 'vitest';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { loadBrandFromFile, mergeBrandWithDefaults } from '../../src/brandConfig';
import { DEFAULT_BRAND } from '../../src/types';

const FIXTURES = path.join(__dirname, '..', 'fixtures');

describe('loadBrandFromFile', () => {
  it('loads and merges a valid brand.json', () => {
    const brand = loadBrandFromFile(path.join(FIXTURES, 'brand-custom.json'));
    expect(brand.name).toBe('Test Corp');
    expect(brand.header).toBe('Test Corp Header');
    expect(brand.footer).toBe('CONFIDENTIAL');
    expect(brand.colors.primary).toBe('#ff0000');
    expect(brand.colors.accent).toBe('#00ff00');
    // Unspecified colors should fall back to defaults
    expect(brand.colors.secondary).toBe(DEFAULT_BRAND.colors.secondary);
    expect(brand.colors.warning).toBe(DEFAULT_BRAND.colors.warning);
  });

  it('returns defaults when file does not exist', () => {
    const brand = loadBrandFromFile('/nonexistent/brand.json');
    expect(brand).toEqual({
      ...DEFAULT_BRAND,
      colors: { ...DEFAULT_BRAND.colors },
      font: { ...DEFAULT_BRAND.font },
    });
  });

  it('returns defaults when file contains malformed JSON', () => {
    const tmpFile = path.join(os.tmpdir(), `bad-brand-${Date.now()}.json`);
    fs.writeFileSync(tmpFile, '{ not valid json !!!');
    try {
      const brand = loadBrandFromFile(tmpFile);
      expect(brand.name).toBe(DEFAULT_BRAND.name);
      expect(brand.colors.primary).toBe(DEFAULT_BRAND.colors.primary);
    } finally {
      fs.unlinkSync(tmpFile);
    }
  });
});

describe('mergeBrandWithDefaults', () => {
  it('fills missing colors from defaults', () => {
    const brand = mergeBrandWithDefaults({
      colors: { primary: '#123456' } as any,
    });
    expect(brand.colors.primary).toBe('#123456');
    expect(brand.colors.accent).toBe(DEFAULT_BRAND.colors.accent);
    expect(brand.colors.lightGrey).toBe(DEFAULT_BRAND.colors.lightGrey);
  });

  it('returns all defaults for empty object', () => {
    const brand = mergeBrandWithDefaults({});
    expect(brand.name).toBe(DEFAULT_BRAND.name);
    expect(brand.colors).toEqual(DEFAULT_BRAND.colors);
    expect(brand.font).toEqual(DEFAULT_BRAND.font);
  });

  it('preserves custom font settings', () => {
    const brand = mergeBrandWithDefaults({
      font: { family: 'Roboto, sans-serif', url: 'https://fonts.example.com/roboto' },
    });
    expect(brand.font.family).toBe('Roboto, sans-serif');
    expect(brand.font.url).toBe('https://fonts.example.com/roboto');
  });
});
