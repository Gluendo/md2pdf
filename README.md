# md2pdf - Markdown to PDF Generator

Generate professional PDFs from Markdown with Mermaid diagram support and customizable branding.

## Quick Start

```bash
# Single file
./tools/md2pdf.sh docs/my-document.md

# All files in a directory
./tools/md2pdf.sh docs/architecture/
```

Output: `output/pdf/<filename>_YYYYMMDD-HHmm.pdf`

## Features

- **Mermaid diagrams** - Automatically rendered to high-quality SVG
- **Customizable branding** - Colors, fonts, header/footer via `brand.json`
- **Professional layout** - A4 format with page numbers
- **Code highlighting** - Syntax highlighting for code blocks
- **Portable** - Works with Docker or local Node.js

## Requirements (auto-detected)

| Option | Pros | Install |
|--------|------|---------|
| **Docker** (recommended) | No dependencies, consistent | [Docker Desktop](https://docs.docker.com/get-docker/) |
| **Node.js** | Faster after setup | [Node.js 18+](https://nodejs.org/) |

The `md2pdf.sh` script automatically uses Docker if available, otherwise falls back to Node.js.

## Customization

### Brand Configuration

Edit `tools/brand.json` to customize your output:

```json
{
  "name": "Your Company",
  "header": "Your Company Name",
  "footer": "Confidential",
  "colors": {
    "primary": "#003C5A",
    "accent": "#00B9FF",
    "secondary": "#009581",
    "warning": "#C30045",
    "lightGrey": "#EDEFED",
    "borderGrey": "#E7E6E6"
  },
  "font": {
    "family": "Montserrat",
    "url": "https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap"
  }
}
```

| Field | Description |
|-------|-------------|
| `name` | Company name (shown in banner) |
| `header` | Text in PDF header (top-right of each page) |
| `footer` | Text in PDF footer (bottom-left, e.g., "Confidential") |
| `colors.primary` | Headings, table headers, strong text |
| `colors.accent` | Links, borders, horizontal rules |
| `colors.secondary` | H3 headings, success states |
| `colors.warning` | Error/warning states |
| `font.family` | Primary font family |
| `font.url` | Google Fonts URL (optional) |

### Mermaid Diagrams

Mermaid diagram colors are **automatically generated** from your `brand.json` colors:

| brand.json | Diagram usage |
|------------|---------------|
| `accent` | Primary shapes, nodes, task backgrounds |
| `primary` | Text, borders, lines, actors |
| `secondary` | Tertiary elements, notes, completed tasks |
| `lightGrey` | Backgrounds, clusters |
| `warning` | Critical paths, today line |

No manual configuration needed - just update `brand.json` and diagrams will match.

### After Customization

If using Docker, rebuild the image to apply changes:

```bash
docker rmi md2pdf-gen
./tools/md2pdf.sh docs/my-document.md  # Rebuilds automatically
```

## Usage

### Portable Script (recommended)

```bash
./tools/md2pdf.sh <file.md>      # Single file
./tools/md2pdf.sh <directory>    # All .md files
./tools/md2pdf.sh --help         # Show help

# Force a specific mode
./tools/md2pdf.sh --docker docs/my-doc.md
./tools/md2pdf.sh --local docs/my-doc.md
```

### Using npm directly

```bash
cd tools && npm install                    # First time
node generate-pdfs.js ../docs/SPECS.md     # Single file
node generate-pdfs.js ../docs/             # Directory
```

## For Other Projects (Portable Setup)

To use this in another project, copy these files:

```
tools/
├── md2pdf.sh              # Main script
├── generate-pdfs.js       # PDF generator
├── brand.json             # Brand configuration
├── package.json           # Dependencies
├── docker/
│   └── Dockerfile         # Docker build
└── themes/
    └── pdf-theme.css      # PDF styling
```

Then:

```bash
chmod +x tools/md2pdf.sh

# Customize brand.json with your company details
vim tools/brand.json

# Generate PDFs
./tools/md2pdf.sh path/to/your-document.md
```

First run builds the Docker image or installs npm packages.

## Output Format

Generated PDFs include:
- **Header**: Company name (from brand.json)
- **Footer**: Custom text + page numbers
- **Fonts**: Configurable via brand.json

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Docker daemon not running | Start Docker Desktop |
| Chromium not found (local) | `cd tools && npm rebuild puppeteer` |
| Mermaid not rendering | `cd tools && npm install @mermaid-js/mermaid-cli` |
| Permission denied | `chmod +x tools/md2pdf.sh` |
| Brand changes not applying (Docker) | `docker rmi md2pdf-gen` then re-run |
