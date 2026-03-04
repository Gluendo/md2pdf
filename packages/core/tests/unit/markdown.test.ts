import { describe, it, expect } from 'vitest';
import { markdownToHtml } from '../../src/markdown';

describe('markdownToHtml', () => {
  it('wraps output in HTML document structure', () => {
    const html = markdownToHtml('Hello', 'Test');
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<html>');
    expect(html).toContain('<head>');
    expect(html).toContain('<body>');
    expect(html).toContain('</html>');
  });

  it('sets the document title', () => {
    const html = markdownToHtml('Hello', 'My Title');
    expect(html).toContain('<title>My Title</title>');
  });

  it('escapes HTML in title', () => {
    const html = markdownToHtml('Hello', '<script>alert("xss")</script>');
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });

  it('converts heading to <h1>', () => {
    const html = markdownToHtml('# Main Heading', 'Test');
    expect(html).toContain('<h1');
    expect(html).toContain('Main Heading');
  });

  it('converts code block with syntax highlighting', () => {
    const md = '```javascript\nconst x = 1;\n```';
    const html = markdownToHtml(md, 'Test');
    expect(html).toContain('<pre>');
    expect(html).toContain('<code');
    // highlight.js adds span elements with classes
    expect(html).toContain('class="hljs');
  });

  it('converts table markdown to HTML', () => {
    const md = '| A | B |\n|---|---|\n| 1 | 2 |';
    const html = markdownToHtml(md, 'Test');
    expect(html).toContain('<table>');
    expect(html).toContain('<th>');
    expect(html).toContain('<td>');
  });

  it('converts unordered list', () => {
    const md = '- One\n- Two\n- Three';
    const html = markdownToHtml(md, 'Test');
    expect(html).toContain('<ul>');
    expect(html).toContain('<li>');
  });

  it('converts ordered list', () => {
    const md = '1. First\n2. Second';
    const html = markdownToHtml(md, 'Test');
    expect(html).toContain('<ol>');
    expect(html).toContain('<li>');
  });

  it('converts blockquote', () => {
    const md = '> This is a quote';
    const html = markdownToHtml(md, 'Test');
    expect(html).toContain('<blockquote>');
  });

  it('converts inline code', () => {
    const md = 'Use `console.log()` to debug';
    const html = markdownToHtml(md, 'Test');
    expect(html).toContain('<code>console.log()</code>');
  });

  it('converts bold and italic', () => {
    const md = '**bold** and *italic*';
    const html = markdownToHtml(md, 'Test');
    expect(html).toContain('<strong>bold</strong>');
    expect(html).toContain('<em>italic</em>');
  });
});
