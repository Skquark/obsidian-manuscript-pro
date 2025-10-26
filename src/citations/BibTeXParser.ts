/**
 * BibTeX Parser
 * Parses BibTeX/BibLaTeX files and extracts bibliographic entries
 */

export interface BibEntry {
	key: string;
	type: string; // article, book, inproceedings, etc.
	fields: Map<string, string>;
	rawEntry: string;
	file: string;
	line: number;
}

export class BibTeXParser {
	private strings: Map<string, string> = new Map();

	/**
	 * Parse BibTeX file content
	 */
	parse(content: string, filename: string): Map<string, BibEntry> {
		const entries = new Map<string, BibEntry>();
		this.strings.clear();

		// First pass: extract @string definitions
		this.extractStrings(content);

		// Second pass: extract entries
		const entryRegex = /@(\w+)\s*\{\s*([^,\s]+)\s*,([^@]*?)^\}/gims;
		let match;
		let lineNumber = 1;

		while ((match = entryRegex.exec(content)) !== null) {
			const type = match[1].toLowerCase();
			const key = match[2].trim();
			const fieldsText = match[3];

			// Skip @string, @preamble, @comment
			if (type === 'string' || type === 'preamble' || type === 'comment') {
				continue;
			}

			// Count line number
			lineNumber = content.substring(0, match.index).split('\n').length;

			const entry: BibEntry = {
				key,
				type,
				fields: this.parseFields(fieldsText),
				rawEntry: match[0],
				file: filename,
				line: lineNumber,
			};

			// Resolve @string references
			this.resolveStrings(entry);

			entries.set(key, entry);
		}

		// Third pass: resolve crossref
		this.resolveCrossRefs(entries);

		return entries;
	}

	/**
	 * Extract @string definitions
	 */
	private extractStrings(content: string): void {
		const stringRegex = /@string\s*\{\s*(\w+)\s*=\s*["{]([^"}]+)["}]\s*\}/gi;
		let match;

		while ((match = stringRegex.exec(content)) !== null) {
			const name = match[1].toLowerCase();
			const value = match[2].trim();
			this.strings.set(name, value);
		}
	}

	/**
	 * Parse fields from entry body
	 */
	private parseFields(fieldsText: string): Map<string, string> {
		const fields = new Map<string, string>();

		// Match field = value pairs
		// Supports: field = "value", field = {value}, field = value
		const fieldRegex = /(\w+)\s*=\s*(["{]?)([^,}]+?)\2\s*(?:,|(?=\}))/gis;
		let match;

		while ((match = fieldRegex.exec(fieldsText)) !== null) {
			const fieldName = match[1].toLowerCase().trim();
			let fieldValue = match[3].trim();

			// Clean up value
			fieldValue = this.cleanField(fieldValue);

			fields.set(fieldName, fieldValue);
		}

		return fields;
	}

	/**
	 * Clean field value (remove LaTeX commands, braces, etc.)
	 */
	private cleanField(field: string): string {
		let cleaned = field;

		// Remove outer braces
		cleaned = cleaned.replace(/^\{+|\}+$/g, '');

		// Remove LaTeX commands but keep their content
		cleaned = cleaned.replace(/\\[a-zA-Z]+\{([^}]*)\}/g, '$1');
		cleaned = cleaned.replace(/\\[a-zA-Z]+\s+/g, '');

		// Handle special LaTeX characters
		cleaned = cleaned.replace(/\\&/g, '&');
		cleaned = cleaned.replace(/\\%/g, '%');
		cleaned = cleaned.replace(/\\\$/g, '$');
		cleaned = cleaned.replace(/\\#/g, '#');
		cleaned = cleaned.replace(/\\_/g, '_');
		cleaned = cleaned.replace(/\\\{/g, '{');
		cleaned = cleaned.replace(/\\\}/g, '}');
		cleaned = cleaned.replace(/\\~/g, '~');

		// Handle accents (simplified)
		cleaned = cleaned.replace(/\\['"^`~=.]/g, '');

		// Remove multiple spaces
		cleaned = cleaned.replace(/\s+/g, ' ');

		// Remove leading/trailing quotes
		cleaned = cleaned.replace(/^["']|["']$/g, '');

		return cleaned.trim();
	}

	/**
	 * Resolve @string references in entry
	 */
	private resolveStrings(entry: BibEntry): void {
		entry.fields.forEach((value, key) => {
			// Check if value is a string reference
			const stringRef = value.toLowerCase().trim();
			if (this.strings.has(stringRef)) {
				entry.fields.set(key, this.strings.get(stringRef)!);
			}
		});
	}

	/**
	 * Resolve crossref fields
	 */
	private resolveCrossRefs(entries: Map<string, BibEntry>): void {
		entries.forEach((entry) => {
			const crossref = entry.fields.get('crossref');
			if (crossref) {
				const parent = entries.get(crossref);
				if (parent) {
					// Inherit fields from parent that are not already set
					parent.fields.forEach((value, key) => {
						if (!entry.fields.has(key)) {
							entry.fields.set(key, value);
						}
					});
				}
			}
		});
	}

	/**
	 * Get authors as array
	 */
	static getAuthors(entry: BibEntry): string[] {
		const authorField = entry.fields.get('author') || entry.fields.get('editor') || '';
		if (!authorField) return [];

		// Split by 'and'
		return authorField.split(/\s+and\s+/i).map((author) => author.trim());
	}

	/**
	 * Get first author last name
	 */
	static getFirstAuthorLastName(entry: BibEntry): string {
		const authors = this.getAuthors(entry);
		if (authors.length === 0) return 'Unknown';

		const firstAuthor = authors[0];

		// Handle "Last, First" format
		if (firstAuthor.includes(',')) {
			return firstAuthor.split(',')[0].trim();
		}

		// Handle "First Last" format - take last word
		const parts = firstAuthor.trim().split(/\s+/);
		return parts[parts.length - 1];
	}

	/**
	 * Get year from entry
	 */
	static getYear(entry: BibEntry): string {
		return entry.fields.get('year') || entry.fields.get('date')?.substring(0, 4) || 'n.d.';
	}

	/**
	 * Validate entry has required fields for its type
	 */
	static validate(entry: BibEntry): { valid: boolean; missing: string[] } {
		const requiredFields: Record<string, string[]> = {
			article: ['author', 'title', 'journal', 'year'],
			book: ['author', 'title', 'publisher', 'year'],
			inproceedings: ['author', 'title', 'booktitle', 'year'],
			incollection: ['author', 'title', 'booktitle', 'publisher', 'year'],
			phdthesis: ['author', 'title', 'school', 'year'],
			mastersthesis: ['author', 'title', 'school', 'year'],
			techreport: ['author', 'title', 'institution', 'year'],
			misc: ['title'],
		};

		const required = requiredFields[entry.type] || [];
		const missing: string[] = [];

		required.forEach((field) => {
			if (!entry.fields.has(field)) {
				missing.push(field);
			}
		});

		return {
			valid: missing.length === 0,
			missing,
		};
	}
}
