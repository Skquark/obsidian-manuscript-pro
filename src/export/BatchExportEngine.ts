/**
 * Batch Export Engine
 * Handles multi-format batch export with progress tracking
 */

import { App, Notice, TFile } from 'obsidian';
import type ManuscriptProPlugin from '../main';
import type {
	BatchExportConfiguration,
	BatchExportProgress,
	BatchExportResult,
	BatchExportError,
} from './BatchExportInterfaces';
import { ExportManager } from './ExportManager';
import * as path from 'path';
import * as fs from 'fs';

export class BatchExportEngine {
	private progress: BatchExportProgress;
	private onProgressUpdate?: (progress: BatchExportProgress) => void;

	constructor(
		private app: App,
		private plugin: ManuscriptProPlugin,
		private exportManager: ExportManager,
	) {
		this.progress = {
			totalFormats: 0,
			completedFormats: 0,
			currentFormat: '',
			currentStatus: '',
			errors: [],
			warnings: [],
			startTime: 0,
		};
	}

	/**
	 * Set progress update callback
	 */
	setProgressCallback(callback: (progress: BatchExportProgress) => void) {
		this.onProgressUpdate = callback;
	}

	/**
	 * Execute batch export
	 */
	async export(config: BatchExportConfiguration): Promise<BatchExportResult> {
		const startTime = Date.now();
		const enabledFormats = config.formats.filter((f) => f.enabled);

		// Initialize progress
		this.progress = {
			totalFormats: enabledFormats.length,
			completedFormats: 0,
			currentFormat: '',
			currentStatus: 'Preparing export...',
			errors: [],
			warnings: [],
			startTime,
		};
		this.updateProgress();

		// Prepare output directory
		const outputDir = await this.prepareOutputDirectory(config);

		// Get files to export
		const files = await this.getFilesToExport(config);
		if (!files || files.length === 0) {
			const error: BatchExportError = {
				format: 'all',
				error: 'No files selected for export',
				timestamp: Date.now(),
			};
			this.progress.errors.push(error);
			this.updateProgress();

			return {
				success: false,
				totalFormats: 0,
				successfulFormats: 0,
				failedFormats: 0,
				outputs: [],
				totalDuration: Date.now() - startTime,
			};
		}

		// Export each format
		const results: BatchExportResult['outputs'] = [];

		for (const formatConfig of enabledFormats) {
			const formatStartTime = Date.now();
			this.progress.currentFormat = formatConfig.format.toUpperCase();
			this.progress.currentStatus = `Exporting to ${formatConfig.format.toUpperCase()}...`;
			this.updateProgress();

			try {
				const outputPath = await this.exportFormat(formatConfig, files, outputDir, config);
				results.push({
					format: formatConfig.format,
					success: true,
					outputPath,
					duration: Date.now() - formatStartTime,
				});

				this.progress.completedFormats++;
			} catch (error) {
				const exportError: BatchExportError = {
					format: formatConfig.format,
					error: error.message || 'Unknown error',
					timestamp: Date.now(),
				};
				this.progress.errors.push(exportError);

				results.push({
					format: formatConfig.format,
					success: false,
					error: error.message,
					duration: Date.now() - formatStartTime,
				});
			}

			this.updateProgress();
		}

		// Calculate results
		const successfulFormats = results.filter((r) => r.success).length;
		const failedFormats = results.filter((r) => !r.success).length;

		// Open output directory if requested
		if (config.openAfterExport && successfulFormats > 0) {
			this.openOutputDirectory(outputDir);
		}

		return {
			success: successfulFormats > 0,
			totalFormats: enabledFormats.length,
			successfulFormats,
			failedFormats,
			outputs: results,
			totalDuration: Date.now() - startTime,
		};
	}

	/**
	 * Export a single format
	 */
	private async exportFormat(
		formatConfig: any,
		files: TFile[],
		outputDir: string,
		config: BatchExportConfiguration,
	): Promise<string> {
		// Determine output path
		let outputPath: string;
		if (config.organizeByFormat) {
			const formatDir = path.join(outputDir, formatConfig.format);
			if (!fs.existsSync(formatDir)) {
				fs.mkdirSync(formatDir, { recursive: true });
			}
			outputPath = this.buildOutputPath(formatConfig, formatDir, config);
		} else {
			outputPath = this.buildOutputPath(formatConfig, outputDir, config);
		}

		// Check if file exists and overwrite setting
		if (fs.existsSync(outputPath) && !config.overwriteExisting) {
			throw new Error(`File already exists: ${outputPath}`);
		}

		// Call appropriate export method based on scope
		if (config.scope === 'manuscript') {
			// For manuscript scope, we need to get all manuscript files
			// TODO: Access manuscript structure properly when available
			// For now, use the files array which should be empty for manuscript scope
			const manuscriptFiles = files.length > 0 ? files : [];
			await this.exportManager.exportFiles(manuscriptFiles, formatConfig.profileId, outputPath);
		} else {
			await this.exportManager.exportFiles(files, formatConfig.profileId, outputPath);
		}

		return outputPath;
	}

	/**
	 * Build output file path
	 */
	private buildOutputPath(formatConfig: any, outputDir: string, config: BatchExportConfiguration): string {
		let filename = formatConfig.outputFilename || this.getDefaultFilename(config);

		// Add timestamp if requested
		if (config.includeTimestamp) {
			const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
			filename = `${filename}-${timestamp}`;
		}

		// Add extension
		const extension = this.getExtension(formatConfig.format);
		const fullPath = path.join(outputDir, `${filename}.${extension}`);

		return fullPath;
	}

	/**
	 * Get default filename based on scope
	 */
	private getDefaultFilename(config: BatchExportConfiguration): string {
		if (config.scope === 'manuscript') {
			// Use vault name as default manuscript filename
			const vaultName = this.app.vault.getName();
			return this.sanitizeFilename(vaultName) || 'manuscript';
		} else if (config.scope === 'current-file') {
			const activeFile = this.app.workspace.getActiveFile();
			if (activeFile) {
				return activeFile.basename;
			}
		}
		return 'export';
	}

	/**
	 * Get file extension for format
	 */
	private getExtension(format: string): string {
		const extensions: { [key: string]: string } = {
			pdf: 'pdf',
			docx: 'docx',
			epub: 'epub',
			html: 'html',
			latex: 'tex',
			markdown: 'md',
		};
		return extensions[format] || format;
	}

	/**
	 * Sanitize filename
	 */
	private sanitizeFilename(filename: string): string {
		return filename.replace(/[^a-z0-9_\-]/gi, '_').replace(/_{2,}/g, '_');
	}

	/**
	 * Prepare output directory
	 */
	private async prepareOutputDirectory(config: BatchExportConfiguration): Promise<string> {
		let outputDir = config.outputDirectory;

		// Use vault root if no directory specified
		if (!outputDir) {
			const vaultPath = (this.app.vault.adapter as any).basePath;
			outputDir = path.join(vaultPath, 'Exports');
		}

		// Create directory if it doesn't exist
		if (!fs.existsSync(outputDir)) {
			fs.mkdirSync(outputDir, { recursive: true });
		}

		return outputDir;
	}

	/**
	 * Get files to export based on scope
	 */
	private async getFilesToExport(config: BatchExportConfiguration): Promise<TFile[] | null> {
		if (config.scope === 'current-file') {
			const activeFile = this.app.workspace.getActiveFile();
			return activeFile ? [activeFile] : null;
		} else if (config.scope === 'selected-files' && config.selectedFiles) {
			const files: TFile[] = [];
			for (const filePath of config.selectedFiles) {
				const file = this.app.vault.getAbstractFileByPath(filePath);
				if (file instanceof TFile) {
					files.push(file);
				}
			}
			return files.length > 0 ? files : null;
		} else if (config.scope === 'manuscript') {
			// For manuscript scope, ExportManager handles file collection
			return [];
		}
		return null;
	}

	/**
	 * Open output directory in file manager
	 */
	private openOutputDirectory(outputDir: string) {
		try {
			// Try to open the directory using electron shell
			const { shell } = require('electron');
			if (shell) {
				shell.openPath(outputDir);
			}
		} catch (error) {
			console.error('Failed to open output directory:', error);
		}
	}

	/**
	 * Update progress and trigger callback
	 */
	private updateProgress() {
		// Calculate estimated completion
		if (this.progress.completedFormats > 0) {
			const elapsed = Date.now() - this.progress.startTime;
			const avgTimePerFormat = elapsed / this.progress.completedFormats;
			const remaining = this.progress.totalFormats - this.progress.completedFormats;
			this.progress.estimatedCompletion = Date.now() + avgTimePerFormat * remaining;
		}

		// Trigger callback
		if (this.onProgressUpdate) {
			this.onProgressUpdate({ ...this.progress });
		}
	}

	/**
	 * Get current progress
	 */
	getProgress(): BatchExportProgress {
		return { ...this.progress };
	}
}
