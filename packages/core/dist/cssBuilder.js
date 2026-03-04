"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildBrandCSS = buildBrandCSS;
/**
 * Generate CSS custom properties from brand colors, plus font import and body rule.
 */
function buildBrandCSS(brand) {
    let css = ':root {\n';
    for (const [key, val] of Object.entries(brand.colors)) {
        const kebab = key.replace(/([A-Z])/g, '-$1').toLowerCase();
        css += `  --brand-${kebab}: ${val};\n`;
    }
    css += '}\n';
    if (brand.font.url) {
        css = `@import url('${brand.font.url}');\n\n` + css;
    }
    const fontName = brand.font.family.split(',')[0].replace(/'/g, '').trim();
    css += `\nbody { font-family: '${fontName}', ${brand.font.family}; }\n`;
    css += `img[src$=".svg"] { display: block; margin: 20px auto; max-width: 100%; }\n`;
    return css;
}
//# sourceMappingURL=cssBuilder.js.map