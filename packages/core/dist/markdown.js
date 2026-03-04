"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.markdownToHtml = markdownToHtml;
const marked_1 = require("marked");
const highlight_js_1 = __importDefault(require("highlight.js"));
const marked_highlight_1 = require("marked-highlight");
marked_1.marked.use((0, marked_highlight_1.markedHighlight)({
    highlight(code, lang) {
        if (lang && highlight_js_1.default.getLanguage(lang)) {
            return highlight_js_1.default.highlight(code, { language: lang }).value;
        }
        return highlight_js_1.default.highlightAuto(code).value;
    },
}));
/**
 * Convert markdown content to a full HTML document string.
 */
function markdownToHtml(md, title) {
    const body = marked_1.marked.parse(md);
    return `<!DOCTYPE html>
<html>
  <head>
    <title>${escapeHtml(title)}</title>
    <meta charset="utf-8">
  </head>
  <body>
    ${body}
  </body>
</html>`;
}
function escapeHtml(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
//# sourceMappingURL=markdown.js.map