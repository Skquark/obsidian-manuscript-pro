/**
 * Citation Formatter
 * Formats bibliographic entries in various citation styles
 */

import { BibEntry, BibTeXParser } from './BibTeXParser';

export interface CitationStyle {
	name: string;
	format(entry: BibEntry): string;
}

/**
 * APA Style (7th edition)
 */
export class APAStyle implements CitationStyle {
	name = 'APA';

	format(entry: BibEntry): string {
		const authors = this.formatAuthors(entry);
		const year = BibTeXParser.getYear(entry);
		const title = entry.fields.get('title') || 'Untitled';

		switch (entry.type) {
			case 'article':
				return this.formatArticle(entry, authors, year, title);
			case 'book':
				return this.formatBook(entry, authors, year, title);
			case 'inproceedings':
			case 'conference':
				return this.formatConference(entry, authors, year, title);
			case 'incollection':
				return this.formatInCollection(entry, authors, year, title);
			case 'phdthesis':
			case 'mastersthesis':
				return this.formatThesis(entry, authors, year, title);
			default:
				return this.formatGeneric(entry, authors, year, title);
		}
	}

	private formatAuthors(entry: BibEntry): string {
		const authors = BibTeXParser.getAuthors(entry);
		if (authors.length === 0) return 'Unknown';

		if (authors.length === 1) {
			return this.formatAuthor(authors[0]);
		} else if (authors.length === 2) {
			return `${this.formatAuthor(authors[0])}, & ${this.formatAuthor(authors[1])}`;
		} else {
			return `${this.formatAuthor(authors[0])} et al.`;
		}
	}

	private formatAuthor(author: string): string {
		// Handle "Last, First" format
		if (author.includes(',')) {
			const parts = author.split(',').map((p) => p.trim());
			const last = parts[0];
			const first = parts[1] ? parts[1].charAt(0) + '.' : '';
			return `${last}, ${first}`;
		}

		// Handle "First Last" format
		const parts = author.trim().split(/\s+/);
		if (parts.length >= 2) {
			const last = parts[parts.length - 1];
			const first = parts[0].charAt(0) + '.';
			return `${last}, ${first}`;
		}

		return author;
	}

	private formatArticle(entry: BibEntry, authors: string, year: string, title: string): string {
		const journal = entry.fields.get('journal') || entry.fields.get('journaltitle') || '';
		const volume = entry.fields.get('volume') || '';
		const number = entry.fields.get('number') || '';
		const pages = entry.fields.get('pages') || '';

		let citation = `${authors} (${year}). ${title}. `;

		if (journal) {
			citation += `<em>${journal}</em>`;
			if (volume) {
				citation += `, ${volume}`;
				if (number) {
					citation += `(${number})`;
				}
			}
			if (pages) {
				citation += `, ${pages}`;
			}
			citation += '.';
		}

		return citation;
	}

	private formatBook(entry: BibEntry, authors: string, year: string, title: string): string {
		const publisher = entry.fields.get('publisher') || '';
		const edition = entry.fields.get('edition') || '';

		let citation = `${authors} (${year}). <em>${title}</em>`;

		if (edition) {
			citation += ` (${edition} ed.)`;
		}

		if (publisher) {
			citation += `. ${publisher}`;
		}

		citation += '.';
		return citation;
	}

	private formatConference(entry: BibEntry, authors: string, year: string, title: string): string {
		const booktitle = entry.fields.get('booktitle') || '';
		const pages = entry.fields.get('pages') || '';

		let citation = `${authors} (${year}). ${title}. `;

		if (booktitle) {
			citation += `In <em>${booktitle}</em>`;
			if (pages) {
				citation += ` (pp. ${pages})`;
			}
			citation += '.';
		}

		return citation;
	}

	private formatInCollection(entry: BibEntry, authors: string, year: string, title: string): string {
		const booktitle = entry.fields.get('booktitle') || '';
		const editor = entry.fields.get('editor') || '';
		const publisher = entry.fields.get('publisher') || '';
		const pages = entry.fields.get('pages') || '';

		let citation = `${authors} (${year}). ${title}. `;

		if (booktitle) {
			citation += `In `;
			if (editor) {
				citation += `${editor} (Ed.), `;
			}
			citation += `<em>${booktitle}</em>`;
			if (pages) {
				citation += ` (pp. ${pages})`;
			}
			citation += '.';
		}

		if (publisher) {
			citation += ` ${publisher}.`;
		}

		return citation;
	}

	private formatThesis(entry: BibEntry, authors: string, year: string, title: string): string {
		const school = entry.fields.get('school') || '';
		const type = entry.type === 'phdthesis' ? 'Doctoral dissertation' : "Master's thesis";

		let citation = `${authors} (${year}). <em>${title}</em> [${type}]. `;

		if (school) {
			citation += school + '.';
		}

		return citation;
	}

	private formatGeneric(entry: BibEntry, authors: string, year: string, title: string): string {
		return `${authors} (${year}). ${title}.`;
	}
}

/**
 * Chicago Style (Author-Date)
 */
export class ChicagoStyle implements CitationStyle {
	name = 'Chicago';

	format(entry: BibEntry): string {
		const authors = this.formatAuthors(entry);
		const year = BibTeXParser.getYear(entry);
		const title = entry.fields.get('title') || 'Untitled';

		switch (entry.type) {
			case 'article':
				return this.formatArticle(entry, authors, year, title);
			case 'book':
				return this.formatBook(entry, authors, year, title);
			default:
				return `${authors}. ${year}. "${title}."`;
		}
	}

	private formatAuthors(entry: BibEntry): string {
		const authors = BibTeXParser.getAuthors(entry);
		if (authors.length === 0) return 'Unknown';

		if (authors.length === 1) {
			return this.formatAuthor(authors[0]);
		} else if (authors.length <= 3) {
			const formatted = authors.slice(0, -1).map((a) => this.formatAuthor(a));
			return formatted.join(', ') + ', and ' + this.formatAuthor(authors[authors.length - 1]);
		} else {
			return this.formatAuthor(authors[0]) + ' et al.';
		}
	}

	private formatAuthor(author: string): string {
		if (author.includes(',')) {
			const parts = author.split(',').map((p) => p.trim());
			return `${parts[0]}, ${parts[1]}`;
		}

		const parts = author.trim().split(/\s+/);
		if (parts.length >= 2) {
			const last = parts[parts.length - 1];
			const first = parts.slice(0, -1).join(' ');
			return `${last}, ${first}`;
		}

		return author;
	}

	private formatArticle(entry: BibEntry, authors: string, year: string, title: string): string {
		const journal = entry.fields.get('journal') || entry.fields.get('journaltitle') || '';
		const volume = entry.fields.get('volume') || '';
		const number = entry.fields.get('number') || '';
		const pages = entry.fields.get('pages') || '';

		let citation = `${authors}. ${year}. "${title}." `;

		if (journal) {
			citation += `<em>${journal}</em> `;
			if (volume) {
				citation += volume;
				if (number) {
					citation += `, no. ${number}`;
				}
			}
			if (pages) {
				citation += `: ${pages}`;
			}
			citation += '.';
		}

		return citation;
	}

	private formatBook(entry: BibEntry, authors: string, year: string, title: string): string {
		const publisher = entry.fields.get('publisher') || '';
		const address = entry.fields.get('address') || '';

		let citation = `${authors}. ${year}. <em>${title}</em>. `;

		if (address && publisher) {
			citation += `${address}: ${publisher}.`;
		} else if (publisher) {
			citation += `${publisher}.`;
		}

		return citation;
	}
}

/**
 * MLA Style (9th edition)
 */
export class MLAStyle implements CitationStyle {
	name = 'MLA';

	format(entry: BibEntry): string {
		const authors = this.formatAuthors(entry);
		const title = entry.fields.get('title') || 'Untitled';

		switch (entry.type) {
			case 'article':
				return this.formatArticle(entry, authors, title);
			case 'book':
				return this.formatBook(entry, authors, title);
			default:
				return `${authors}. "${title}."`;
		}
	}

	private formatAuthors(entry: BibEntry): string {
		const authors = BibTeXParser.getAuthors(entry);
		if (authors.length === 0) return 'Unknown';

		if (authors.length === 1) {
			return this.formatAuthor(authors[0]);
		} else if (authors.length === 2) {
			return `${this.formatAuthor(authors[0])}, and ${this.formatAuthor(authors[1], false)}`;
		} else {
			return `${this.formatAuthor(authors[0])} et al.`;
		}
	}

	private formatAuthor(author: string, lastFirst = true): string {
		if (author.includes(',')) {
			return author;
		}

		const parts = author.trim().split(/\s+/);
		if (parts.length >= 2) {
			if (lastFirst) {
				const last = parts[parts.length - 1];
				const first = parts.slice(0, -1).join(' ');
				return `${last}, ${first}`;
			} else {
				return parts.join(' ');
			}
		}

		return author;
	}

	private formatArticle(entry: BibEntry, authors: string, title: string): string {
		const journal = entry.fields.get('journal') || entry.fields.get('journaltitle') || '';
		const volume = entry.fields.get('volume') || '';
		const number = entry.fields.get('number') || '';
		const year = BibTeXParser.getYear(entry);
		const pages = entry.fields.get('pages') || '';

		let citation = `${authors}. "${title}." `;

		if (journal) {
			citation += `<em>${journal}</em>`;
			if (volume) {
				citation += `, vol. ${volume}`;
				if (number) {
					citation += `, no. ${number}`;
				}
			}
			citation += `, ${year}`;
			if (pages) {
				citation += `, pp. ${pages}`;
			}
			citation += '.';
		}

		return citation;
	}

	private formatBook(entry: BibEntry, authors: string, title: string): string {
		const publisher = entry.fields.get('publisher') || '';
		const year = BibTeXParser.getYear(entry);

		let citation = `${authors}. <em>${title}</em>. `;

		if (publisher) {
			citation += `${publisher}, ${year}.`;
		}

		return citation;
	}
}

/**
 * Citation Formatter Manager
 */
export class CitationFormatter {
	private styles: Map<string, CitationStyle> = new Map();
	private activeStyle = 'APA';

	constructor() {
		// Register built-in styles
		this.registerStyle(new APAStyle());
		this.registerStyle(new ChicagoStyle());
		this.registerStyle(new MLAStyle());
	}

	registerStyle(style: CitationStyle): void {
		this.styles.set(style.name, style);
	}

	format(entry: BibEntry, styleName?: string): string {
		const style = this.styles.get(styleName || this.activeStyle);
		if (!style) {
			return this.formatDefault(entry);
		}

		return style.format(entry);
	}

	setActiveStyle(styleName: string): void {
		if (this.styles.has(styleName)) {
			this.activeStyle = styleName;
		}
	}

	getActiveStyle(): string {
		return this.activeStyle;
	}

	getAvailableStyles(): string[] {
		return Array.from(this.styles.keys());
	}

	private formatDefault(entry: BibEntry): string {
		const author = BibTeXParser.getFirstAuthorLastName(entry);
		const year = BibTeXParser.getYear(entry);
		const title = entry.fields.get('title') || 'Untitled';

		return `${author} (${year}). ${title}.`;
	}
}
