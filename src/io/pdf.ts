import type { App } from 'obsidian';
import * as path from 'path';
import * as fs from 'fs';
import type { FountainEditorSettings, PdfOptions } from '../settings.js';
import { classifyLine } from '../editor/classify.js';
import { PageWriter } from './layout.js';

type Element = 'Scene'|'Action'|'Character'|'Parenthetical'|'Dialogue'|'Transition'|'Lyrics'|'Unknown';

function parseTitlePage(text: string): { consumedLines: number; meta: Record<string,string> } {
  const meta: Record<string,string> = {};
  const lines = text.split(/\r?\n/);
  let i = 0;
  while (i < lines.length) {
    const ln = lines[i];
    if (!ln.trim()) { i++; continue; }
    const m = ln.match(/^([A-Za-z ]+):\s*(.*)$/);
    if (!m) break;
    const key = m[1].trim();
    const val = m[2].trim();
    meta[key] = val;
    i++;
  }
  if (!meta['Title']) return { consumedLines: 0, meta: {} };
  return { consumedLines: i, meta };
}

function inToPt(inches: number): number { return Math.max(0, inches) * 72; }

export async function exportFountainPdf(app: App, settings?: FountainEditorSettings): Promise<string | null> {
  try {
    const PDFDocument = require('pdfkit');
    const { shell } = require('electron');
    const view = app.workspace.getActiveViewOfType((require('obsidian') as any).MarkdownView);
    const editor = (view as any)?.editor;
    if (!editor) return null;
    const text = editor.getValue();
    const os = require('os');
    const outPath = path.join(os.tmpdir(), `fountain-export-${Date.now()}.pdf`);
    const pdf: PdfOptions | undefined = settings?.pdf;
    const pageSize = pdf?.pageSize || 'LETTER';
    const doc = new PDFDocument({
      size: pageSize,
      margins: {
        top: inToPt(pdf?.marginTopIn ?? 1),
        bottom: inToPt(pdf?.marginBottomIn ?? 1),
        left: inToPt(pdf?.marginLeftIn ?? 1),
        right: inToPt(pdf?.marginRightIn ?? 1),
      },
    });
    const stream = fs.createWriteStream(outPath);
    doc.pipe(stream);
    if (pdf?.fontPath) { try { doc.font(pdf.fontPath); } catch { doc.font('Courier'); } } else { doc.font('Courier'); }
    doc.fontSize(pdf?.fontSize ?? 12);
    if ((pdf?.lineGap ?? 0) > 0) (doc as any).lineGap = pdf?.lineGap;

    const writer = new PageWriter(doc, {
      indentParentheticalPt: inToPt(pdf?.indentParentheticalIn ?? 0.5),
      indentDialoguePt: inToPt(pdf?.indentDialogueIn ?? 1.5),
      dualGutterPt: inToPt(pdf?.dualGutterIn ?? 0.33),
    });

    // Geometry helpers
    const page: any = (doc as any).page;
    const margins = page.margins;
    const printableWidth = page.width - margins.left - margins.right;
    const pageBottomY = page.height - margins.bottom;

    const drawMoreFooter = () => {
      if (settings?.pdf?.showMore) {
        const more = '(MORE)';
        const y = pageBottomY - doc.currentLineHeight();
        doc.text(more, margins.left, y, { width: printableWidth, align: 'right' });
      }
    };

    // Title page
    const { consumedLines, meta } = parseTitlePage(text);
    if (consumedLines > 0) {
      doc.moveDown(6);
      if (meta['Title']) { doc.text(meta['Title'].toUpperCase(), undefined as any, undefined as any, { align: 'center' }); doc.moveDown(1); }
      if (meta['Credit']) { doc.text(meta['Credit'], undefined as any, undefined as any, { align: 'center' }); doc.moveDown(1); }
      if (meta['Author']) { doc.text(meta['Author'], undefined as any, undefined as any, { align: 'center' }); doc.moveDown(2); }
      if (meta['Draft date']) { doc.text(meta['Draft date'], undefined as any, undefined as any, { align: 'center' }); doc.moveDown(1); }
      if (meta['Contact']) { doc.text(meta['Contact'], undefined as any, undefined as any, { align: 'center' }); doc.moveDown(1); }
      doc.addPage();
    }

    const lines = text.split(/\r?\n/).slice(consumedLines);

    const collectBlock = (startIndex: number): { lines: string[]; next: number } => {
      const acc: string[] = [];
      let i = startIndex;
      while (i < lines.length) {
        const t = lines[i] ?? '';
        const e = classifyLine(t) as Element;
        if (!t.trim()) break;
        if (e === 'Dialogue' || e === 'Parenthetical' || (e === 'Action' && t.startsWith(' '))) {
          acc.push(t);
          i++;
          continue;
        }
        break;
      }
      return { lines: acc, next: i };
    };

    let sceneNo = 0;
    for (let idx = 0; idx < lines.length; idx++) {
      const raw = lines[idx] ?? '';
      const el = classifyLine(raw) as Element;
      if (el === 'Scene') {
        sceneNo += 1;
        if (settings?.pdf?.sceneNumbers) {
          if ((settings.pdf.sceneNumberPosition || 'inline') === 'inline') writer.sceneHeading(raw, sceneNo);
          else {
            writer.sceneHeading(raw, undefined);
            const y = (doc as any).y - doc.currentLineHeight();
            let num = String(sceneNo);
            if ((settings?.pdf?.sceneNumberStyle || 'plain') === 'parentheses') num = `(${num})`;
            doc.text(num, margins.left - 30, y, { width: 24, align: 'left' });
            doc.text(num, page.width - margins.right + 6, y, { width: 24, align: 'left' });
          }
        } else {
          writer.sceneHeading(raw, undefined);
        }
        continue;
      }
      if (el === 'Character') {
        const isDual = /\^\s*$/.test(raw) || /\^\s*$/.test((lines[idx+2] || ''));
        const name = raw.replace(/^@/, '').replace(/\^\s*$/, '');
        if (isDual) {
          // Pre-measure both columns and apply MORE/CONT’D if needed
          const leftBlock = collectBlock(idx + 1);
          let j = leftBlock.next; while (j < lines.length && !lines[j].trim()) j++;
          let rightName = '';
          let rightBlock: {lines:string[]; next:number} = { lines: [], next: j };
          if (j < lines.length && /^@/.test(lines[j] || '')) {
            rightName = (lines[j] || '').replace(/^@/, '').replace(/\^\s*$/, '');
            rightBlock = collectBlock(j + 1);
          }
          const colWidth = (printableWidth - inToPt(pdf?.dualGutterIn ?? 0.33)) / 2;
          const heightFor = (title: string, arr: string[]) => {
            const block = [title.toUpperCase(), ...arr].join('\n');
            return doc.heightOfString(block, { width: colWidth });
          };
          const needed = Math.max(heightFor(name, leftBlock.lines), heightFor(rightName || name, rightBlock.lines)) + 6;
          if (((doc as any).y + needed) > pageBottomY) {
            if (settings?.pdf?.showMore) drawMoreFooter();
            doc.addPage();
            const leftName = settings?.pdf?.showContd ? `${name} (CONT’D)` : name;
            const rightNameContd = rightName ? (settings?.pdf?.showContd ? `${rightName} (CONT’D)` : rightName) : '';
            new PageWriter(doc).dualDialogue(leftName, leftBlock.lines, rightNameContd, rightBlock.lines);
          } else {
            new PageWriter(doc).dualDialogue(name, leftBlock.lines, rightName || '', rightBlock.lines);
          }
          idx = Math.max(leftBlock.next, rightBlock.next) - 1;
          continue;
        }

        // Dialogue block (single)
        const block = collectBlock(idx + 1);
        const minLines = settings?.pdf?.minBlockLines ?? 2;
        const measureLine = (d: string) => {
          const kind = classifyLine(d) as Element;
          const indentPt = (kind === 'Parenthetical') ? inToPt(pdf?.indentParentheticalIn ?? 0.5) : inToPt(pdf?.indentDialogueIn ?? 1.5);
          const width = printableWidth - indentPt;
          return doc.heightOfString((d || ' ').trim() || ' ', { width });
        };
        const nameHeight = doc.heightOfString(name.toUpperCase(), { width: printableWidth, align: 'center' });
        let firstNHeight = 0;
        for (let j2 = 0; j2 < Math.min(minLines, block.lines.length); j2++) firstNHeight += measureLine(block.lines[j2]);
        if (((doc as any).y + doc.currentLineHeight() + nameHeight + firstNHeight) > pageBottomY) {
          doc.addPage();
        }
        writer.character(name);
        let linesWritten = 0;
        for (let j2 = 0; j2 < block.lines.length; j2++) {
          const d = block.lines[j2];
          const h = measureLine(d);
          if (((doc as any).y + h) > pageBottomY) {
            if (linesWritten < minLines) {
              doc.addPage();
              const contdName = settings?.pdf?.showContd ? `${name} (CONT’D)` : name;
              writer.character(contdName);
            } else {
              if (settings?.pdf?.showMore) drawMoreFooter();
              doc.addPage();
              const contdName = settings?.pdf?.showContd ? `${name} (CONT’D)` : name;
              writer.character(contdName);
            }
          }
          const kind = classifyLine(d) as Element;
          if (kind === 'Parenthetical') writer.parenthetical(d);
          else writer.dialogue(d);
          linesWritten++;
        }
        idx = block.next - 1;
        continue;
      }
      if (el === 'Parenthetical') { writer.parenthetical(raw); continue; }
      if (el === 'Dialogue') { writer.dialogue(raw); continue; }
      if (el === 'Transition') { writer.transition(raw); continue; }
      writer.action(raw || ' ');
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

