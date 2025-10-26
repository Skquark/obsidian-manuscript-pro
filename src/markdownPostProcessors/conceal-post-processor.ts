import { MarkdownPostProcessor } from 'obsidian';

export class ConcealPostProcessor {
  private readonly ELEMENTS_TO_PROCESS = 'p, li';

  constructor(public regexp: RegExp, private replacement: string = '') {}

  private conceal = (element: HTMLParagraphElement | HTMLLIElement) => {
    // Build a new innerHTML by walking matches and hiding them, inserting optional visible replacements
    const html = element.innerHTML;
    let result = '';
    let prev = 0;

    let match: RegExpExecArray | null;
    while ((match = this.regexp.exec(html)) !== null) {
      // If we have capture group indices (RegExp /d flag supported), hide only the groups
      const anyMatch = match as any;
      if (anyMatch.indices && match.length > 1) {
        const indices = anyMatch.indices as Array<[number, number]>;
        const groups: Array<{ i: number; start: number; end: number }> = [];
        for (let i = 1; i < match.length; i++) {
          const idx = indices[i];
          if (!idx || idx[0] == null || idx[0] < 0) continue; // skip unmatched
          groups.push({ i, start: idx[0], end: idx[1] });
        }
        groups.sort((a, b) => a.start - b.start);
        for (const g of groups) {
          result += html.substring(prev, g.start);
          const hidden = `<span class="manuscript-pro-hide-match">${match[g.i] ?? ''}</span>`;
          result += hidden;
          prev = g.end;
        }
      } else {
        // Hide entire match; insert replacement text if provided
        const start = match.index;
        const end = match.index + match[0].length;
        result += html.substring(prev, start);
        if (this.replacement) result += this.replacement;
        const hidden = `<span class="manuscript-pro-hide-match">${match[0]}</span>`;
        result += hidden;
        prev = end;
      }
    }

    if (result) {
      // Append remainder after last processed segment
      result += html.substring(prev);
      element.innerHTML = result;
    }
  };

  // markdownPostProcessor manipulates the DOM of Reading Mode to conceal syntax
  process: MarkdownPostProcessor = (htmlElement: HTMLElement): void => {
    const elements = htmlElement.querySelectorAll(this.ELEMENTS_TO_PROCESS);
    elements.forEach((el: HTMLParagraphElement | HTMLLIElement) => this.conceal(el));
  };
}

