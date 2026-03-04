import * as path from 'path';
import * as vscode from 'vscode';
import { convertMarkdownToPdf } from '@md2pdf/core';
import { detectChrome } from '../chrome/detect';
import { loadBrandConfig } from '../brandConfig';

function getTimestamp(): string {
  const now = new Date();
  return now
    .toISOString()
    .slice(0, 16)
    .replace(/[-:T]/g, '')
    .replace(/(\d{8})(\d{4})/, '$1-$2');
}

export async function convertToPdfCommand(
  context: vscode.ExtensionContext,
  uri?: vscode.Uri
): Promise<void> {
  // 1. Determine target file
  let mdFilePath: string;

  if (uri) {
    mdFilePath = uri.fsPath;
  } else {
    const editor = vscode.window.activeTextEditor;
    if (!editor || editor.document.languageId !== 'markdown') {
      vscode.window.showErrorMessage('MD2PDF: Open a Markdown file first.');
      return;
    }
    if (editor.document.isUntitled) {
      vscode.window.showErrorMessage('MD2PDF: Please save the file before converting.');
      return;
    }
    await editor.document.save();
    mdFilePath = editor.document.uri.fsPath;
  }

  if (!mdFilePath.endsWith('.md')) {
    vscode.window.showErrorMessage('MD2PDF: Target must be a .md file.');
    return;
  }

  // 2. Detect Chrome
  let chromePath: string;
  try {
    chromePath = detectChrome();
  } catch {
    const action = await vscode.window.showErrorMessage(
      'MD2PDF: Chrome/Chromium not found on your system.',
      'Set Chrome Path',
      'Install Chrome'
    );
    if (action === 'Set Chrome Path') {
      await vscode.commands.executeCommand(
        'workbench.action.openSettings',
        'md2pdf.chromePath'
      );
    } else if (action === 'Install Chrome') {
      await vscode.env.openExternal(
        vscode.Uri.parse('https://www.google.com/chrome/')
      );
    }
    return;
  }

  // 3. Load brand config
  const brand = loadBrandConfig();

  // 4. Determine output path
  const config = vscode.workspace.getConfiguration('md2pdf');
  const outputDir = config.get<string>('outputDirectory', '') || path.dirname(mdFilePath);
  const useTimestamp = config.get<boolean>('timestampSuffix', true);

  const baseName = path.basename(mdFilePath, '.md');
  const suffix = useTimestamp ? `_${getTimestamp()}` : '';
  const outputPath = path.join(outputDir, `${baseName}${suffix}.pdf`);

  // 5. Resolve resource paths
  const resourcesPath = path.join(context.extensionPath, 'dist', 'resources');
  const themeCssPath = path.join(resourcesPath, 'pdf-theme.css');

  // 6. Run conversion with progress
  try {
    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: 'MD2PDF',
        cancellable: true,
      },
      async (progress, token) => {
        const result = await convertMarkdownToPdf({
          mdFilePath,
          outputPath,
          brand,
          chromePath,
          resourcesPath,
          themeCssPath,
          onProgress: (message, percent) => {
            progress.report({ message, increment: percent });
          },
          cancelled: () => token.isCancellationRequested,
        });

        if (result.mermaidDiagramsFailed > 0) {
          vscode.window.showWarningMessage(
            `MD2PDF: ${result.mermaidDiagramsFailed} Mermaid diagram(s) failed to render.`
          );
        }
      }
    );

    // 7. Success notification
    const choice = await vscode.window.showInformationMessage(
      `PDF saved: ${path.basename(outputPath)}`,
      'Open PDF',
      'Open Folder'
    );
    if (choice === 'Open PDF') {
      await vscode.env.openExternal(vscode.Uri.file(outputPath));
    } else if (choice === 'Open Folder') {
      await vscode.commands.executeCommand(
        'revealFileInOS',
        vscode.Uri.file(outputPath)
      );
    }
  } catch (e) {
    if (e instanceof Error && e.message === 'Cancelled') {
      vscode.window.showInformationMessage('MD2PDF: Conversion cancelled.');
    } else {
      const msg = e instanceof Error ? e.message : String(e);
      vscode.window.showErrorMessage(`MD2PDF: Conversion failed — ${msg}`);
    }
  }
}
