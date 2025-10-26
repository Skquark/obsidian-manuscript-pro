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
import * as fs from 'fs/promises';
import type LatexPandocConcealerPlugin from '../main';
import type {
	ExportProfile,
	ExportTask,
	ExportResult,
	ExportStatus,
	PandocOptions,
	ManuscriptMetadata,
} from './ExportInterfaces';

const execFileAsync = promisify(execFile);

export class ExportEngine {
	private activeTasks: Map<string, ExportTask> = new Map();
	private pandocVersion: string | null = null;

	constructor(private plugin: LatexPandocConcealerPlugin) {}

	/**
	 * Check if Pandoc is available
	 */
	async checkPandocAvailable(): Promise<boolean> {
		try {
			// Check if Node.js APIs are available
			if (typeof execFile === 'undefined') {
				new Notice(
					'Export feature requires Node.js integration. This may not be available in your Obsidian environment.',
				);
				console.error('Node.js child_process API not available');
				return false;
			}

			const pandocPath = this.getPandocPath();
			const { stdout } = await execFileAsync(pandocPath, ['--version']);

			// Parse version from output
			const versionMatch = stdout.match(/pandoc\s+([\d.]+)/);
			if (versionMatch) {
				this.pandocVersion = versionMatch[1];
				console.log(`Pandoc version ${this.pandocVersion} detected`);
				return true;
			}

			return false;
		} catch (error) {
			console.error('Pandoc not found:', error);
			new Notice('Pandoc not found. Please install Pandoc from https://pandoc.org');
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
		if (profile.format !== 'markdown') {
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
		if (options.variables) {
			for (const [key, value] of Object.entries(options.variables)) {
				args.push('-V', `${key}=${value}`);
			}
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

		for (const [key, value] of Object.entries(allMetadata)) {
			args.push('-M', `${key}=${JSON.stringify(value)}`);
		}

		// Template
		if (profile.template) {
			args.push('--template', profile.template);
		}

		// Template variables
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
