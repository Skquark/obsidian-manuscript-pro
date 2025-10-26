import type { App } from 'obsidian';
import * as path from 'path';
import * as fs from 'fs';

export async function exportFountainPdf(app: App): Promise<string | null> {
  try {
    const PDFDocument = require('pdfkit');
    const { shell } = require('electron');
    const view = app.workspace.getActiveViewOfType((require('obsidian') as any).MarkdownView);
    const editor = (view as any)?.editor;
    if (!editor) return null;
    const text = editor.getValue();
    const os = require('os');
    const outPath = path.join(os.tmpdir(), `fountain-export-${Date.now()}.pdf`);
    const doc = new PDFDocument({ size: 'LETTER', margins: { top: 72, bottom: 72, left: 72, right: 72 } });
    const stream = fs.createWriteStream(outPath);
    doc.pipe(stream);
    doc.font('Courier').fontSize(12);
    const lines = text.split(/\r?\n/);
    for (const ln of lines) {
      doc.text(ln || ' ', { lineGap: 0 });
    }
    doc.end();
    await new Promise<void>((resolve) => stream.on('finish', () => resolve()));
    try { await shell.openPath(outPath); } catch {}
    return outPath;
  } catch (e) {
    console.error('Fountain PDF export failed', e);
    return null;
  }
}

