import type { App } from 'obsidian';
import * as path from 'path';
import * as fs from 'fs';
import type { FountainEditorSettings, PdfOptions } from '../settings.js';
import { classifyLine } from '../editor/classify.js';
import { PageWriter } from './layout.js';

type Element = 'Scene'|'Action'|'Character'|'Parenthetical'|'Dialogue'|'Transition'|'Lyrics'|'Unknown';

function inToPt(inches: number): number { return Math.max(0, inches) * 72; }

function parseTitlePage(text: string): { consumedLines: number; meta: Record<string,string> } {
  const meta: Record<string,string> = {};
  const lines = text.split(/\r?\n/);
  let i = 0;
  while (i < lines.length) {
    const ln = lines[i];
    if (!ln.trim()) { i++; continue; }
    const m = ln.match(/^([A-Za-z ]+):\s*(.*)$/);
    if (!m) break;
    const key = m[1].trim(); meta[key] = (m[2] || '').trim();
    i++;
  }
  if (!meta['Title']) return { consumedLines: 0, meta: {} };
  return { consumedLines: i, meta };
}

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
    const doc = new PDFDocument({
      size: pdf?.pageSize || 'LETTER',
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

    const page: any = (doc as any).page;
    const margins = page.margins;
    const printableWidth = page.width - margins.left - margins.right;
    const pageBottomY = page.height - margins.bottom;
    const colWidth = (printableWidth - inToPt(pdf?.dualGutterIn ?? 0.33)) / 2;
    const leftColX = margins.left + inToPt(pdf?.indentDialogueIn ?? 1.5) - 36;
    const rightColX = leftColX + colWidth + inToPt(pdf?.dualGutterIn ?? 0.33);

    const drawMoreFooter = () => {
      if (settings?.pdf?.showMore) {
        const y = pageBottomY - doc.currentLineHeight();
        doc.text('(MORE)', margins.left, y, { width: printableWidth, align: 'right' });
      }
    };
    const drawMoreFooterDual = (hasLeft: boolean, hasRight: boolean) => {
      if (!settings?.pdf?.showMore) return;
      const y = pageBottomY - doc.currentLineHeight();
      if (hasLeft) doc.text('(MORE)', leftColX, y, { width: colWidth, align: 'right' });
      if (hasRight) doc.text('(MORE)', rightColX, y, { width: colWidth, align: 'right' });
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

    const writer = new PageWriter(doc, {
      indentParentheticalPt: inToPt(pdf?.indentParentheticalIn ?? 0.5),
      indentDialoguePt: inToPt(pdf?.indentDialogueIn ?? 1.5),
      dualGutterPt: inToPt(pdf?.dualGutterIn ?? 0.33),
    });

    const lines = text.split(/\r?\n/).slice(consumedLines);
    const minLines = settings?.pdf?.minBlockLines ?? 2;
    const measureLine = (d: string) => {
      const kind = classifyLine(d) as Element;
      const indentPt = (kind === 'Parenthetical') ? inToPt(pdf?.indentParentheticalIn ?? 0.5) : inToPt(pdf?.indentDialogueIn ?? 1.5);
      const width = printableWidth - indentPt;
      return doc.heightOfString((d || ' ').trim() || ' ', { width });
    };

    const collectBlock = (startIndex: number): { lines: string[]; next: number } => {
      const acc: string[] = [];
      let i = startIndex;
      while (i < lines.length) {
        const t = lines[i] ?? '';
        const e = classifyLine(t) as Element;
        if (!t.trim()) break;
        if (e === 'Dialogue' || e === 'Parenthetical' || (e === 'Action' && t.startsWith(' '))) { acc.push(t); i++; continue; }
        break;
      }
      return { lines: acc, next: i };
    };

    const renderDual = (leftName: string, leftLines: string[], rightName: string, rightLines: string[]) => {
      let lIdx = 0, rIdx = 0;
      let leftContd = false, rightContd = false;
      while (lIdx < leftLines.length || rIdx < rightLines.length) {
        const space = pageBottomY - (doc as any).y;
        // estimate name heights
        const nameL = (leftContd && settings?.pdf?.showContd) ? `${leftName} (CONT’D)` : leftName;
        const nameR = (rightContd && settings?.pdf?.showContd) ? (rightName ? `${rightName} (CONT’D)` : '') : rightName;
        const nameLH = doc.heightOfString(nameL.toUpperCase(), { width: colWidth });
        const nameRH = doc.heightOfString((nameR||'').toUpperCase(), { width: colWidth });
        if (space < Math.min(nameLH, nameRH)) { drawMoreFooterDual(lIdx<leftLines.length, rIdx<rightLines.length); doc.addPage(); leftContd = rightContd = true; continue; }
        // Greedy fill while space suffices
        let kL = 0, kR = 0; let hL = nameLH, hR = nameRH;
        while (true) {
          const canL = (lIdx + kL) < leftLines.length;
          const canR = (rIdx + kR) < rightLines.length;
          if (!canL && !canR) break;
          const addLeft = canL && (!canR || hL <= hR);
          if (addLeft) {
            const h = doc.heightOfString(leftLines[lIdx + kL] || ' ', { width: colWidth });
            if (Math.max(hL + h, hR) + 6 > space) break;
            hL += h; kL++;
          } else {
            const h = doc.heightOfString(rightLines[rIdx + kR] || ' ', { width: colWidth });
            if (Math.max(hR + h, hL) + 6 > space) break;
            hR += h; kR++;
          }
        }
        if (kL === 0 && kR === 0) { drawMoreFooterDual(lIdx<leftLines.length, rIdx<rightLines.length); doc.addPage(); leftContd = rightContd = true; continue; }
        new PageWriter(doc).dualDialogue(nameL, leftLines.slice(lIdx, lIdx + kL), nameR||'', rightLines.slice(rIdx, rIdx + kR));
        lIdx += kL; rIdx += kR;
        if (lIdx < leftLines.length || rIdx < rightLines.length) { drawMoreFooterDual(lIdx<leftLines.length, rIdx<rightLines.length); doc.addPage(); leftContd = rightContd = true; }
      }
    };

    let sceneNo = 0;
    for (let idx = 0; idx < lines.length; idx++) {
      const raw = lines[idx] ?? '';
      const el = classifyLine(raw) as Element;
      if (el === 'Scene') {
        sceneNo += 1;
        if (settings?.pdf?.sceneNumbers) {
          const pos = settings.pdf.sceneNumberPosition || 'inline';
          const style = settings.pdf.sceneNumberStyle || 'plain';
          if (pos === 'inline') writer.sceneHeading(raw, sceneNo);
          else {
            writer.sceneHeading(raw, undefined);
            const y = (doc as any).y - doc.currentLineHeight();
            const num = style === 'parentheses' ? `(${sceneNo})` : String(sceneNo);
            doc.text(num, margins.left - 30, y, { width: 24, align: 'left' });
            doc.text(num, page.width - margins.right + 6, y, { width: 24, align: 'left' });
          }
        } else writer.sceneHeading(raw, undefined);
        continue;
      }
      if (el === 'Character') {
        const isDual = /\^\s*$/.test(raw) || /\^\s*$/.test((lines[idx+2] || ''));
        const name = raw.replace(/^@/, '').replace(/\^\s*$/, '');
        if (isDual) {
          const leftBlock = collectBlock(idx + 1);
          let j = leftBlock.next; while (j < lines.length && !lines[j].trim()) j++;
          let rightName = '';
          let rightBlock: {lines:string[]; next:number} = { lines: [], next: j };
          if (j < lines.length && /^@/.test(lines[j] || '')) { rightName = (lines[j] || '').replace(/^@/, '').replace(/\^\s*$/, ''); rightBlock = collectBlock(j + 1); }
          renderDual(name, leftBlock.lines, rightName, rightBlock.lines);
          idx = Math.max(leftBlock.next, rightBlock.next) - 1;
          continue;
        }
        const block = collectBlock(idx + 1);
        const nameHeight = doc.heightOfString(name.toUpperCase(), { width: printableWidth, align: 'center' });
        let firstNHeight = 0;
        for (let j2 = 0; j2 < Math.min(minLines, block.lines.length); j2++) firstNHeight += measureLine(block.lines[j2]);
        if (((doc as any).y + doc.currentLineHeight() + nameHeight + firstNHeight) > pageBottomY) doc.addPage();
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
              drawMoreFooter();
              doc.addPage();
              const contdName = settings?.pdf?.showContd ? `${name} (CONT’D)` : name;
              writer.character(contdName);
            }
          }
          const kind = classifyLine(d) as Element;
          if (kind === 'Parenthetical') writer.parenthetical(d); else writer.dialogue(d);
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

