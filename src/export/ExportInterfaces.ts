/**
 * Export System Interfaces
 * Data structures for manuscript export and publishing
 */

export type ExportFormat = 'pdf' | 'docx' | 'html' | 'epub' | 'latex' | 'markdown';

/**
 * Export profile variants for different build types
 */
export interface ExportProfileVariant {
	id: 'full' | 'test' | 'sample' | 'custom';
	name: string;
	chapterSelection: ChapterSelection;
}

export type ChapterSelection =
	| { type: 'all' }
	| { type: 'range'; start: number; end: number }
	| { type: 'count'; count: number }
	| { type: 'percentage'; percentage: number }
	| { type: 'custom'; chapterIds: string[] };

export const PROFILE_VARIANTS: ExportProfileVariant[] = [
	{
		id: 'full',
		name: 'Full Manuscript',
		chapterSelection: { type: 'all' },
	},
	{
		id: 'test',
		name: 'Test Build (First 3 Chapters)',
		chapterSelection: { type: 'count', count: 3 },
	},
	{
		id: 'sample',
		name: 'Sample (First 10%)',
		chapterSelection: { type: 'percentage', percentage: 10 },
	},
	{
		id: 'custom',
		name: 'Custom Selection',
		chapterSelection: { type: 'custom', chapterIds: [] },
	},
];

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
	templateVariables?: Record<string, string>; // Legacy key-value variables
	templateConfig?: string; // Reference to TemplateConfiguration ID (new system)

	// File settings
	outputPath?: string; // Default output directory
	filenamePattern?: string; // e.g., "${title}-${date}.pdf"

	// Trim size (for book publishing)
	trimSize?: string; // Reference to TrimSize preset ID (e.g., "6x9", "7x10")

	// Profile variant (test/sample/full builds)
	variant?: ExportProfileVariant;

	// Post-processing
	postProcessing?: PostProcessingOptions;

	// EPUB validation
	validateEpub?: boolean; // Automatically validate EPUB after generation

	// Metadata
	isBuiltIn: boolean;
	createdAt: number;
	lastUsed?: number;
}

/**
 * Post-processing options for PDF exports
 */
export interface PostProcessingOptions {
	compression?: CompressionSettings;
	linearize?: boolean; // Fast web view
	optimize?: boolean; // Additional PDF optimization
}

export type CompressionLevel = 'none' | 'screen' | 'ebook' | 'printer' | 'prepress';

export interface CompressionSettings {
	level: CompressionLevel;
	detectDuplicateImages: boolean;
	downsampleImages: boolean;
	embedFonts: boolean;
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

/**
 * Batch export options for multi-format exports
 */
export interface BatchExportOptions {
	formats: ExportFormat[];
	baseProfile: ExportProfile;
	formatOverrides?: Partial<Record<ExportFormat, Partial<ExportProfile>>>;
	outputDirectory: string;
	filenameBase: string; // e.g., "my-novel" → "my-novel.pdf", "my-novel.epub"
}

/**
 * Results from batch export operation
 */
export interface BatchExportResult {
	results: Map<ExportFormat, ExportResult>;
	totalDuration: number;
	successCount: number;
	failureCount: number;
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
	ghostscriptPath?: string; // Path to Ghostscript executable (auto-detect if empty)
	epubCheckPath?: string; // Path to EPUBCheck JAR file (auto-detect if empty)
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
