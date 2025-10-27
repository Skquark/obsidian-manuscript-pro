/**
 * Built-In Template Presets
 * Professional templates for common book publishing scenarios
 *
 * Based on industry standards from major publishers including:
 * - Amazon KDP, IngramSpark
 * - Traditional publishers (Penguin Random House, HarperCollins)
 * - Academic publishers (Oxford, Cambridge, Springer)
 */

import type { TemplatePreset } from './TemplatePreset';
import { createDefaultTemplate } from './TemplateConfiguration';

/**
 * Fiction Novel - 5×8 Digest
 * Standard for mass market paperbacks and contemporary fiction
 */
export const FICTION_5X8: TemplatePreset = {
	id: 'fiction-5x8',
	name: 'Fiction Novel (5×8)',
	description: 'Mass market paperback format for contemporary fiction and genre novels',
	category: 'fiction',
	tags: ['novel', 'fiction', 'mass-market', '5x8', 'digest'],
	icon: '📕',
	author: 'ManuScript Pro',
	version: '1.0',
	isBuiltIn: true,
	bestFor: 'Contemporary novels, thrillers, romance, science fiction',
	trimSizes: ['5×8', '5.25×8'],
	formats: ['PDF', 'EPUB'],

	configuration: {
		...createDefaultTemplate(),
		name: 'Fiction Novel (5×8)',
		category: 'fiction',

		document: {
			documentClass: 'book',
			classOptions: ['openany', 'oneside'],
			pageNumbering: true,
			pageNumberStyle: 'arabic',
			pageNumberPosition: 'footer',
		},

		typography: {
			bodyFont: 'Palatino',
			sansFont: 'Helvetica',
			monoFont: 'Courier',
			fontSize: '11pt',
			lineSpacing: 1.2,
			paragraphIndent: '0.18in',
			paragraphSpacing: '0pt',
			firstLineIndent: true,
			microtype: true,
			widowPenalty: 10000,
			clubPenalty: 10000,
			hyphenPenalty: 50,
			tolerance: 500,
			emergencyStretch: '3em',
			raggedBottom: true,
			hyphenation: true,
			leftHyphenMin: 3,
			rightHyphenMin: 3,
			language: 'en-US',
		},

		geometry: {
			paperSize: '5x8',
			top: '0.75in',
			bottom: '0.75in',
			inner: '0.75in',
			outer: '0.5in',
		},

		chapters: {
			display: 'display',
			fontSize: 'LARGE',
			bold: true,
			align: 'center',
			numberFormat: 'arabic',
			prefix: 'Chapter',
			spaceBefore: '50pt',
			spaceAfter: '30pt',
			newPage: true,
			rightPage: false,
		},

		headersFooters: {
			preset: 'book-center',
			firstPageStyle: 'plain',
			headerRule: { enabled: false, width: '0pt', style: 'solid' },
			footerRule: { enabled: false, width: '0pt', style: 'solid' },
			headerFont: { size: 'small', style: 'italic' },
			footerFont: { size: 'small', style: 'normal' },
			leftPage: { left: [], center: [], right: [] },
			rightPage: { left: [], center: [], right: [] },
		},

		tableOfContents: {
			enabled: true,
			depth: 1,
			title: 'Contents',
			titleSize: 'LARGE',
			titleAlignment: 'center',
			dotLeaders: true,
			chapterBold: true,
			indentWidth: '1.5em',
			beforeSkip: '10pt',
			afterSkip: '20pt',
			entrySpacing: '5pt',
			showPageNumbers: true,
			hyperlinks: true,
		},
	},
};

/**
 * Fiction Novel - 6×9 Trade
 * Premium trade paperback format for literary fiction
 */
export const FICTION_6X9: TemplatePreset = {
	id: 'fiction-6x9',
	name: 'Fiction Novel (6×9)',
	description: 'Premium trade paperback format for literary fiction and bestsellers',
	category: 'fiction',
	tags: ['novel', 'fiction', 'trade', '6x9', 'premium'],
	icon: '📘',
	author: 'ManuScript Pro',
	version: '1.0',
	isBuiltIn: true,
	bestFor: 'Literary fiction, bestsellers, debut novels',
	trimSizes: ['6×9', '5.5×8.5'],
	formats: ['PDF', 'EPUB'],

	configuration: {
		...createDefaultTemplate(),
		name: 'Fiction Novel (6×9)',
		category: 'fiction',

		document: {
			documentClass: 'book',
			classOptions: ['openright', 'twoside'],
			pageNumbering: true,
			pageNumberStyle: 'arabic',
			pageNumberPosition: 'footer',
		},

		typography: {
			bodyFont: 'Garamond',
			sansFont: 'Helvetica',
			monoFont: 'Courier',
			fontSize: '11pt',
			lineSpacing: 1.25,
			paragraphIndent: '0.20in',
			paragraphSpacing: '0pt',
			firstLineIndent: true,
			microtype: true,
			widowPenalty: 10000,
			clubPenalty: 10000,
			hyphenPenalty: 50,
			tolerance: 400,
			emergencyStretch: '3em',
			raggedBottom: true,
			hyphenation: true,
			leftHyphenMin: 3,
			rightHyphenMin: 3,
			language: 'en-US',
		},

		geometry: {
			paperSize: '6x9',
			top: '1in',
			bottom: '1in',
			inner: '1in',
			outer: '0.75in',
		},

		chapters: {
			display: 'display',
			fontSize: 'huge',
			bold: true,
			align: 'center',
			numberFormat: 'arabic',
			prefix: 'Chapter',
			spaceBefore: '60pt',
			spaceAfter: '40pt',
			newPage: true,
			rightPage: true, // Start on right page for premium look
		},

		headersFooters: {
			preset: 'book-lr',
			firstPageStyle: 'empty',
			headerRule: { enabled: false, width: '0pt', style: 'solid' },
			footerRule: { enabled: false, width: '0pt', style: 'solid' },
			headerFont: { size: 'small', style: 'italic' },
			footerFont: { size: 'small', style: 'normal' },
			leftPage: { left: [], center: [], right: [] },
			rightPage: { left: [], center: [], right: [] },
		},

		tableOfContents: {
			enabled: false, // Fiction often skips TOC
			depth: 1,
			title: 'Contents',
			titleSize: 'LARGE',
			titleAlignment: 'center',
			dotLeaders: false,
			chapterBold: false,
			indentWidth: '0em',
			beforeSkip: '10pt',
			afterSkip: '20pt',
			entrySpacing: '8pt',
			showPageNumbers: true,
			hyperlinks: true,
		},
	},
};

/**
 * Non-Fiction - 6×9 Standard
 * Standard format for non-fiction, business books, self-help
 */
export const NONFICTION_6X9: TemplatePreset = {
	id: 'nonfiction-6x9',
	name: 'Non-Fiction (6×9)',
	description: 'Standard format for non-fiction, business books, memoirs, and self-help',
	category: 'non-fiction',
	tags: ['non-fiction', 'business', 'self-help', '6x9', 'memoir'],
	icon: '📗',
	author: 'ManuScript Pro',
	version: '1.0',
	isBuiltIn: true,
	bestFor: 'Business books, memoirs, self-help, how-to guides',
	trimSizes: ['6×9'],
	formats: ['PDF', 'EPUB'],

	configuration: {
		...createDefaultTemplate(),
		name: 'Non-Fiction (6×9)',
		category: 'non-fiction',

		document: {
			documentClass: 'book',
			classOptions: ['openany', 'twoside'],
			pageNumbering: true,
			pageNumberStyle: 'arabic',
			pageNumberPosition: 'footer',
		},

		typography: {
			bodyFont: 'Charter',
			sansFont: 'Helvetica',
			monoFont: 'Courier',
			fontSize: '11pt',
			lineSpacing: 1.3,
			paragraphIndent: '0pt',
			paragraphSpacing: '6pt',
			firstLineIndent: false,
			microtype: true,
			widowPenalty: 10000,
			clubPenalty: 10000,
			hyphenPenalty: 50,
			tolerance: 500,
			emergencyStretch: '3em',
			raggedBottom: false,
			hyphenation: true,
			leftHyphenMin: 3,
			rightHyphenMin: 3,
			language: 'en-US',
		},

		geometry: {
			paperSize: '6x9',
			top: '1in',
			bottom: '1in',
			inner: '1in',
			outer: '0.75in',
		},

		chapters: {
			display: 'hang',
			fontSize: 'LARGE',
			bold: true,
			align: 'left',
			numberFormat: 'arabic',
			prefix: 'Chapter',
			spaceBefore: '40pt',
			spaceAfter: '25pt',
			newPage: true,
			rightPage: false,
		},

		headersFooters: {
			preset: 'book-lr',
			firstPageStyle: 'plain',
			headerRule: { enabled: true, width: '0.4pt', style: 'solid' },
			footerRule: { enabled: false, width: '0pt', style: 'solid' },
			headerFont: { size: 'small', style: 'normal' },
			footerFont: { size: 'small', style: 'normal' },
			leftPage: { left: [], center: [], right: [] },
			rightPage: { left: [], center: [], right: [] },
		},

		tableOfContents: {
			enabled: true,
			depth: 2, // Show chapters and sections
			title: 'Table of Contents',
			titleSize: 'LARGE',
			titleAlignment: 'left',
			dotLeaders: true,
			chapterBold: true,
			indentWidth: '1.5em',
			beforeSkip: '0pt',
			afterSkip: '20pt',
			entrySpacing: '4pt',
			showPageNumbers: true,
			hyperlinks: true,
		},
	},
};

/**
 * Non-Fiction - 7×10 Large Format
 * Premium format for coffee table books, technical guides
 */
export const NONFICTION_7X10: TemplatePreset = {
	id: 'nonfiction-7x10',
	name: 'Non-Fiction (7×10)',
	description: 'Large format for technical books, textbooks, and visual-heavy content',
	category: 'non-fiction',
	tags: ['non-fiction', 'technical', 'textbook', '7x10', 'large-format'],
	icon: '📙',
	author: 'ManuScript Pro',
	version: '1.0',
	isBuiltIn: true,
	bestFor: 'Technical manuals, textbooks, cookbooks, coffee table books',
	trimSizes: ['7×10', '8×10'],
	formats: ['PDF'],

	configuration: {
		...createDefaultTemplate(),
		name: 'Non-Fiction (7×10)',
		category: 'non-fiction',

		document: {
			documentClass: 'book',
			classOptions: ['openany', 'twoside'],
			pageNumbering: true,
			pageNumberStyle: 'arabic',
			pageNumberPosition: 'footer',
		},

		typography: {
			bodyFont: 'DejaVu Serif',
			sansFont: 'DejaVu Sans',
			monoFont: 'DejaVu Sans Mono',
			fontSize: '10.5pt',
			lineSpacing: 1.4,
			paragraphIndent: '0pt',
			paragraphSpacing: '8pt',
			firstLineIndent: false,
			microtype: true,
			widowPenalty: 10000,
			clubPenalty: 10000,
			hyphenPenalty: 50,
			tolerance: 600,
			emergencyStretch: '3em',
			raggedBottom: false,
			hyphenation: true,
			leftHyphenMin: 3,
			rightHyphenMin: 3,
			language: 'en-US',
		},

		geometry: {
			paperSize: '7x10',
			top: '1in',
			bottom: '1.25in',
			inner: '1.25in',
			outer: '1in',
		},

		chapters: {
			display: 'hang',
			fontSize: 'huge',
			bold: true,
			align: 'left',
			numberFormat: 'arabic',
			prefix: 'Chapter',
			spaceBefore: '30pt',
			spaceAfter: '20pt',
			newPage: true,
			rightPage: false,
		},

		headersFooters: {
			preset: 'book-lr',
			firstPageStyle: 'plain',
			headerRule: { enabled: true, width: '0.5pt', style: 'solid' },
			footerRule: { enabled: false, width: '0pt', style: 'solid' },
			headerFont: { size: 'small', style: 'normal' },
			footerFont: { size: 'normal', style: 'normal' },
			leftPage: { left: [], center: [], right: [] },
			rightPage: { left: [], center: [], right: [] },
		},

		tableOfContents: {
			enabled: true,
			depth: 3, // Full depth for technical content
			title: 'Contents',
			titleSize: 'huge',
			titleAlignment: 'left',
			dotLeaders: true,
			chapterBold: true,
			indentWidth: '1.5em',
			beforeSkip: '0pt',
			afterSkip: '25pt',
			entrySpacing: '3pt',
			showPageNumbers: true,
			hyperlinks: true,
		},
	},
};

/**
 * Academic Paper
 * Standard format for academic papers, dissertations, theses
 */
export const ACADEMIC_PAPER: TemplatePreset = {
	id: 'academic-paper',
	name: 'Academic Paper',
	description: 'Standard format for academic papers, dissertations, and theses',
	category: 'academic',
	tags: ['academic', 'paper', 'thesis', 'dissertation', 'research'],
	icon: '🎓',
	author: 'ManuScript Pro',
	version: '1.0',
	isBuiltIn: true,
	bestFor: 'Research papers, dissertations, theses, conference papers',
	trimSizes: ['Letter (8.5×11)', 'A4'],
	formats: ['PDF'],

	configuration: {
		...createDefaultTemplate(),
		name: 'Academic Paper',
		category: 'academic',

		document: {
			documentClass: 'article',
			classOptions: ['12pt', 'letterpaper', 'oneside'],
			pageNumbering: true,
			pageNumberStyle: 'arabic',
			pageNumberPosition: 'header',
		},

		typography: {
			bodyFont: 'Times New Roman',
			sansFont: 'Arial',
			monoFont: 'Courier New',
			fontSize: '12pt',
			lineSpacing: 2.0, // Double-spaced
			paragraphIndent: '0.5in',
			paragraphSpacing: '0pt',
			firstLineIndent: true,
			microtype: false,
			widowPenalty: 10000,
			clubPenalty: 10000,
			hyphenPenalty: 5000,
			tolerance: 1000,
			emergencyStretch: '3em',
			raggedBottom: false,
			hyphenation: false, // Often disabled in academic work
			leftHyphenMin: 3,
			rightHyphenMin: 3,
			language: 'en-US',
		},

		geometry: {
			paperSize: 'letterpaper',
			top: '1in',
			bottom: '1in',
			inner: '1in',
			outer: '1in',
		},

		chapters: {
			display: 'hang',
			fontSize: 'Large',
			bold: true,
			align: 'left',
			numberFormat: 'arabic',
			prefix: '',
			spaceBefore: '12pt',
			spaceAfter: '12pt',
			newPage: false,
			rightPage: false,
		},

		headersFooters: {
			preset: 'academic',
			firstPageStyle: 'plain',
			headerRule: { enabled: false, width: '0pt', style: 'solid' },
			footerRule: { enabled: false, width: '0pt', style: 'solid' },
			headerFont: { size: 'normal', style: 'normal' },
			footerFont: { size: 'normal', style: 'normal' },
			leftPage: { left: [], center: [], right: [] },
			rightPage: { left: [], center: [], right: [] },
		},

		tableOfContents: {
			enabled: true,
			depth: 3,
			title: 'Table of Contents',
			titleSize: 'Large',
			titleAlignment: 'center',
			dotLeaders: true,
			chapterBold: false,
			indentWidth: '1.5em',
			beforeSkip: '0pt',
			afterSkip: '1em',
			entrySpacing: '0pt',
			showPageNumbers: true,
			hyperlinks: true,
		},
	},
};

/**
 * Technical Manual
 * Format for technical documentation, API guides, user manuals
 */
export const TECHNICAL_MANUAL: TemplatePreset = {
	id: 'technical-manual',
	name: 'Technical Manual',
	description: 'Format for technical documentation, API guides, and user manuals',
	category: 'technical',
	tags: ['technical', 'manual', 'documentation', 'api', 'guide'],
	icon: '⚙️',
	author: 'ManuScript Pro',
	version: '1.0',
	isBuiltIn: true,
	bestFor: 'Software documentation, API guides, user manuals, technical references',
	trimSizes: ['7×10', '8.5×11'],
	formats: ['PDF', 'EPUB'],

	configuration: {
		...createDefaultTemplate(),
		name: 'Technical Manual',
		category: 'technical',

		document: {
			documentClass: 'book',
			classOptions: ['openany', 'oneside'],
			pageNumbering: true,
			pageNumberStyle: 'arabic',
			pageNumberPosition: 'footer',
		},

		typography: {
			bodyFont: 'DejaVu Serif',
			sansFont: 'DejaVu Sans',
			monoFont: 'DejaVu Sans Mono',
			fontSize: '10pt',
			lineSpacing: 1.3,
			paragraphIndent: '0pt',
			paragraphSpacing: '6pt',
			firstLineIndent: false,
			microtype: true,
			widowPenalty: 10000,
			clubPenalty: 10000,
			hyphenPenalty: 50,
			tolerance: 800,
			emergencyStretch: '3em',
			raggedBottom: false,
			hyphenation: true,
			leftHyphenMin: 3,
			rightHyphenMin: 3,
			language: 'en-US',
		},

		geometry: {
			paperSize: '7x10',
			top: '1in',
			bottom: '1.25in',
			inner: '1in',
			outer: '1in',
		},

		chapters: {
			display: 'hang',
			fontSize: 'LARGE',
			bold: true,
			align: 'left',
			numberFormat: 'arabic',
			prefix: '',
			spaceBefore: '30pt',
			spaceAfter: '20pt',
			newPage: true,
			rightPage: false,
		},

		headersFooters: {
			preset: 'book-lr',
			firstPageStyle: 'plain',
			headerRule: { enabled: true, width: '0.4pt', style: 'solid' },
			footerRule: { enabled: false, width: '0pt', style: 'solid' },
			headerFont: { size: 'small', style: 'normal' },
			footerFont: { size: 'small', style: 'normal' },
			leftPage: { left: [], center: [], right: [] },
			rightPage: { left: [], center: [], right: [] },
		},

		tableOfContents: {
			enabled: true,
			depth: 3,
			title: 'Contents',
			titleSize: 'LARGE',
			titleAlignment: 'left',
			dotLeaders: true,
			chapterBold: true,
			indentWidth: '1.5em',
			beforeSkip: '0pt',
			afterSkip: '20pt',
			entrySpacing: '2pt',
			showPageNumbers: true,
			hyperlinks: true,
		},

		// Technical manuals often have code blocks
		codeBlocks: {
			highlighting: true,
			lineNumbers: true,
			fontSize: 'footnotesize',
			background: true,
		},

		// Technical manuals have many images
		images: {
			defaultWidth: '0.8\\textwidth',
			align: 'center',
			captionPosition: 'below',
			keepInPlace: true,
		},

		// Professional table styling
		tables: {
			style: 'booktabs',
			headerStyle: 'bold',
			zebraStriping: false,
		},
	},
};

/**
 * Poetry Collection
 * Specialized format for poetry books
 */
export const POETRY_COLLECTION: TemplatePreset = {
	id: 'poetry-collection',
	name: 'Poetry Collection',
	description: 'Specialized format for poetry books with centered text and generous spacing',
	category: 'special',
	tags: ['poetry', 'verse', 'special', 'literary'],
	icon: '✍️',
	author: 'ManuScript Pro',
	version: '1.0',
	isBuiltIn: true,
	bestFor: 'Poetry collections, verse, literary magazines',
	trimSizes: ['5×8', '6×9'],
	formats: ['PDF', 'EPUB'],

	configuration: {
		...createDefaultTemplate(),
		name: 'Poetry Collection',
		category: 'special',

		document: {
			documentClass: 'book',
			classOptions: ['openany', 'oneside'],
			pageNumbering: true,
			pageNumberStyle: 'arabic',
			pageNumberPosition: 'footer',
		},

		typography: {
			bodyFont: 'Garamond',
			sansFont: 'Helvetica',
			monoFont: 'Courier',
			fontSize: '11pt',
			lineSpacing: 1.5,
			paragraphIndent: '0pt',
			paragraphSpacing: '12pt',
			firstLineIndent: false,
			microtype: true,
			widowPenalty: 10000,
			clubPenalty: 10000,
			hyphenPenalty: 10000, // Avoid hyphenation in poetry
			tolerance: 1000,
			emergencyStretch: '3em',
			raggedBottom: true,
			hyphenation: false,
			leftHyphenMin: 3,
			rightHyphenMin: 3,
			language: 'en-US',
		},

		geometry: {
			paperSize: '5x8',
			top: '1in',
			bottom: '1in',
			inner: '0.75in',
			outer: '0.75in',
		},

		chapters: {
			display: 'display',
			fontSize: 'Large',
			bold: false,
			uppercase: false,
			align: 'center',
			numberFormat: 'none',
			prefix: '',
			spaceBefore: '50pt',
			spaceAfter: '40pt',
			newPage: true,
			rightPage: false,
		},

		headersFooters: {
			preset: 'minimal',
			firstPageStyle: 'empty',
			headerRule: { enabled: false, width: '0pt', style: 'solid' },
			footerRule: { enabled: false, width: '0pt', style: 'solid' },
			headerFont: { size: 'small', style: 'italic' },
			footerFont: { size: 'small', style: 'normal' },
			leftPage: { left: [], center: [], right: [] },
			rightPage: { left: [], center: [], right: [] },
		},

		tableOfContents: {
			enabled: true,
			depth: 1,
			title: 'Contents',
			titleSize: 'Large',
			titleAlignment: 'center',
			dotLeaders: false,
			chapterBold: false,
			indentWidth: '0em',
			beforeSkip: '10pt',
			afterSkip: '30pt',
			entrySpacing: '10pt',
			showPageNumbers: true,
			hyperlinks: true,
		},
	},
};

/**
 * Workbook / Journal
 * Format with extra space for notes and exercises
 */
export const WORKBOOK: TemplatePreset = {
	id: 'workbook',
	name: 'Workbook / Journal',
	description: 'Format with generous spacing for exercises, notes, and interactive content',
	category: 'special',
	tags: ['workbook', 'journal', 'exercises', 'interactive', 'education'],
	icon: '📝',
	author: 'ManuScript Pro',
	version: '1.0',
	isBuiltIn: true,
	bestFor: 'Workbooks, journals, educational materials, guided journals',
	trimSizes: ['8.5×11', '7×10'],
	formats: ['PDF'],

	configuration: {
		...createDefaultTemplate(),
		name: 'Workbook / Journal',
		category: 'special',

		document: {
			documentClass: 'book',
			classOptions: ['openany', 'oneside'],
			pageNumbering: true,
			pageNumberStyle: 'arabic',
			pageNumberPosition: 'footer',
		},

		typography: {
			bodyFont: 'DejaVu Serif',
			sansFont: 'DejaVu Sans',
			monoFont: 'Courier',
			fontSize: '11pt',
			lineSpacing: 1.8, // Extra spacing for notes
			paragraphIndent: '0pt',
			paragraphSpacing: '12pt',
			firstLineIndent: false,
			microtype: true,
			widowPenalty: 10000,
			clubPenalty: 10000,
			hyphenPenalty: 50,
			tolerance: 600,
			emergencyStretch: '3em',
			raggedBottom: false,
			hyphenation: true,
			leftHyphenMin: 3,
			rightHyphenMin: 3,
			language: 'en-US',
		},

		geometry: {
			paperSize: '8.5x11',
			top: '1in',
			bottom: '1.5in',
			inner: '1in',
			outer: '1in',
		},

		chapters: {
			display: 'hang',
			fontSize: 'LARGE',
			bold: true,
			align: 'left',
			numberFormat: 'arabic',
			prefix: 'Lesson',
			spaceBefore: '30pt',
			spaceAfter: '25pt',
			newPage: true,
			rightPage: false,
		},

		headersFooters: {
			preset: 'book-center',
			firstPageStyle: 'plain',
			headerRule: { enabled: false, width: '0pt', style: 'solid' },
			footerRule: { enabled: false, width: '0pt', style: 'solid' },
			headerFont: { size: 'normal', style: 'normal' },
			footerFont: { size: 'normal', style: 'normal' },
			leftPage: { left: [], center: [], right: [] },
			rightPage: { left: [], center: [], right: [] },
		},

		tableOfContents: {
			enabled: true,
			depth: 2,
			title: 'Table of Contents',
			titleSize: 'LARGE',
			titleAlignment: 'left',
			dotLeaders: true,
			chapterBold: true,
			indentWidth: '1.5em',
			beforeSkip: '0pt',
			afterSkip: '20pt',
			entrySpacing: '6pt',
			showPageNumbers: true,
			hyperlinks: true,
		},
	},
};

/**
 * Export all built-in presets
 */
export const BUILT_IN_PRESETS: TemplatePreset[] = [
	FICTION_5X8,
	FICTION_6X9,
	NONFICTION_6X9,
	NONFICTION_7X10,
	ACADEMIC_PAPER,
	TECHNICAL_MANUAL,
	POETRY_COLLECTION,
	WORKBOOK,
];
