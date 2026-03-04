# md2pdf

Convert Markdown to PDF with Mermaid diagram support, customizable branding, and syntax highlighting.

## Features

- Mermaid diagrams rendered to SVG
- Customizable branding (colors, fonts, header/footer)
- Professional A4 layout with page numbers
- Syntax highlighting for code blocks
- PDF outline/bookmarks from heading hierarchy

## Usage

### Docker

```bash
# Convert a file
docker run --rm -v $(pwd):/docs -v $(pwd)/output:/output ghcr.io/gluendo/md2pdf README.md

# Convert all .md files in a directory
docker run --rm -v $(pwd):/docs -v $(pwd)/output:/output ghcr.io/gluendo/md2pdf docs/
```

Output: `output/<filename>_YYYYMMDD-HHmm.pdf`

### VSCode Extension

Install from [Open VSX](https://open-vsx.org/extension/gluendo/md2pdf):

- **VSCodium**: Search "MD2PDF" in the extensions panel, or run `codium --install-extension gluendo.md2pdf`
- **VSCode**: Download the `.vsix` from [Open VSX](https://open-vsx.org/extension/gluendo/md2pdf) and install with `code --install-extension md2pdf-*.vsix`

The extension adds a **Convert Markdown to PDF** command accessible from:

- Command palette (`Cmd+Shift+P` / `Ctrl+Shift+P`)
- Editor title bar (when viewing a `.md` file)
- Right-click context menu (editor or explorer)

Requires Chrome or Chromium installed locally (auto-detected, or set `md2pdf.chromePath` in settings).

#### Extension Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `md2pdf.chromePath` | *(auto-detect)* | Path to Chrome/Chromium executable |
| `md2pdf.outputDirectory` | *(same as source)* | Directory for output PDFs |
| `md2pdf.timestampSuffix` | `true` | Append timestamp to filename |
| `md2pdf.brand.name` | `Document` | Brand name for metadata |
| `md2pdf.brand.header` | *(brand name)* | PDF header text (right-aligned) |
| `md2pdf.brand.footer` | | PDF footer text (left side) |
| `md2pdf.brand.colors.primary` | `#1a365d` | Headings, table headers |
| `md2pdf.brand.colors.accent` | `#3182ce` | Links, blockquote borders |
| `md2pdf.brand.colors.secondary` | `#2c7a7b` | H3 headings |
| `md2pdf.brand.font.family` | `system-ui, ...` | Body font family |
| `md2pdf.brand.font.url` | `null` | Web font URL (e.g. Google Fonts) |

The extension also reads a `brand.json` file from the workspace root if present, with VSCode settings taking precedence.

## Custom Branding

### Docker

Create a `brand.json` file and mount it:

```bash
docker run --rm \
  -v $(pwd):/docs \
  -v $(pwd)/output:/output \
  -v $(pwd)/brand.json:/app/brand.json \
  ghcr.io/gluendo/md2pdf doc.md
```

### brand.json format

```json
{
  "name": "My Company",
  "header": "My Company",
  "footer": "Confidential",
  "colors": {
    "primary": "#1a365d",
    "accent": "#3182ce",
    "secondary": "#2c7a7b"
  },
  "font": {
    "family": "Helvetica, Arial, sans-serif"
  }
}
```

| Field | Description |
|-------|-------------|
| `name` | Document title |
| `header` | Text in PDF header (top-right) |
| `footer` | Text in PDF footer (bottom-left) |
| `colors.primary` | Headings, table headers |
| `colors.accent` | Links, highlights |
| `colors.secondary` | H3 headings |
| `font.family` | Font family |
| `font.url` | Web font import URL (optional) |

## Shell Alias

Add to your `~/.bashrc` or `~/.zshrc`:

```bash
md2pdf() {
  docker run --rm -v "$(pwd):/docs" -v "$(pwd)/output:/output" ghcr.io/gluendo/md2pdf "$@"
}
```

Then use: `md2pdf README.md`

## Architecture

The project is a monorepo with three packages:

```
packages/
  core/     Shared conversion library (markdown, mermaid, PDF generation)
  cli/      CLI tool used by the Docker image
  vscode/   VSCode extension
```

Both the CLI and the VSCode extension use `@md2pdf/core` for all conversion logic.

## Development

```bash
# Install dependencies
npm install

# Build all packages
npm run build -w packages/core
npm run build -w packages/cli
npm run build -w packages/vscode

# Run tests
npm test -w packages/core
```

## License

MIT
