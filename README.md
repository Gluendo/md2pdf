# md2pdf

Convert Markdown to PDF with Mermaid diagram support.

## Usage

```bash
# Convert a file
docker run --rm -v $(pwd):/docs -v $(pwd)/output:/output ghcr.io/gluendo/md2pdf README.md

# Convert all .md files in a directory
docker run --rm -v $(pwd):/docs -v $(pwd)/output:/output ghcr.io/gluendo/md2pdf docs/
```

Output: `output/<filename>_YYYYMMDD-HHmm.pdf`

## Features

- Mermaid diagrams rendered to SVG
- Customizable branding (colors, fonts, header/footer)
- Professional A4 layout with page numbers
- Syntax highlighting for code blocks

## Custom Branding

Create a `brand.json` file and mount it:

```bash
docker run --rm \
  -v $(pwd):/docs \
  -v $(pwd)/output:/output \
  -v $(pwd)/brand.json:/app/brand.json \
  ghcr.io/gluendo/md2pdf doc.md
```

Example `brand.json`:

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
| `font.family` | Font family |

## Shell Alias

Add to your `~/.bashrc` or `~/.zshrc`:

```bash
md2pdf() {
  docker run --rm -v "$(pwd):/docs" -v "$(pwd)/output:/output" ghcr.io/gluendo/md2pdf "$@"
}
```

Then use: `md2pdf README.md`

## License

MIT
