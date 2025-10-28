/**
 * Batch Export Interfaces
 * Data models for multi-format batch export system
 */

export interface BatchExportFormat {
	format: 'pdf' | 'docx' | 'epub' | 'html' | 'latex' | 'markdown';
	profileId: string; // Export profile to use for this format
	enabled: boolean;
	outputFilename?: string; // Custom filename (without extension)
}

export interface BatchExportConfiguration {
	formats: BatchExportFormat[];
	scope: 'current-file' | 'manuscript' | 'selected-files';
	selectedFiles?: string[]; // For 'selected-files' scope
	outputDirectory: string;
	organizeByFormat: boolean; // Create subdirectories for each format
	includeTimestamp: boolean; // Add timestamp to filenames
	overwriteExisting: boolean;
	openAfterExport: boolean; // Open output directory after completion
}

export interface BatchExportProgress {
	totalFormats: number;
	completedFormats: number;
	currentFormat: string;
	currentStatus: string;
	errors: BatchExportError[];
	warnings: string[];
	startTime: number;
	estimatedCompletion?: number;
}

export interface BatchExportError {
	format: string;
	error: string;
	timestamp: number;
}

export interface BatchExportResult {
	success: boolean;
	totalFormats: number;
	successfulFormats: number;
	failedFormats: number;
	outputs: {
		format: string;
		success: boolean;
		outputPath?: string;
		error?: string;
		duration: number;
	}[];
	totalDuration: number;
}

export interface BatchExportPreset {
	id: string;
	name: string;
	description: string;
	formats: BatchExportFormat[];
	organizeByFormat: boolean;
}

/**
 * Pre-defined batch export presets
 */
export const BATCH_EXPORT_PRESETS: BatchExportPreset[] = [
	{
		id: 'publish-ready',
		name: 'Publishing Package',
		description: 'PDF, DOCX, and EPUB for publishers',
		formats: [
			{ format: 'pdf', profileId: 'pdf-print', enabled: true },
			{ format: 'docx', profileId: 'docx-standard', enabled: true },
			{ format: 'epub', profileId: 'epub-ebook', enabled: true },
		],
		organizeByFormat: true,
	},
	{
		id: 'self-publish',
		name: 'Self-Publishing',
		description: 'Print PDF and EPUB for KDP/IngramSpark',
		formats: [
			{ format: 'pdf', profileId: 'pdf-print', enabled: true, outputFilename: 'print-interior' },
			{ format: 'epub', profileId: 'epub-ebook', enabled: true },
		],
		organizeByFormat: false,
	},
	{
		id: 'beta-readers',
		name: 'Beta Reader Package',
		description: 'DOCX, EPUB, and PDF for beta readers',
		formats: [
			{ format: 'docx', profileId: 'docx-standard', enabled: true },
			{ format: 'epub', profileId: 'epub-ebook', enabled: true },
			{ format: 'pdf', profileId: 'pdf-academic', enabled: true },
		],
		organizeByFormat: true,
	},
	{
		id: 'all-formats',
		name: 'All Formats',
		description: 'Export to every available format',
		formats: [
			{ format: 'pdf', profileId: 'pdf-print', enabled: true },
			{ format: 'docx', profileId: 'docx-standard', enabled: true },
			{ format: 'epub', profileId: 'epub-ebook', enabled: true },
			{ format: 'html', profileId: 'html-web', enabled: true },
			{ format: 'latex', profileId: 'latex-academic', enabled: true },
		],
		organizeByFormat: true,
	},
	{
		id: 'web-preview',
		name: 'Web Preview',
		description: 'HTML and Markdown for web preview',
		formats: [
			{ format: 'html', profileId: 'html-web', enabled: true },
			{ format: 'markdown', profileId: 'markdown-github', enabled: true },
		],
		organizeByFormat: false,
	},
];

/**
 * Get preset by ID
 */
export function getBatchExportPreset(presetId: string): BatchExportPreset | undefined {
	return BATCH_EXPORT_PRESETS.find((p) => p.id === presetId);
}

/**
 * Get all available presets
 */
export function getAllBatchExportPresets(): BatchExportPreset[] {
	return BATCH_EXPORT_PRESETS;
}
