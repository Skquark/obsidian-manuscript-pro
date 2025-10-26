/**
 * Export System Interfaces
 * Data structures for manuscript export and publishing
 */

export type ExportFormat = 'pdf' | 'docx' | 'html' | 'epub' | 'latex' | 'markdown';

export type PdfEngine = 'pdflatex' | 'xelatex' | 'lualatex' | 'tectonic';

export interface ExportProfile {
	id: string;
	name: string;
	format: ExportFormat;
	description?: string;

	// Pandoc options
	pandocOptions: PandocOptions;

	// Template settings
	template?: string; // Template file path or name
	templateVariables?: Record<string, string>;

	// File settings
	outputPath?: string; // Default output directory
	filenamePattern?: string; // e.g., "${title}-${date}.pdf"

	// Metadata
	isBuiltIn: boolean;
	createdAt: number;
	lastUsed?: number;
}

export interface PandocOptions {
	// General options
	standalone?: boolean;
	selfContained?: boolean;
	toc?: boolean;
	tocDepth?: number;
	numberSections?: boolean;

	// PDF-specific
	pdfEngine?: PdfEngine;

	// Bibliography
	bibliography?: string[]; // Path(s) to .bib files
	csl?: string; // Citation style (CSL file path)
	citeproc?: boolean;

	// Filters
	filters?: string[];
	luaFilters?: string[];

	// Variables
	variables?: Record<string, string>;
	metadata?: Record<string, any>;

	// LaTeX options
	latexEngine?: string;
	latexEngineOpts?: string[];

	// HTML options
	css?: string[];
	mathJax?: boolean;

	// Advanced
	extraArgs?: string[]; // Additional Pandoc arguments
}

export interface ExportTask {
	id: string;
	profileId: string;
	inputFiles: string[]; // Paths to input files
	outputFile: string; // Path to output file
	status: ExportStatus;
	progress: number; // 0-100
	startedAt: number;
	completedAt?: number;
	error?: string;
	warnings?: string[];
}

export type ExportStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface ExportResult {
	success: boolean;
	outputPath?: string;
	error?: string;
	warnings?: string[];
	pandocOutput?: string;
	duration?: number; // milliseconds
}

export interface TemplateInfo {
	id: string;
	name: string;
	format: ExportFormat;
	path: string; // Full path to template file
	description?: string;
	isBuiltIn: boolean;
	variables?: TemplateVariable[];
}

export interface TemplateVariable {
	name: string;
	description: string;
	required: boolean;
	defaultValue?: string;
	type?: 'string' | 'number' | 'boolean' | 'date';
}

export interface ExportSettings {
	// General
	enabled: boolean;
	pandocPath?: string; // Path to Pandoc executable (auto-detect if empty)
	defaultOutputDir?: string; // Default export directory
	openAfterExport: boolean;

	// Profiles
	profiles: ExportProfile[];
	defaultProfileId?: string;

	// Templates
	templateDirectory?: string; // Directory for custom templates

	// Advanced
	maxConcurrentExports: number;
	keepIntermediateFiles: boolean;
	verboseLogging: boolean;
}

export interface ManuscriptMetadata {
	title?: string;
	author?: string;
	date?: string;
	abstract?: string;
	keywords?: string[];

	// Academic metadata
	affiliation?: string;
	email?: string;
	orcid?: string;

	// Journal/Conference
	journal?: string;
	volume?: string;
	issue?: string;
	pages?: string;
	doi?: string;

	// Custom fields
	custom?: Record<string, string>;
}

export const DEFAULT_EXPORT_PROFILES: ExportProfile[] = [
	{
		id: 'pdf-academic',
		name: 'Academic Paper (PDF)',
		format: 'pdf',
		description: 'Standard academic paper with numbered sections and citations',
		pandocOptions: {
			standalone: true,
			toc: false,
			numberSections: true,
			pdfEngine: 'pdflatex',
			citeproc: true,
			variables: {
				documentclass: 'article',
				fontsize: '12pt',
				geometry: 'margin=1in',
			},
		},
		filenamePattern: '${title}.pdf',
		isBuiltIn: true,
		createdAt: Date.now(),
	},
	{
		id: 'pdf-book',
		name: 'Book Manuscript (PDF)',
		format: 'pdf',
		description: 'Book format with chapters, table of contents, and front matter',
		pandocOptions: {
			standalone: true,
			toc: true,
			tocDepth: 3,
			numberSections: true,
			pdfEngine: 'xelatex',
			citeproc: true,
			variables: {
				documentclass: 'book',
				fontsize: '11pt',
				geometry: 'margin=1in',
			},
		},
		filenamePattern: '${title}-manuscript.pdf',
		isBuiltIn: true,
		createdAt: Date.now(),
	},
	{
		id: 'docx-standard',
		name: 'Microsoft Word (DOCX)',
		format: 'docx',
		description: 'Word document with standard formatting',
		pandocOptions: {
			standalone: true,
			toc: false,
			numberSections: false,
			citeproc: true,
		},
		filenamePattern: '${title}.docx',
		isBuiltIn: true,
		createdAt: Date.now(),
	},
	{
		id: 'html-web',
		name: 'HTML (Web)',
		format: 'html',
		description: 'Self-contained HTML with embedded styles and MathJax',
		pandocOptions: {
			standalone: true,
			selfContained: true,
			toc: true,
			mathJax: true,
			citeproc: true,
		},
		filenamePattern: '${title}.html',
		isBuiltIn: true,
		createdAt: Date.now(),
	},
	{
		id: 'epub-ebook',
		name: 'EPUB (E-book)',
		format: 'epub',
		description: 'EPUB format for e-readers',
		pandocOptions: {
			standalone: true,
			toc: true,
			tocDepth: 2,
			citeproc: true,
		},
		filenamePattern: '${title}.epub',
		isBuiltIn: true,
		createdAt: Date.now(),
	},
	{
		id: 'latex-source',
		name: 'LaTeX Source',
		format: 'latex',
		description: 'LaTeX source file for further editing',
		pandocOptions: {
			standalone: true,
			numberSections: true,
			citeproc: false, // Keep raw citations for LaTeX
		},
		filenamePattern: '${title}.tex',
		isBuiltIn: true,
		createdAt: Date.now(),
	},
];
