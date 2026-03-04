import * as esbuild from 'esbuild';
import { cpSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const isWatch = process.argv.includes('--watch');
const repoRoot = resolve(__dirname, '..', '..');

// Copy resources to dist/resources/
const distResources = resolve(__dirname, 'dist', 'resources');
mkdirSync(distResources, { recursive: true });

// Copy mermaid IIFE bundle
const require = createRequire(import.meta.url);
const mermaidPath = resolve(dirname(require.resolve('mermaid')), 'mermaid.min.js');
cpSync(mermaidPath, resolve(distResources, 'mermaid.min.js'));

// Copy shared resources from repo root
cpSync(resolve(repoRoot, 'resources', 'mermaid-render.html'), resolve(distResources, 'mermaid-render.html'));
cpSync(resolve(repoRoot, 'themes', 'pdf-theme.css'), resolve(distResources, 'pdf-theme.css'));

const buildOptions = {
  entryPoints: ['src/extension.ts'],
  bundle: true,
  outfile: 'dist/extension.js',
  external: ['vscode'],
  format: 'cjs',
  platform: 'node',
  target: 'node18',
  sourcemap: true,
  minify: !isWatch,
};

if (isWatch) {
  const ctx = await esbuild.context(buildOptions);
  await ctx.watch();
  console.log('Watching for changes...');
} else {
  await esbuild.build(buildOptions);
  console.log('Build complete.');
}
