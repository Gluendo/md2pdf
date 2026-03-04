import { describe, it, expect } from 'vitest';
import { buildBrandCSS } from '../../src/cssBuilder';
import { DEFAULT_BRAND, BrandConfig } from '../../src/types';

describe('buildBrandCSS', () => {
  it('generates CSS variables from default brand', () => {
    const css = buildBrandCSS(DEFAULT_BRAND);
    expect(css).toContain('--brand-primary: #1a365d');
    expect(css).toContain('--brand-accent: #3182ce');
    expect(css).toContain('--brand-secondary: #2c7a7b');
    expect(css).toContain('--brand-warning: #c53030');
  });

  it('converts camelCase to kebab-case', () => {
    const css = buildBrandCSS(DEFAULT_BRAND);
    expect(css).toContain('--brand-light-grey: #f7fafc');
    expect(css).toContain('--brand-border-grey: #e2e8f0');
    // Should NOT contain camelCase versions
    expect(css).not.toContain('--brand-lightGrey');
    expect(css).not.toContain('--brand-borderGrey');
  });

  it('includes @import when font URL is set', () => {
    const brand: BrandConfig = {
      ...DEFAULT_BRAND,
      font: { family: 'Roboto', url: 'https://fonts.googleapis.com/css2?family=Roboto' },
    };
    const css = buildBrandCSS(brand);
    expect(css).toContain("@import url('https://fonts.googleapis.com/css2?family=Roboto')");
  });

  it('does not include @import when font URL is null', () => {
    const css = buildBrandCSS(DEFAULT_BRAND);
    expect(css).not.toContain('@import');
  });

  it('includes body font-family rule', () => {
    const css = buildBrandCSS(DEFAULT_BRAND);
    expect(css).toContain('body { font-family:');
    expect(css).toContain('system-ui');
  });

  it('includes SVG image styling', () => {
    const css = buildBrandCSS(DEFAULT_BRAND);
    expect(css).toContain('img[src$=".svg"]');
    expect(css).toContain('max-width: 100%');
  });
});
