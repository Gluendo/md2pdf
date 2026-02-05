#!/usr/bin/env bash
#
# md2pdf - Markdown to PDF Generator
#
# A portable script to generate PDFs from Markdown with Mermaid diagram support.
# Automatically uses Docker if available, otherwise falls back to local Node.js.
#
# Customize branding by editing brand.json in the tools directory.
#
# Usage:
#   ./md2pdf.sh <file.md>           Generate PDF for a single file
#   ./md2pdf.sh <directory>         Generate PDFs for all .md files in directory
#   ./md2pdf.sh --help              Show help
#
# Output:
#   PDFs are saved to output/pdf/ with timestamp suffix
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
LOCAL_IMAGE="md2pdf-gen"
REGISTRY_IMAGE="ghcr.io/gluendo/md2pdf:latest"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

show_help() {
    cat << 'EOF'
╔══════════════════════════════════════════════════════════════════════════════╗
║                       md2pdf - PDF Generator                                 ║
╚══════════════════════════════════════════════════════════════════════════════╝

USAGE:
    ./md2pdf.sh <file.md>       Generate PDF for a single Markdown file
    ./md2pdf.sh <directory>     Generate PDFs for all .md files in directory
    ./md2pdf.sh --docker        Force Docker mode (builds local image if needed)
    ./md2pdf.sh --pull          Use pre-built image from GitHub registry
    ./md2pdf.sh --local         Force local Node.js mode
    ./md2pdf.sh --help          Show this help

EXAMPLES:
    ./md2pdf.sh docs/my-document.md
    ./md2pdf.sh docs/architecture/
    ./md2pdf.sh --pull docs/specs/

OUTPUT:
    PDFs are saved to: output/pdf/
    Filename format: <name>_YYYYMMDD-HHmm.pdf

FEATURES:
    ✓ Converts Mermaid diagrams to SVG
    ✓ Customizable branding via brand.json
    ✓ Professional A4 layout with header/footer
    ✓ Syntax highlighting for code blocks

CUSTOMIZATION:
    Edit brand.json to set:
    - Company name and header text
    - Brand colors (primary, accent, secondary)
    - Footer text
    - Font family

REQUIREMENTS (auto-detected):
    Option A: Docker (recommended - no other dependencies needed)
    Option B: Node.js 18+ with npm

EOF
}

# Check if Docker is available and running
has_docker() {
    command -v docker &> /dev/null && docker info &> /dev/null
}

# Check if local Node.js setup is ready
has_local_setup() {
    [ -f "$SCRIPT_DIR/node_modules/.package-lock.json" ] || [ -d "$SCRIPT_DIR/node_modules/md-to-pdf" ]
}

# Build Docker image locally
build_docker_image() {
    echo -e "${CYAN}Building Docker image (first run only)...${NC}"
    docker build -t "$LOCAL_IMAGE" -f "$SCRIPT_DIR/docker/Dockerfile" "$SCRIPT_DIR"
}

# Pull image from GitHub registry
pull_docker_image() {
    echo -e "${CYAN}Pulling Docker image from registry...${NC}"
    docker pull "$REGISTRY_IMAGE"
}

# Run with Docker
run_docker() {
    local target="$1"
    local image="$2"

    # Ensure output directory exists
    mkdir -p "$PROJECT_ROOT/output/pdf"

    echo -e "${CYAN}Running PDF generator (Docker)...${NC}"
    echo ""

    docker run --rm \
        -v "$PROJECT_ROOT:/docs:ro" \
        -v "$PROJECT_ROOT/output/pdf:/output" \
        -v "$SCRIPT_DIR/themes:/app/themes:ro" \
        -v "$SCRIPT_DIR/brand.json:/app/brand.json:ro" \
        -e OUTPUT_DIR=/output \
        -w /docs \
        "$image" \
        "$target"
}

# Run with local Node.js
run_local() {
    local target="$1"

    # Install dependencies if needed
    if ! has_local_setup; then
        echo -e "${YELLOW}Installing dependencies (first run only)...${NC}"
        cd "$SCRIPT_DIR" && npm install
    fi

    echo -e "${CYAN}Running PDF generator (local Node.js)...${NC}"
    echo ""

    cd "$SCRIPT_DIR"
    node generate-pdfs.js "$target"
}

# Main
main() {
    local force_mode=""
    local target=""

    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --help|-h)
                show_help
                exit 0
                ;;
            --docker)
                force_mode="docker"
                shift
                ;;
            --pull)
                force_mode="pull"
                shift
                ;;
            --local)
                force_mode="local"
                shift
                ;;
            *)
                target="$1"
                shift
                ;;
        esac
    done

    # Validate target
    if [ -z "$target" ]; then
        show_help
        exit 1
    fi

    # Resolve relative paths from project root
    if [[ ! "$target" = /* ]]; then
        # If run from project root, use as-is; otherwise prepend ../
        if [ "$PWD" = "$PROJECT_ROOT" ]; then
            target="$target"
        else
            target="$PROJECT_ROOT/$target"
        fi
    fi

    # Check target exists
    if [ ! -e "$target" ]; then
        echo -e "${RED}Error: Target not found: $target${NC}"
        exit 1
    fi

    # Choose execution mode
    if [ "$force_mode" = "pull" ]; then
        if ! has_docker; then
            echo -e "${RED}Error: Docker is not available${NC}"
            exit 1
        fi
        # Pull if not present
        if ! docker image inspect "$REGISTRY_IMAGE" &> /dev/null; then
            pull_docker_image
        fi
        run_docker "$target" "$REGISTRY_IMAGE"
    elif [ "$force_mode" = "docker" ]; then
        if ! has_docker; then
            echo -e "${RED}Error: Docker is not available${NC}"
            exit 1
        fi
        # Build if not present
        if ! docker image inspect "$LOCAL_IMAGE" &> /dev/null; then
            build_docker_image
        fi
        run_docker "$target" "$LOCAL_IMAGE"
    elif [ "$force_mode" = "local" ]; then
        if ! command -v node &> /dev/null; then
            echo -e "${RED}Error: Node.js is not installed${NC}"
            exit 1
        fi
        run_local "$target"
    else
        # Auto-detect best option
        if has_docker; then
            # Prefer registry image if available, else build locally
            if docker image inspect "$REGISTRY_IMAGE" &> /dev/null; then
                run_docker "$target" "$REGISTRY_IMAGE"
            elif docker image inspect "$LOCAL_IMAGE" &> /dev/null; then
                run_docker "$target" "$LOCAL_IMAGE"
            else
                # Try to pull, fallback to local build
                if pull_docker_image 2>/dev/null; then
                    run_docker "$target" "$REGISTRY_IMAGE"
                else
                    build_docker_image
                    run_docker "$target" "$LOCAL_IMAGE"
                fi
            fi
        elif command -v node &> /dev/null; then
            run_local "$target"
        else
            echo -e "${RED}Error: Neither Docker nor Node.js found${NC}"
            echo ""
            echo "Please install one of:"
            echo "  - Docker: https://docs.docker.com/get-docker/"
            echo "  - Node.js 18+: https://nodejs.org/"
            exit 1
        fi
    fi
}

main "$@"
