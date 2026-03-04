import { describe, it, expect } from 'vitest';
import { hasMermaid, getMermaidConfig } from '../../src/mermaidProcessor';
import { DEFAULT_BRAND } from '../../src/types';

describe('hasMermaid', () => {
  it('returns true when content has a mermaid block', () => {
    const content = '# Title\n\n```mermaid\ngraph TD\n    A-->B\n```\n';
    expect(hasMermaid(content)).toBe(true);
  });

  it('returns false for regular code blocks', () => {
    const content = '# Title\n\n```javascript\nconst x = 1;\n```\n';
    expect(hasMermaid(content)).toBe(false);
  });

  it('returns false for empty content', () => {
    expect(hasMermaid('')).toBe(false);
  });

  it('returns true with multiple mermaid blocks', () => {
    const content = '```mermaid\ngraph TD\n```\n\nText\n\n```mermaid\nsequenceDiagram\n```';
    expect(hasMermaid(content)).toBe(true);
  });

  it('returns false when mermaid appears in text but not as a code block', () => {
    const content = 'This is about mermaid diagrams.';
    expect(hasMermaid(content)).toBe(false);
  });
});

describe('getMermaidConfig', () => {
  it('uses brand colors in theme variables', () => {
    const config = getMermaidConfig(DEFAULT_BRAND) as any;
    expect(config.theme).toBe('base');
    expect(config.themeVariables.primaryColor).toBe(DEFAULT_BRAND.colors.accent);
    expect(config.themeVariables.primaryTextColor).toBe(DEFAULT_BRAND.colors.primary);
    expect(config.themeVariables.primaryBorderColor).toBe(DEFAULT_BRAND.colors.primary);
    expect(config.themeVariables.secondaryColor).toBe(DEFAULT_BRAND.colors.lightGrey);
    expect(config.themeVariables.tertiaryColor).toBe(DEFAULT_BRAND.colors.secondary);
  });

  it('includes flowchart config', () => {
    const config = getMermaidConfig(DEFAULT_BRAND) as any;
    expect(config.flowchart).toBeDefined();
    expect(config.flowchart.curve).toBe('basis');
    expect(config.flowchart.padding).toBe(15);
  });

  it('includes sequence diagram config', () => {
    const config = getMermaidConfig(DEFAULT_BRAND) as any;
    expect(config.sequence).toBeDefined();
    expect(config.sequence.actorMargin).toBe(50);
    expect(config.sequence.messageMargin).toBe(35);
  });

  it('maps custom brand colors correctly', () => {
    const customBrand = {
      ...DEFAULT_BRAND,
      colors: {
        ...DEFAULT_BRAND.colors,
        primary: '#111111',
        accent: '#222222',
        secondary: '#333333',
      },
    };
    const config = getMermaidConfig(customBrand) as any;
    expect(config.themeVariables.primaryColor).toBe('#222222');
    expect(config.themeVariables.primaryTextColor).toBe('#111111');
    expect(config.themeVariables.tertiaryColor).toBe('#333333');
    expect(config.themeVariables.actorBkg).toBe('#111111');
  });
});
