/**
 * Export Engine
 * Core logic for running Pandoc and generating exports
 *
 * IMPORTANT: This module requires Node.js APIs (child_process, fs, path) which are only
 * available when Obsidian runs with Node.js integration enabled. This typically works
 * in desktop versions of Obsidian but may not work in all environments.
 *
 * Users must have Pandoc installed on their system for export functionality to work.
 * Download from: https://pandoc.org
 */

import { Notice, TFile } from 'obsidian';
import { execFile } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import type LatexPandocConcealerPlugin from '../main';
import type { ExportProfile, ExportTask, ExportResult, ManuscriptMetadata } from './ExportInterfaces';
import { getTrimSizeById, estimatePageCount, buildGeometry } from './TrimSizePresets';
import { YAMLGenerator } from './YAMLGenerator';
import { LaTeXGenerator } from './LaTeXGenerator';
import type { TemplateConfiguration } from './TemplateConfiguration';

const execFileAsync = promisify(execFile);

export class ExportEngine {
	private activeTasks: Map<string, ExportTask> = new Map();
	private pandocVersion: string | null = null;

	constructor(private plugin: LatexPandocConcealerPlugin) {}

	/**
	 * Check if Pandoc is available
	 * This is a silent check - errors are only shown when user tries to export
	 */
	async checkPandocAvailable(): Promise<boolean> {
		try {
			// Check if Node.js APIs are available
			if (typeof execFile === 'undefined') {
				return false;
			}

			const pandocPath = this.getPandocPath();
			const { stdout } = await execFileAsync(pandocPath, ['--version']);

			// Parse version from output
			const versionMatch = stdout.match(/pandoc\s+([\d.]+)/);
			if (versionMatch) {
				this.pandocVersion = versionMatch[1];
				return true;
			}

			return false;
		} catch (error) {
			// Silently fail - user will get a notice when they actually try to export
			return false;
		}
	}

	/**
	 * Get Pandoc executable path (sanitized)
	 */
	private getPandocPath(): string {
		const customPath = this.plugin.settings.export?.pandocPath;
		if (customPath) {
			// Sanitize custom path - remove any shell metacharacters
			const sanitized = customPath.trim();

			// Validate that path doesn't contain dangerous characters
			if (/[;&|`$()<>]/.test(sanitized)) {
				console.error('Invalid Pandoc path detected (contains shell metacharacters):', customPath);
				new Notice('Invalid Pandoc path configuration. Using system default.');
				return 'pandoc';
			}

			return sanitized;
		}

		// Use system Pandoc
		return 'pandoc';
	}

	/**
	 * Export manuscript using a profile
	 */
	async exportManuscript(
		profile: ExportProfile,
		inputFiles: string[],
		outputPath?: string,
		metadata?: ManuscriptMetadata,
	): Promise<ExportResult> {
		const taskId = `export-${Date.now()}`;
		const startTime = Date.now();

		// Validate Pandoc availability
		const pandocAvailable = await this.checkPandocAvailable();
		if (!pandocAvailable) {
			return {
				success: false,
				error: 'Pandoc is not installed or not found in PATH. Please install Pandoc from https://pandoc.org',
			};
		}

		// Determine output path
		const finalOutputPath = outputPath || (await this.generateOutputPath(profile, metadata));

		// Create export task
		const task: ExportTask = {
			id: taskId,
			profileId: profile.id,
			inputFiles,
			outputFile: finalOutputPath,
			status: 'running',
			progress: 0,
			startedAt: Date.now(),
		};

		this.activeTasks.set(taskId, task);

		try {
			// Build Pandoc command arguments
			const args = await this.buildPandocCommand(profile, inputFiles, finalOutputPath, metadata);
			const pandocPath = this.getPandocPath();

			if (this.plugin.settings.export?.verboseLogging) {
				console.log('Executing Pandoc:', pandocPath, args);
			}

			// Execute Pandoc
			task.progress = 50;
			const { stdout, stderr } = await execFileAsync(pandocPath, args, {
				maxBuffer: 10 * 1024 * 1024, // 10MB buffer for large outputs
			});

			// Check for warnings in stderr
			const warnings: string[] = [];
			if (stderr) {
				warnings.push(...stderr.split('\n').filter((line) => line.trim()));
			}

			// Update task status
			task.status = 'completed';
			task.progress = 100;
			task.completedAt = Date.now();
			task.warnings = warnings.length > 0 ? warnings : undefined;

			// Update profile last used
			profile.lastUsed = Date.now();
			await this.plugin.saveSettings();

			// Post-process PDF (compression, optimization)
			if (profile.format === 'pdf' && profile.postProcessing?.compression) {
				await this.postProcessPdf(finalOutputPath, profile.postProcessing);
			}

			// Validate EPUB after generation
			if (profile.format === 'epub' && profile.validateEpub) {
				await this.validateEpub(finalOutputPath);
			}

			const duration = Date.now() - startTime;

			return {
				success: true,
				outputPath: finalOutputPath,
				warnings: warnings.length > 0 ? warnings : undefined,
				pandocOutput: stdout || undefined,
				duration,
			};
		} catch (error: any) {
			task.status = 'failed';
			task.error = error.message || 'Unknown error during export';
			task.completedAt = Date.now();

			return {
				success: false,
				error: task.error,
				pandocOutput: error.stdout || error.stderr || undefined,
			};
		}
	}

	/**
	 * Post-process PDF with compression and optimization
	 */
	private async postProcessPdf(pdfPath: string, options: any): Promise<void> {
		const compression = options.compression;
		if (!compression || compression.level === 'none') {
			return;
		}

		try {
			const { PdfCompressor } = await import('./PdfCompressor');
			const compressor = new PdfCompressor(this.plugin);

			// Check if Ghostscript is available
			const gsAvailable = await compressor.checkGhostscriptAvailable();
			if (!gsAvailable) {
				// Show installation modal
				const { GhostscriptInstallModal } = await import('./GhostscriptInstallModal');
				new GhostscriptInstallModal(this.plugin.app).open();
				return;
			}

			// Create temporary output path
			const fs = require('fs');
			const path = require('path');
			const tempPath = `${pdfPath}.compressed.pdf`;

			// Compress PDF
			const result = await compressor.compress(pdfPath, tempPath, compression);

			if (result.success && fs.existsSync(tempPath)) {
				// Replace original with compressed version
				fs.unlinkSync(pdfPath);
				fs.renameSync(tempPath, pdfPath);

				// Show compression results
				const formatBytes = (bytes: number) => {
					if (bytes === 0) return '0 B';
					const k = 1024;
					const sizes = ['B', 'KB', 'MB', 'GB'];
					const i = Math.floor(Math.log(bytes) / Math.log(k));
					return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
				};

				new Notice(
					`PDF compressed: ${formatBytes(result.originalSize)} → ${formatBytes(result.compressedSize)} (${result.reduction}% reduction)`,
					5000,
				);

				if (this.plugin.settings.export?.verboseLogging) {
					console.log(`PDF compression: ${result.reduction}% reduction (${compression.level} level)`);
				}
			} else {
				console.warn('PDF compression failed:', result.error);
			}
		} catch (error) {
			console.error('PDF post-processing error:', error);
		}
	}

	/**
	 * Validate EPUB file after generation
	 */
	private async validateEpub(epubPath: string): Promise<void> {
		try {
			const { EpubValidator } = await import('./EpubValidator');
			const { ValidationResultModal } = await import('./ValidationResultModal');

			const validator = new EpubValidator(this.plugin);

			// Check if EPUBCheck is available
			const epubCheckAvailable = await validator.checkEpubCheckAvailable();
			if (!epubCheckAvailable) {
				// Show installation modal
				const { EpubCheckInstallModal } = await import('./EpubCheckInstallModal');
				new EpubCheckInstallModal(this.plugin.app).open();
				return;
			}

			// Run validation
			new Notice('Validating EPUB file...');
			const result = await validator.validate(epubPath);

			// Show results modal
			new ValidationResultModal(this.plugin.app, result, epubPath).open();
		} catch (error) {
			console.error('EPUB validation error:', error);
			new Notice('EPUB validation failed. See console for details.');
		}
	}

	/**
	 * Build Pandoc command arguments array
	 */
	private async buildPandocCommand(
		profile: ExportProfile,
		inputFiles: string[],
		outputPath: string,
		metadata?: ManuscriptMetadata,
	): Promise<string[]> {
		const options = profile.pandocOptions;
		const args: string[] = [];

		// Input files
		for (const inputFile of inputFiles) {
			args.push(inputFile);
		}

		// Output file
		args.push('-o', outputPath);

		// Format-specific options
		// Do not pass '-t pdf' — Pandoc derives PDF via output extension and pdf-engine.
		// Explicit '-t pdf' can be brittle across Pandoc versions.
		if (profile.format !== 'markdown' && profile.format !== 'pdf') {
			args.push('-t', profile.format);
		}

		// Standalone document
		if (options.standalone !== false) {
			args.push('--standalone');
		}

		// Self-contained (for HTML)
		if (options.selfContained) {
			args.push('--self-contained');
		}

		// Table of contents
		if (options.toc) {
			args.push('--toc');
			if (options.tocDepth) {
				args.push('--toc-depth', options.tocDepth.toString());
			}
		}

		// Number sections
		if (options.numberSections) {
			args.push('--number-sections');
		}

		// PDF engine
		if (profile.format === 'pdf' && options.pdfEngine) {
			args.push('--pdf-engine', options.pdfEngine);
		}

		// Bibliography
		if (options.bibliography && options.bibliography.length > 0) {
			for (const bibFile of options.bibliography) {
				args.push('--bibliography', bibFile);
			}
		}

		// Citation style
		if (options.csl) {
			args.push('--csl', options.csl);
		}

		// Citeproc
		if (options.citeproc !== false) {
			args.push('--citeproc');
		}

		// Filters
		if (options.filters && options.filters.length > 0) {
			for (const filter of options.filters) {
				args.push('--filter', filter);
			}
		}

		if (options.luaFilters && options.luaFilters.length > 0) {
			for (const filter of options.luaFilters) {
				args.push('--lua-filter', filter);
			}
		}

		// Variables
		const allVariables = { ...options.variables };

		// Apply trim size geometry if specified (for PDF books)
		if (profile.format === 'pdf' && profile.trimSize) {
			const trimSize = getTrimSizeById(profile.trimSize);
			if (trimSize) {
				// Estimate page count from input files
				let totalText = '';
				for (const inputFile of inputFiles) {
					try {
						const fs = require('fs');
						const content = fs.readFileSync(inputFile, 'utf-8');
						totalText += content;
					} catch (error) {
						// If we can't read files, use default page count
						console.warn('Could not read file for page count estimation:', inputFile);
					}
				}

				const pageCount = totalText ? estimatePageCount(totalText, trimSize) : 300;
				const geometry = buildGeometry(trimSize, pageCount);

				// Override geometry variable
				allVariables.geometry = geometry;

				if (this.plugin.settings.export?.verboseLogging) {
					console.log(`Trim size ${trimSize.name}: estimated ${pageCount} pages, geometry: ${geometry}`);
				}
			}
		}

		for (const [key, value] of Object.entries(allVariables)) {
			args.push('-V', `${key}=${value}`);
		}

		// Metadata
		const allMetadata = { ...options.metadata };
		if (metadata) {
			// Merge manuscript metadata
			if (metadata.title) allMetadata.title = metadata.title;
			if (metadata.author) allMetadata.author = metadata.author;
			if (metadata.date) allMetadata.date = metadata.date;
			if (metadata.abstract) allMetadata.abstract = metadata.abstract;
			if (metadata.keywords) allMetadata.keywords = metadata.keywords.join(', ');
		}

		// Add LaTeX preamble for custom commands if exporting to PDF
		if (profile.format === 'pdf') {
			const latexPreamble = this.buildLaTeXPreamble();
			if (latexPreamble) {
				allMetadata['header-includes'] = latexPreamble;
			}
		}

		for (const [key, value] of Object.entries(allMetadata)) {
			args.push('-M', `${key}=${JSON.stringify(value)}`);
		}

		// Template
		if (profile.template) {
			args.push('--template', profile.template);
		}

		// Template configuration (new system)
		if (profile.templateConfig) {
			await this.applyTemplateConfiguration(profile.templateConfig, args, allMetadata, metadata);
		}

		// Template variables (legacy system)
		if (profile.templateVariables) {
			for (const [key, value] of Object.entries(profile.templateVariables)) {
				args.push('-V', `${key}=${value}`);
			}
		}

		// CSS for HTML
		if (profile.format === 'html' && options.css && options.css.length > 0) {
			for (const cssFile of options.css) {
				args.push('--css', cssFile);
			}
		}

		// MathJax for HTML
		if (profile.format === 'html' && options.mathJax) {
			args.push('--mathjax');
		}

		// Extra arguments
		if (options.extraArgs && options.extraArgs.length > 0) {
			args.push(...options.extraArgs);
		}

		return args;
	}

	/**
	 * Build LaTeX preamble with custom command definitions
	 * Returns an array of lines for proper YAML formatting
	 */
	private buildLaTeXPreamble(): string[] {
		return [
			'\\usepackage{graphicx}',
			'\\usepackage{eso-pic}',
			'\\newcommand{\\setchapterimage}[2]{\\AddToShipoutPictureBG*{\\AtPageUpperLeft{\\raisebox{-\\height}{\\includegraphics[width=#2]{#1}}}}}',
		];
	}

	/**
	 * Apply template configuration to Pandoc arguments
	 */
	private async applyTemplateConfiguration(
		templateConfigId: string,
		args: string[],
		metadata: Record<string, any>,
		manuscriptMetadata?: ManuscriptMetadata,
	): Promise<void> {
		// Load template configuration
		// In the future, this will load from a template store/manager
		// For now, we'll create a placeholder that can be expanded

		// TODO: Load actual template configuration from storage
		// const config = await this.loadTemplateConfig(templateConfigId);

		// For now, just log that template system is available
		if (this.plugin.settings.export?.verboseLogging) {
			console.log('Template configuration system available, ID:', templateConfigId);
		}

		// When template configurations are loaded, they will:
		// 1. Generate YAML frontmatter via YAMLGenerator
		// 2. Generate LaTeX header-includes via LaTeXGenerator
		// 3. Apply to args and metadata

		// Example implementation (will be activated when template storage is ready):
		/*
		const yamlGen = new YAMLGenerator();
		const latexGen = new LaTeXGenerator();

		// Generate YAML and write to temporary file
		const yaml = yamlGen.generate(config, manuscriptMetadata);
		const yamlPath = await this.writeTempYAMLFile(yaml);
		args.push('--metadata-file', yamlPath);

		// Generate LaTeX header-includes
		const latex = latexGen.generate(config);
		metadata['header-includes'] = latex.split('\n');
		*/
	}

	/**
	 * Generate output path from profile and metadata
	 */
	private async generateOutputPath(profile: ExportProfile, metadata?: ManuscriptMetadata): Promise<string> {
		// Use configured output directory or vault root
		const vaultPath = (this.plugin.app.vault.adapter as any).basePath || '';
		const outputDir = this.plugin.settings.export?.defaultOutputDir || vaultPath;

		// Build filename from pattern
		let filename = profile.filenamePattern || `output.${profile.format}`;

		// Replace placeholders
		filename = filename.replace(/\$\{title\}/g, metadata?.title || 'manuscript');
		filename = filename.replace(/\$\{author\}/g, metadata?.author || 'author');
		filename = filename.replace(/\$\{date\}/g, metadata?.date || new Date().toISOString().split('T')[0]);

		// Sanitize filename
		filename = filename.replace(/[<>:"/\\|?*]/g, '-');

		return path.join(outputDir, filename);
	}

	/**
	 * Get active export tasks
	 */
	getActiveTasks(): ExportTask[] {
		return Array.from(this.activeTasks.values());
	}

	/**
	 * Cancel an export task
	 */
	cancelTask(taskId: string): boolean {
		const task = this.activeTasks.get(taskId);
		if (task && task.status === 'running') {
			task.status = 'cancelled';
			task.completedAt = Date.now();
			return true;
		}
		return false;
	}

	/**
	 * Clear completed tasks
	 */
	clearCompletedTasks(): void {
		for (const [id, task] of this.activeTasks.entries()) {
			if (task.status === 'completed' || task.status === 'failed' || task.status === 'cancelled') {
				this.activeTasks.delete(id);
			}
		}
	}

	/**
	 * Extract metadata from manuscript files
	 */
	async extractMetadata(files: TFile[]): Promise<ManuscriptMetadata> {
		const metadata: ManuscriptMetadata = {};

		// Read first file to extract YAML frontmatter
		if (files.length > 0) {
			const content = await this.plugin.app.vault.read(files[0]);
			const yamlMatch = content.match(/^---\n([\s\S]*?)\n---/);

			if (yamlMatch) {
				const yamlContent = yamlMatch[1];
				const lines = yamlContent.split('\n');

				for (const line of lines) {
					const match = line.match(/^(\w+):\s*(.+)$/);
					if (match) {
						const [, key, value] = match;
						const cleanValue = value.replace(/^["']|["']$/g, '');

						switch (key.toLowerCase()) {
							case 'title':
								metadata.title = cleanValue;
								break;
							case 'author':
								metadata.author = cleanValue;
								break;
							case 'date':
								metadata.date = cleanValue;
								break;
							case 'abstract':
								metadata.abstract = cleanValue;
								break;
							case 'keywords':
								metadata.keywords = cleanValue.split(',').map((k) => k.trim());
								break;
							case 'affiliation':
								metadata.affiliation = cleanValue;
								break;
							case 'email':
								metadata.email = cleanValue;
								break;
						}
					}
				}
			}
		}

		return metadata;
	}

	/**
	 * Get Pandoc version
	 */
	getPandocVersion(): string | null {
		return this.pandocVersion;
	}
}
