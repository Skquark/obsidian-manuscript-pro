import { MarkdownPostProcessor } from 'obsidian';

export class ConcealPostProcessor {
	private readonly ELEMENTS_TO_PROCESS = 'p, li';
	private readonly REGEX_CURLY_REPLACEMENT = '$<answer>'; // first capture group; content is not concealed

	constructor(public regexp: RegExp) {}

	private conceal = (element: HTMLParagraphElement | HTMLLIElement) => {
		// InnterHTML is the only way to preserve element tags during the regex matches.
		// However, since the replaced text is a capture group, only text in the document itself can cause a replacement
		let resultString = '';
		let prevFinalPos = 0;

		let match;
		while ((match = this.regexp.exec(element.innerHTML)) !== null) {
			if (match.length > 1 && match.indices) {
				for (let i = 1; i < match.length; i++) {
				if (!match.indices) continue;

				const replacement = `<span class="manuscript-pro-hide-match">${match[i]}</span>`;
				const startPos = match.indices[i][0];
				const finalPos = match.indices[i][1];

				resultString += element.innerHTML.substring(prevFinalPos, startPos).concat(replacement);
				prevFinalPos = finalPos;
				}
			} else {
				const startPos = match.index;
				const finalPos = match.index + match[0].length;
				const replacement = `<span class=\"manuscript-pro-hide-match\">${match[0]}</span>`;
				resultString += element.innerHTML.substring(prevFinalPos, startPos).concat(replacement);
				prevFinalPos = finalPos;
			}
		}

		if (resultString.length > 0) {
			// append remaining content after last processed segment
			resultString += element.innerHTML.substring(prevFinalPos);
			element.innerHTML = resultString;
		}
	};

	// markdownPostProcessor manipulates the DOM of
	// read mode to conceal clozure syntax
	process: MarkdownPostProcessor = (htmlElement: HTMLElement): void => {
		const elements = htmlElement.querySelectorAll(this.ELEMENTS_TO_PROCESS);

		// Loop through each element
		elements.forEach((element: HTMLParagraphElement | HTMLLIElement) => {
			this.conceal(element);
		});
	};
}
