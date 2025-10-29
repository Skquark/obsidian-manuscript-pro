/**
 * Journal-Specific Export Templates
 * Pre-configured export profiles for major academic publishers and fiction formats
 */

import type { ExportProfile } from '../ExportInterfaces';

/**
 * Extended export profile with journal metadata
 */
export interface JournalTemplate extends ExportProfile {
	category: 'academic' | 'fiction' | 'technical';
	publisher?: string;
	journalName?: string;
	submissionGuidelines?: string; // URL to submission guidelines
	requirements?: {
		citationStyle?: string;
		wordLimit?: number;
		figureLimit?: number;
		tableLimit?: number;
		abstractWordLimit?: number;
		keywordCount?: number;
	};
	tags?: string[]; // For searching/filtering
}

/**
 * Academic Journal Templates
 */
export const ACADEMIC_TEMPLATES: JournalTemplate[] = [
	// Nature Family
	{
		id: 'nature',
		name: 'Nature',
		category: 'academic',
		publisher: 'Springer Nature',
		journalName: 'Nature',
		format: 'pdf',
		description: 'Nature journal format with strict formatting guidelines',
		submissionGuidelines: 'https://www.nature.com/nature/for-authors/formatting-guide',
		requirements: {
			citationStyle: 'nature',
			wordLimit: 5000,
			figureLimit: 6,
			abstractWordLimit: 200,
		},
		tags: ['science', 'biology', 'high-impact'],
		pandocOptions: {
			standalone: true,
			toc: false,
			numberSections: false,
			pdfEngine: 'xelatex',
			citeproc: true,
			csl: 'nature.csl',
			variables: {
				documentclass: 'article',
				fontfamily: 'times',
				fontsize: '12pt',
				linestretch: '2',
				geometry: 'margin=1in',
			},
		},
		filenamePattern: '${title}-nature.pdf',
		isBuiltIn: true,
		createdAt: Date.now(),
	},

	{
		id: 'science',
		name: 'Science',
		category: 'academic',
		publisher: 'AAAS',
		journalName: 'Science',
		format: 'pdf',
		description: 'Science magazine format',
		submissionGuidelines: 'https://www.science.org/content/page/instructions-authors',
		requirements: {
			citationStyle: 'science',
			wordLimit: 4500,
			abstractWordLimit: 125,
		},
		tags: ['science', 'multidisciplinary', 'high-impact'],
		pandocOptions: {
			standalone: true,
			toc: false,
			numberSections: false,
			pdfEngine: 'xelatex',
			citeproc: true,
			csl: 'science.csl',
			variables: {
				documentclass: 'article',
				fontsize: '12pt',
				linestretch: '2',
				geometry: 'margin=1in',
			},
		},
		filenamePattern: '${title}-science.pdf',
		isBuiltIn: true,
		createdAt: Date.now(),
	},

	// IEEE
	{
		id: 'ieee-transactions',
		name: 'IEEE Transactions',
		category: 'academic',
		publisher: 'IEEE',
		format: 'pdf',
		description: 'IEEE Transactions journal format (two-column)',
		submissionGuidelines: 'https://www.ieee.org/publications/authors/author-templates.html',
		requirements: {
			citationStyle: 'ieee',
		},
		tags: ['engineering', 'computer-science', 'technology'],
		pandocOptions: {
			standalone: true,
			toc: false,
			numberSections: true,
			pdfEngine: 'pdflatex',
			citeproc: true,
			csl: 'ieee.csl',
			variables: {
				documentclass: 'IEEEtran',
				fontsize: '10pt',
			},
		},
		filenamePattern: '${title}-ieee.pdf',
		isBuiltIn: true,
		createdAt: Date.now(),
	},

	{
		id: 'ieee-conference',
		name: 'IEEE Conference',
		category: 'academic',
		publisher: 'IEEE',
		format: 'pdf',
		description: 'IEEE Conference proceedings format',
		requirements: {
			citationStyle: 'ieee',
			wordLimit: 6000,
		},
		tags: ['engineering', 'conference', 'proceedings'],
		pandocOptions: {
			standalone: true,
			toc: false,
			numberSections: true,
			pdfEngine: 'pdflatex',
			citeproc: true,
			csl: 'ieee.csl',
			variables: {
				documentclass: 'IEEEtran',
				classoption: 'conference',
				fontsize: '10pt',
			},
		},
		filenamePattern: '${title}-ieee-conf.pdf',
		isBuiltIn: true,
		createdAt: Date.now(),
	},

	// ACM
	{
		id: 'acm-sigconf',
		name: 'ACM SIGCONF',
		category: 'academic',
		publisher: 'ACM',
		format: 'pdf',
		description: 'ACM conference proceedings format',
		submissionGuidelines: 'https://www.acm.org/publications/proceedings-template',
		requirements: {
			citationStyle: 'acm-sigconf',
		},
		tags: ['computer-science', 'conference'],
		pandocOptions: {
			standalone: true,
			toc: false,
			numberSections: true,
			pdfEngine: 'pdflatex',
			citeproc: true,
			csl: 'acm-sigconf.csl',
			variables: {
				documentclass: 'acmart',
				classoption: 'sigconf',
			},
		},
		filenamePattern: '${title}-acm.pdf',
		isBuiltIn: true,
		createdAt: Date.now(),
	},

	// Springer
	{
		id: 'springer-lncs',
		name: 'Springer LNCS',
		category: 'academic',
		publisher: 'Springer',
		format: 'pdf',
		description: 'Lecture Notes in Computer Science format',
		submissionGuidelines: 'https://www.springer.com/gp/computer-science/lncs/conference-proceedings-guidelines',
		requirements: {
			citationStyle: 'springer-lecture-notes-in-computer-science',
		},
		tags: ['computer-science', 'conference', 'springer'],
		pandocOptions: {
			standalone: true,
			toc: false,
			numberSections: true,
			pdfEngine: 'pdflatex',
			citeproc: true,
			csl: 'springer-lecture-notes-in-computer-science.csl',
			variables: {
				documentclass: 'llncs',
			},
		},
		filenamePattern: '${title}-lncs.pdf',
		isBuiltIn: true,
		createdAt: Date.now(),
	},

	// Elsevier
	{
		id: 'elsevier',
		name: 'Elsevier Journal',
		category: 'academic',
		publisher: 'Elsevier',
		format: 'pdf',
		description: 'Standard Elsevier journal article format',
		submissionGuidelines: 'https://www.elsevier.com/authors/policies-and-guidelines/latex-instructions',
		requirements: {
			citationStyle: 'elsevier-harvard',
		},
		tags: ['science', 'medical', 'elsevier'],
		pandocOptions: {
			standalone: true,
			toc: false,
			numberSections: true,
			pdfEngine: 'pdflatex',
			citeproc: true,
			csl: 'elsevier-harvard.csl',
			variables: {
				documentclass: 'elsarticle',
				classoption: 'review',
				fontsize: '12pt',
			},
		},
		filenamePattern: '${title}-elsevier.pdf',
		isBuiltIn: true,
		createdAt: Date.now(),
	},

	// APA Manuscript
	{
		id: 'apa-manuscript',
		name: 'APA Manuscript (7th ed)',
		category: 'academic',
		publisher: 'APA',
		format: 'pdf',
		description: 'APA 7th edition manuscript format for journals',
		submissionGuidelines: 'https://apastyle.apa.org/style-grammar-guidelines/paper-format',
		requirements: {
			citationStyle: 'apa',
			abstractWordLimit: 250,
		},
		tags: ['psychology', 'social-science', 'apa'],
		pandocOptions: {
			standalone: true,
			toc: false,
			numberSections: false,
			pdfEngine: 'xelatex',
			citeproc: true,
			csl: 'apa.csl',
			variables: {
				documentclass: 'apa7',
				classoption: 'man',
				fontsize: '12pt',
				linestretch: '2',
			},
		},
		filenamePattern: '${title}-apa.pdf',
		isBuiltIn: true,
		createdAt: Date.now(),
	},

	// Chicago
	{
		id: 'chicago-notes',
		name: 'Chicago (Notes & Bibliography)',
		category: 'academic',
		publisher: 'University of Chicago Press',
		format: 'pdf',
		description: 'Chicago Manual of Style with footnotes',
		requirements: {
			citationStyle: 'chicago-note-bibliography',
		},
		tags: ['humanities', 'history', 'chicago'],
		pandocOptions: {
			standalone: true,
			toc: true,
			numberSections: true,
			pdfEngine: 'xelatex',
			citeproc: true,
			csl: 'chicago-note-bibliography.csl',
			variables: {
				documentclass: 'article',
				fontsize: '12pt',
				linestretch: '2',
				geometry: 'margin=1in',
			},
		},
		filenamePattern: '${title}-chicago.pdf',
		isBuiltIn: true,
		createdAt: Date.now(),
	},

	// MLA
	{
		id: 'mla-9',
		name: 'MLA (9th edition)',
		category: 'academic',
		publisher: 'MLA',
		format: 'pdf',
		description: 'Modern Language Association 9th edition format',
		requirements: {
			citationStyle: 'modern-language-association',
		},
		tags: ['humanities', 'literature', 'mla'],
		pandocOptions: {
			standalone: true,
			toc: false,
			numberSections: false,
			pdfEngine: 'xelatex',
			citeproc: true,
			csl: 'modern-language-association.csl',
			variables: {
				documentclass: 'article',
				fontfamily: 'times',
				fontsize: '12pt',
				linestretch: '2',
				geometry: 'margin=1in',
			},
		},
		filenamePattern: '${title}-mla.pdf',
		isBuiltIn: true,
		createdAt: Date.now(),
	},

	// Medical Journals
	{
		id: 'jama',
		name: 'JAMA',
		category: 'academic',
		publisher: 'AMA',
		journalName: 'Journal of the American Medical Association',
		format: 'pdf',
		description: 'JAMA medical journal format',
		submissionGuidelines: 'https://jamanetwork.com/journals/jama/pages/instructions-for-authors',
		requirements: {
			citationStyle: 'jama',
			wordLimit: 3000,
			abstractWordLimit: 350,
		},
		tags: ['medicine', 'medical', 'healthcare'],
		pandocOptions: {
			standalone: true,
			toc: false,
			numberSections: false,
			pdfEngine: 'xelatex',
			citeproc: true,
			csl: 'jama.csl',
			variables: {
				documentclass: 'article',
				fontsize: '12pt',
				linestretch: '2',
				geometry: 'margin=1in',
			},
		},
		filenamePattern: '${title}-jama.pdf',
		isBuiltIn: true,
		createdAt: Date.now(),
	},

	{
		id: 'nejm',
		name: 'New England Journal of Medicine',
		category: 'academic',
		publisher: 'NEJM',
		journalName: 'New England Journal of Medicine',
		format: 'pdf',
		description: 'NEJM format for original articles',
		requirements: {
			citationStyle: 'new-england-journal-of-medicine',
			wordLimit: 3000,
			abstractWordLimit: 250,
		},
		tags: ['medicine', 'medical', 'high-impact'],
		pandocOptions: {
			standalone: true,
			toc: false,
			numberSections: false,
			pdfEngine: 'xelatex',
			citeproc: true,
			csl: 'new-england-journal-of-medicine.csl',
			variables: {
				documentclass: 'article',
				fontsize: '12pt',
				linestretch: '2',
				geometry: 'margin=1in',
			},
		},
		filenamePattern: '${title}-nejm.pdf',
		isBuiltIn: true,
		createdAt: Date.now(),
	},
];

/**
 * Fiction Writing Templates
 */
export const FICTION_TEMPLATES: JournalTemplate[] = [
	// Shunn Standard Manuscript Format
	{
		id: 'shunn-short',
		name: 'Shunn Standard (Short Story)',
		category: 'fiction',
		format: 'docx',
		description: 'Industry-standard manuscript format for short fiction submissions',
		submissionGuidelines: 'https://www.shunn.net/format/story/',
		requirements: {
			wordLimit: 7500, // Typical short story range
		},
		tags: ['fiction', 'short-story', 'submission'],
		pandocOptions: {
			standalone: true,
			toc: false,
			numberSections: false,
			variables: {
				fontfamily: 'Courier New',
				fontsize: '12pt',
				linestretch: '2',
				geometry: 'margin=1in',
				indent: '0.5in',
			},
			metadata: {
				'header-left': '$author-name$',
				'header-right': '$title$ / $page$',
			},
		},
		filenamePattern: '${title}-submission.docx',
		isBuiltIn: true,
		createdAt: Date.now(),
	},

	{
		id: 'novel-manuscript',
		name: 'Novel Manuscript Format',
		category: 'fiction',
		format: 'docx',
		description: 'Standard manuscript format for novel submissions to agents/publishers',
		requirements: {
			wordLimit: 120000, // Typical novel length
		},
		tags: ['fiction', 'novel', 'submission', 'agent'],
		pandocOptions: {
			standalone: true,
			toc: false,
			numberSections: false,
			variables: {
				fontfamily: 'Times New Roman',
				fontsize: '12pt',
				linestretch: '2',
				geometry: 'margin=1in',
			},
		},
		filenamePattern: '${title}-manuscript.docx',
		isBuiltIn: true,
		createdAt: Date.now(),
	},

	// Self-Publishing Formats
	{
		id: 'kdp-print',
		name: 'Kindle Direct Publishing (Print)',
		category: 'fiction',
		format: 'pdf',
		description: 'KDP print-ready PDF with standard trim size',
		submissionGuidelines: 'https://kdp.amazon.com/en_US/help/topic/G201834180',
		tags: ['self-publishing', 'kdp', 'amazon', 'print'],
		pandocOptions: {
			standalone: true,
			toc: true,
			tocDepth: 1,
			numberSections: false,
			pdfEngine: 'xelatex',
			variables: {
				documentclass: 'book',
				fontfamily: 'Crimson Text',
				fontsize: '11pt',
				geometry: 'paperwidth=6in,paperheight=9in,margin=0.75in',
				linestretch: '1.3',
			},
		},
		trimSize: '6x9',
		filenamePattern: '${title}-kdp.pdf',
		isBuiltIn: true,
		createdAt: Date.now(),
	},

	{
		id: 'kdp-ebook',
		name: 'Kindle Direct Publishing (E-book)',
		category: 'fiction',
		format: 'epub',
		description: 'KDP EPUB format for Kindle conversion',
		tags: ['self-publishing', 'kdp', 'ebook', 'kindle'],
		pandocOptions: {
			standalone: true,
			toc: true,
			tocDepth: 2,
			numberSections: false,
		},
		filenamePattern: '${title}-kindle.epub',
		isBuiltIn: true,
		createdAt: Date.now(),
	},

	{
		id: 'ingramspark',
		name: 'IngramSpark Print',
		category: 'fiction',
		format: 'pdf',
		description: 'IngramSpark print-ready PDF (6x9 standard trade)',
		submissionGuidelines: 'https://www.ingramspark.com/plan-your-book/print/formatting',
		tags: ['self-publishing', 'ingramspark', 'print', 'trade-paperback'],
		pandocOptions: {
			standalone: true,
			toc: true,
			numberSections: false,
			pdfEngine: 'xelatex',
			variables: {
				documentclass: 'book',
				fontfamily: 'EB Garamond',
				fontsize: '11pt',
				geometry: 'paperwidth=6in,paperheight=9in,inner=0.875in,outer=0.625in,top=0.75in,bottom=0.75in',
				linestretch: '1.25',
			},
		},
		trimSize: '6x9',
		filenamePattern: '${title}-ingram.pdf',
		isBuiltIn: true,
		createdAt: Date.now(),
	},
];

/**
 * Technical Writing Templates
 */
export const TECHNICAL_TEMPLATES: JournalTemplate[] = [
	{
		id: 'technical-report',
		name: 'Technical Report',
		category: 'technical',
		format: 'pdf',
		description: 'Standard technical report format with numbered sections',
		tags: ['technical', 'report', 'documentation'],
		pandocOptions: {
			standalone: true,
			toc: true,
			tocDepth: 3,
			numberSections: true,
			pdfEngine: 'xelatex',
			variables: {
				documentclass: 'report',
				fontsize: '11pt',
				geometry: 'margin=1in',
			},
		},
		filenamePattern: '${title}-report.pdf',
		isBuiltIn: true,
		createdAt: Date.now(),
	},

	{
		id: 'technical-manual',
		name: 'Technical Manual',
		category: 'technical',
		format: 'pdf',
		description: 'User manual/documentation format',
		tags: ['technical', 'manual', 'documentation', 'user-guide'],
		pandocOptions: {
			standalone: true,
			toc: true,
			tocDepth: 4,
			numberSections: true,
			pdfEngine: 'xelatex',
			variables: {
				documentclass: 'book',
				fontsize: '10pt',
				geometry: 'margin=1in',
			},
		},
		filenamePattern: '${title}-manual.pdf',
		isBuiltIn: true,
		createdAt: Date.now(),
	},
];

/**
 * Combined template library
 */
export const JOURNAL_TEMPLATE_LIBRARY: JournalTemplate[] = [
	...ACADEMIC_TEMPLATES,
	...FICTION_TEMPLATES,
	...TECHNICAL_TEMPLATES,
];

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: 'academic' | 'fiction' | 'technical'): JournalTemplate[] {
	return JOURNAL_TEMPLATE_LIBRARY.filter((t) => t.category === category);
}

/**
 * Search templates
 */
export function searchTemplates(query: string): JournalTemplate[] {
	const lowerQuery = query.toLowerCase();
	return JOURNAL_TEMPLATE_LIBRARY.filter(
		(t) =>
			t.name.toLowerCase().includes(lowerQuery) ||
			t.description?.toLowerCase().includes(lowerQuery) ||
			t.publisher?.toLowerCase().includes(lowerQuery) ||
			t.tags?.some((tag) => tag.toLowerCase().includes(lowerQuery)),
	);
}

/**
 * Get template by ID
 */
export function getTemplateById(id: string): JournalTemplate | undefined {
	return JOURNAL_TEMPLATE_LIBRARY.find((t) => t.id === id);
}
