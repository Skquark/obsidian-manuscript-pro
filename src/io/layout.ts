import type PDFDocument from 'pdfkit';

export type Align = 'left'|'center'|'right';

export class PageWriter {
  private pageWidth: number;
  private pageHeight: number;
  private left: number;
  private right: number;
  private top: number;
  private bottom: number;
  private printableWidth: number;

  private indentAction = 0;
  private indentSceneHeading = 0;
  private indentParenthetical = 36; // ~0.5 in
  private indentDialogue = 108;     // ~1.5 in
  private indentTransition = 0;
  private dualGutter = 24; // ~1/3 in

  constructor(private doc: PDFDocument, opts?: { indentParentheticalPt?: number; indentDialoguePt?: number; dualGutterPt?: number }) {
    const m = (doc as any).page.margins as {left:number;right:number;top:number;bottom:number};
    this.left = m.left; this.right = m.right; this.top = m.top; this.bottom = m.bottom;
    this.pageWidth = (doc as any).page.width;
    this.pageHeight = (doc as any).page.height;
    this.printableWidth = this.pageWidth - this.left - this.right;
    if (opts?.indentParentheticalPt != null) this.indentParenthetical = opts.indentParentheticalPt;
    if (opts?.indentDialoguePt != null) this.indentDialogue = opts.indentDialoguePt;
    if (opts?.dualGutterPt != null) this.dualGutter = opts.dualGutterPt;
  }

  get y(): number { return (this.doc as any).y; }

  private heightOf(text: string, width: number): number {
    return this.doc.heightOfString(text || ' ', { width });
  }

  private ensureSpace(height: number) {
    const y = (this.doc as any).y;
    if (y + height > this.pageHeight - this.bottom) {
      this.doc.addPage();
    }
  }

  private write(text: string, indent: number, align: Align = 'left', opts: any = {}) {
    const x = this.left + indent;
    const width = this.printableWidth - indent;
    this.ensureSpace(this.heightOf(text, width));
    this.doc.text(text || ' ', x, undefined as any, { width, align, ...opts });
  }

  blank(lines = 1) { for (let i=0;i<lines;i++) this.doc.moveDown(1); }

  sceneHeading(text: string, sceneNo?: number) {
    const t = text.toUpperCase().replace(/^\./, '').trim();
    const line = sceneNo ? `${sceneNo}. ${t}` : t;
    this.blank(1);
    this.write(line, this.indentSceneHeading, 'left');
    this.doc.moveDown(0.25);
  }

  action(text: string) {
    this.write(text, this.indentAction, 'left');
  }

  character(name: string) {
    const t = name.replace(/^@/, '').toUpperCase().trim();
    this.blank(1);
    const width = this.printableWidth - this.indentDialogue;
    this.ensureSpace(this.heightOf(t, width));
    this.doc.text(t, this.left, undefined as any, { width: this.printableWidth, align: 'center' });
  }

  parenthetical(text: string) {
    const t = text.trim();
    this.write(t, this.indentParenthetical, 'left');
  }

  dialogue(text: string) {
    const t = text.trim();
    this.write(t, this.indentDialogue, 'left');
  }

  transition(text: string) {
    const t = text.toUpperCase().trim();
    this.write(t, this.indentTransition, 'right');
    this.doc.moveDown(0.25);
  }

  dualDialogue(leftName: string, leftText: string[], rightName: string, rightText: string[]) {
    const gutter = this.dualGutter;
    const colWidth = (this.printableWidth - gutter) / 2;
    const leftX = this.left + this.indentDialogue - 36;
    const rightX = this.left + colWidth + gutter + this.indentDialogue - 36;

    const leftBlock = [leftName.toUpperCase(), ...leftText].join('\n');
    const rightBlock = [rightName.toUpperCase(), ...rightText].join('\n');
    const hLeft = this.doc.heightOfString(leftBlock, { width: colWidth });
    const hRight = this.doc.heightOfString(rightBlock, { width: colWidth });
    const h = Math.max(hLeft, hRight) + 6;
    this.ensureSpace(h);

    const startY = (this.doc as any).y;
    this.doc.text(leftName.toUpperCase(), leftX, startY, { width: colWidth, align: 'center' });
    this.doc.text(leftText.join('\n') || ' ', leftX, (this.doc as any).y, { width: colWidth, align: 'left' });

    this.doc.text(rightName.toUpperCase(), rightX, startY, { width: colWidth, align: 'center' });
    this.doc.text(rightText.join('\n') || ' ', rightX, (this.doc as any).y, { width: colWidth, align: 'left' });

    const endY = Math.max(
      startY + this.doc.heightOfString(leftBlock, { width: colWidth }),
      startY + this.doc.heightOfString(rightBlock, { width: colWidth }),
    );
    (this.doc as any).y = endY;
  }
}

