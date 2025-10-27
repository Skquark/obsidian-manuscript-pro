/**
 * Manuscript Manifest Loader and Validator
 * Loads, validates, and manages manuscript project files
 */

import { TFile, TFolder, Vault } from 'obsidian';
import type { ManuscriptProject, ValidationResult, ValidationError, ValidationWarning } from './ManuscriptSchema';

export class ManuscriptLoader {
	private vault: Vault;

	constructor(vault: Vault) {
		this.vault = vault;
	}

	/**
	 * Find manuscript manifest file in vault
	 * Looks for book-manifest.json, manuscript.json, or book.json
	 */
	async findManifest(): Promise<TFile | null> {
		const searchNames = ['book-manifest.json', 'manuscript.json', 'book.json'];

		for (const name of searchNames) {
			const file = this.vault.getAbstractFileByPath(name);
			if (file instanceof TFile) {
				return file;
			}
		}

		return null;
	}

	/**
	 * Load manuscript project from file
	 */
	async loadManuscript(file: TFile): Promise<ManuscriptProject> {
		const content = await this.vault.read(file);
		const data = JSON.parse(content);

		// Detect and convert old format if needed
		if (!data.schemaVersion) {
			return this.convertLegacyFormat(data);
		}

		return data as ManuscriptProject;
	}

	/**
	 * Convert legacy book.json or book-manifest.json to new format
	 */
	private convertLegacyFormat(data: any): ManuscriptProject {
		// If it has "book" property, it's the user's format
		if (data.book) {
			return this.convertUserFormat(data);
		}

		// Otherwise it's the old simple book.json format
		return this.convertOldSimpleFormat(data);
	}

	/**
	 * Convert user's book-manifest.json format to new schema
	 */
	private convertUserFormat(data: any): ManuscriptProject {
		const manuscript: ManuscriptProject = {
			schemaVersion: '1.0.0',
			book: {
				title: data.book.title || 'Untitled',
				subtitle: data.book.subtitle,
				version: data.book.version || '1.0.0',
				authors: data.book.authors || [],
				copyright: data.book.copyright || {
					year: new Date().getFullYear(),
					holder: '',
					statement: 'All rights reserved.',
				},
				metadata: {
					language: data.book.language || 'en-US',
					bisacCodes: data.book.metadata?.bisac_codes,
					bisacDescriptions: data.book.metadata?.bisac_descriptions,
					readingLevel: data.book.metadata?.reading_level,
					ageRange: data.book.metadata?.age_range,
					subjects: data.book.metadata?.subjects,
					keywords: data.book.keywords,
					series: data.book.metadata?.series,
				},
			},
			editions: {},
			trimSizes: {},
			defaults: {
				frontmatter: data.defaults?.frontmatter || {
					spacing: 1,
					pagebreak: true,
					toc: false,
					numbered: false,
				},
				mainmatter: data.defaults?.mainmatter || {
					spacing: 1,
					pagebreak: true,
					toc: true,
					numbered: true,
				},
				backmatter: data.defaults?.backmatter || {
					spacing: 1,
					pagebreak: true,
					toc: true,
					numbered: false,
				},
				tocDepth: data.defaults?.toc_depth || {},
			},
			frontmatter: this.convertFileList(data.frontmatter || []),
			mainmatter: this.convertFileList(data.mainmatter || []),
			backmatter: this.convertFileList(data.backmatter || []),
			profiles: {},
		};

		// Convert editions
		if (data.editions) {
			for (const [key, edition] of Object.entries(data.editions) as [string, any][]) {
				manuscript.editions[key] = {
					name: edition.name || key,
					identifiers: {
						isbn13: edition.isbn_13,
						isbn10: edition.isbn_10,
					},
					trimSize: edition.trim_size || '6x9',
					binding: edition.binding || 'perfect',
					pricing: {
						usd: edition.price_usd,
					},
					template: edition.template,
					description: edition.description,
					barcode: edition.barcode || {
						position: 'none',
					},
				};
			}
		}

		// Convert trim sizes
		if (data.trim_sizes) {
			for (const [key, trimSize] of Object.entries(data.trim_sizes) as [string, any][]) {
				manuscript.trimSizes[key] = {
					name: trimSize.name || key,
					width: trimSize.width,
					height: trimSize.height,
					margins: {
						top: trimSize.margins?.top || '0.5in',
						bottom: trimSize.margins?.bottom || '0.5in',
						outer: trimSize.margins?.outer || '0.5in',
						innerBase: trimSize.margins?.inner_base || '0.5in',
						innerPerPage: trimSize.margins?.inner_per_100_pages,
					},
				};
			}
		}

		// Convert profiles
		if (data.profiles) {
			for (const [key, profile] of Object.entries(data.profiles) as [string, any][]) {
				manuscript.profiles[key] = {
					name: key,
					comment: profile.comment,
					frontmatter: profile.frontmatter || 'all',
					mainmatter: profile.mainmatter || 'all',
					backmatter: profile.backmatter || 'all',
				};
			}
		}

		return manuscript;
	}

	/**
	 * Convert old simple book.json format to new schema
	 */
	private convertOldSimpleFormat(data: any): ManuscriptProject {
		return {
			schemaVersion: '1.0.0',
			book: {
				title: data.title || 'Untitled',
				subtitle: data.subtitle,
				version: '1.0.0',
				authors: data.author ? [{ name: data.author, role: 'primary' }] : [],
				copyright: {
					year: new Date().getFullYear(),
					holder: data.author || '',
					statement: 'All rights reserved.',
				},
				metadata: {
					language: 'en-US',
				},
			},
			editions: {},
			trimSizes: {},
			defaults: {
				frontmatter: { spacing: 1, pagebreak: true, toc: false, numbered: false },
				mainmatter: { spacing: 1, pagebreak: true, toc: true, numbered: true },
				backmatter: { spacing: 1, pagebreak: true, toc: true, numbered: false },
				tocDepth: {},
			},
			frontmatter: this.convertFileList(data.frontmatter || []),
			mainmatter: this.convertFileList(data.chapters || data.mainmatter || []),
			backmatter: this.convertFileList(data.backmatter || []),
			profiles: {
				full: {
					name: 'full',
					comment: 'Complete manuscript',
					frontmatter: 'all',
					mainmatter: 'all',
					backmatter: 'all',
				},
			},
		};
	}

	/**
	 * Convert file list from old format to new format
	 */
	private convertFileList(files: any[]): any[] {
		return files.map((file) => {
			if (typeof file === 'string') {
				return { file };
			}
			return {
				file: file.file || file.path,
				title: file.title,
				spacing: file.spacing,
				pagebreak: file.pagebreak,
				toc: file.toc,
				numbered: file.numbered,
				optional: file.optional,
				comment: file.comment,
			};
		});
	}

	/**
	 * Validate manuscript project
	 */
	validate(manuscript: ManuscriptProject): ValidationResult {
		const errors: ValidationError[] = [];
		const warnings: ValidationWarning[] = [];

		// Required fields
		if (!manuscript.book?.title) {
			errors.push({
				path: 'book.title',
				message: 'Book title is required',
				severity: 'error',
			});
		}

		if (!manuscript.book?.authors || manuscript.book.authors.length === 0) {
			warnings.push({
				path: 'book.authors',
				message: 'No authors specified',
				severity: 'warning',
			});
		}

		// Validate file references
		this.validateFileList(manuscript.frontmatter, 'frontmatter', errors, warnings);
		this.validateFileList(manuscript.mainmatter, 'mainmatter', errors, warnings);
		this.validateFileList(manuscript.backmatter, 'backmatter', errors, warnings);

		// Validate editions reference valid trim sizes
		for (const [editionId, edition] of Object.entries(manuscript.editions || {}) as [string, any][]) {
			if (!manuscript.trimSizes[edition.trimSize]) {
				errors.push({
					path: `editions.${editionId}.trimSize`,
					message: `Edition "${edition.name}" references unknown trim size "${edition.trimSize}"`,
					severity: 'error',
				});
			}
		}

		// Validate ISBN format
		for (const [editionId, edition] of Object.entries(manuscript.editions || {}) as [string, any][]) {
			if (edition.identifiers.isbn13 && !this.isValidISBN13(edition.identifiers.isbn13)) {
				warnings.push({
					path: `editions.${editionId}.identifiers.isbn13`,
					message: `ISBN-13 format appears invalid: ${edition.identifiers.isbn13}`,
					severity: 'warning',
				});
			}
		}

		return {
			valid: errors.length === 0,
			errors,
			warnings,
		};
	}

	/**
	 * Validate file list references
	 */
	private validateFileList(
		files: any[],
		section: string,
		errors: ValidationError[],
		warnings: ValidationWarning[],
	): void {
		for (let i = 0; i < files.length; i++) {
			const file = files[i];
			if (!file.file) {
				errors.push({
					path: `${section}[${i}]`,
					message: 'File path is required',
					severity: 'error',
				});
			}

			// Check if file exists in vault
			const tfile = this.vault.getAbstractFileByPath(file.file);
			if (!tfile) {
				warnings.push({
					path: `${section}[${i}].file`,
					message: `File not found: ${file.file}`,
					severity: 'warning',
				});
			}
		}
	}

	/**
	 * Validate ISBN-13 format
	 */
	private isValidISBN13(isbn: string): boolean {
		// Remove hyphens and spaces
		const cleaned = isbn.replace(/[-\s]/g, '');

		// Must be 13 digits
		if (!/^\d{13}$/.test(cleaned)) {
			return false;
		}

		// Calculate check digit
		let sum = 0;
		for (let i = 0; i < 12; i++) {
			const digit = parseInt(cleaned[i]);
			sum += i % 2 === 0 ? digit : digit * 3;
		}
		const checkDigit = (10 - (sum % 10)) % 10;

		return checkDigit === parseInt(cleaned[12]);
	}

	/**
	 * Save manuscript to file
	 */
	async saveManuscript(file: TFile, manuscript: ManuscriptProject): Promise<void> {
		const content = JSON.stringify(manuscript, null, 2);
		await this.vault.modify(file, content);
	}

	/**
	 * Create new manuscript project
	 */
	async createNewManuscript(folder: TFolder, title: string): Promise<TFile> {
		const manifest: ManuscriptProject = {
			schemaVersion: '1.0.0',
			book: {
				title,
				version: '1.0.0',
				authors: [],
				copyright: {
					year: new Date().getFullYear(),
					holder: '',
					statement: 'All rights reserved.',
				},
				metadata: {
					language: 'en-US',
				},
			},
			editions: {
				'trade-paperback': {
					name: 'Trade Paperback',
					identifiers: {},
					trimSize: '6x9',
					binding: 'perfect',
					pricing: {},
					barcode: { position: 'back-cover-bottom-right' },
				},
			},
			trimSizes: {
				'6x9': {
					name: 'Trade Paperback (6x9)',
					width: '6in',
					height: '9in',
					margins: {
						top: '0.65in',
						bottom: '0.35in',
						outer: '0.48in',
						innerBase: '0.52in',
						innerPerPage: '0.0625in',
					},
				},
			},
			defaults: {
				frontmatter: { spacing: 1, pagebreak: true, toc: false, numbered: false },
				mainmatter: { spacing: 1, pagebreak: true, toc: true, numbered: true },
				backmatter: { spacing: 1, pagebreak: true, toc: true, numbered: false },
				tocDepth: {
					frontmatter: 0,
					mainmatter: 1,
					backmatter: 0,
				},
			},
			frontmatter: [],
			mainmatter: [],
			backmatter: [],
			profiles: {
				full: {
					name: 'full',
					comment: 'Complete manuscript',
					frontmatter: 'all',
					mainmatter: 'all',
					backmatter: 'all',
				},
			},
		};

		const path = `${folder.path}/manuscript.json`;
		const file = await this.vault.create(path, JSON.stringify(manifest, null, 2));
		return file as TFile;
	}
}
