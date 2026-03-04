import * as vscode from 'vscode';
import { convertToPdfCommand } from './commands/convertToPdf';

export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand(
    'md2pdf.convertToPdf',
    (uri?: vscode.Uri) => convertToPdfCommand(context, uri)
  );
  context.subscriptions.push(disposable);
}

export function deactivate() {
  // No persistent state to clean up
}
