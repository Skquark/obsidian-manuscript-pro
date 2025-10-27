/**
 * Export Manager
 * Manages export profiles, templates, and coordinates export operations
 */

import { Notice, TFile } from 'obsidian';
import * as path from 'path';
import type LatexPandocConcealerPlugin from '../main';
import { ExportEngine } from './ExportEngine';
import type {
	ExportProfile,
	ExportResult,
	TemplateInfo,
	BatchExportOptions,
	BatchExportResult,
	ExportFormat,
	ExportProfileVariant,
} from './ExportInterfaces';
import { DEFAULT_EXPORT_PROFILES } from './ExportInterfaces';

export class ExportManager {
	private exportEngine: ExportEngine;
	private profiles: Map<string, ExportProfile> = new Map();
	private templates: Map<string, TemplateInfo> = new Map();

	constructor(private plugin: LatexPandocConcealerPlugin) {
		this.exportEngine = new ExportEngine(plugin);
		this.loadProfiles();
	}

	/**
	 * Initialize export manager
	 */
	async initialize(): Promise<void> {
		// Check Pandoc availability silently
		// Errors will be shown when user actually tries to export
		const pandocAvailable = await this.exportEngine.checkPandocAvailable();
		if (pandocAvailable) {
			const version = this.exportEngine.getPandocVersion();
			if (this.plugin.settings.debugMode) {
				console.log(`Export Manager initialized with Pandoc ${version}`);
			}
		}

		// Load templates
		await this.loadTemplates();
	}

	/**
	 * Load export profiles from settings
	 */
	private loadProfiles(): void {
		this.profiles.clear();

		// Load built-in profiles
		for (const profile of DEFAULT_EXPORT_PROFILES) {
			this.profiles.set(profile.id, profile);
		}

		// Load custom profiles from settings
		const customProfiles = this.plugin.settings.export?.profiles || [];
		for (const profile of customProfiles) {
			if (!profile.isBuiltIn) {
				this.profiles.set(profile.id, profile);
			}
		}
	}

	/**
	 * Load available templates
	 */
	private async loadTemplates(): Promise<void> {
		this.templates.clear();

		// Built-in templates would be loaded here
		// For now, we'll rely on Pandoc's default templates
	}

	/**
	 * Get all export profiles
	 */
	getProfiles(): ExportProfile[] {
		return Array.from(this.profiles.values());
	}

	/**
	 * Get profile by ID
	 */
	getProfile(id: string): ExportProfile | undefined {
		return this.profiles.get(id);
	}

	/**
	 * Get default profile
	 */
	getDefaultProfile(): ExportProfile {
		const defaultId = this.plugin.settings.export?.defaultProfileId;
		if (defaultId) {
			const profile = this.profiles.get(defaultId);
			if (profile) return profile;
		}

		// Return first profile as fallback
		return this.profiles.values().next().value;
	}

	/**
	 * Add or update profile
	 */
	async saveProfile(profile: ExportProfile): Promise<void> {
		this.profiles.set(profile.id, profile);

		// Save to settings (only custom profiles)
		if (!profile.isBuiltIn) {
			const customProfiles = Array.from(this.profiles.values()).filter((p) => !p.isBuiltIn);
			this.plugin.settings.export = this.plugin.settings.export || {
				enabled: true,
				openAfterExport: true,
				maxConcurrentExports: 3,
				keepIntermediateFiles: false,
				verboseLogging: false,
				profiles: [],
			};
			this.plugin.settings.export.profiles = customProfiles;
			await this.plugin.saveSettings();
		}
	}

	/**
	 * Delete profile
	 */
	async deleteProfile(id: string): Promise<boolean> {
		const profile = this.profiles.get(id);
		if (!profile || profile.isBuiltIn) {
			return false; // Cannot delete built-in profiles
		}

		this.profiles.delete(id);

		// Update settings
		const customProfiles = Array.from(this.profiles.values()).filter((p) => !p.isBuiltIn);
		if (this.plugin.settings.export) {
			this.plugin.settings.export.profiles = customProfiles;
			await this.plugin.saveSettings();
		}

		return true;
	}

	/**
	 * Export current file
	 */
	async exportCurrentFile(profileId?: string): Promise<ExportResult> {
		const activeFile = this.plugin.app.workspace.getActiveFile();
		if (!activeFile) {
			return {
				success: false,
				error: 'No active file to export',
			};
		}

		return this.exportFiles([activeFile], profileId);
	}

	/**
	 * Export multiple files
	 */
	async exportFiles(files: TFile[], profileId?: string, outputPath?: string): Promise<ExportResult> {
		// Check if Pandoc is available before attempting export
		const pandocAvailable = await this.exportEngine.checkPandocAvailable();
		if (!pandocAvailable) {
			// Show installation modal instead of just an error
			const { PandocInstallModal } = await import('./PandocInstallModal');
			new PandocInstallModal(this.plugin.app).open();
			return {
				success: false,
				error: 'Pandoc not found',
			};
		}

		// Get profile
		const profile = profileId ? this.getProfile(profileId) : this.getDefaultProfile();
		if (!profile) {
			return {
				success: false,
				error: 'No export profile found',
			};
		}

		// Show progress notice
		new Notice(`Exporting to ${profile.format.toUpperCase()}...`);

		// Get file paths (use adapter's basePath to construct full paths)
		const vaultPath = (this.plugin.app.vault.adapter as any).basePath || '';
		const inputPaths = files.map((f) => `${vaultPath}/${f.path}`);

		// Extract metadata
		const metadata = await this.exportEngine.extractMetadata(files);

		// Auto-detect bibliography files if not already configured
		if (!profile.pandocOptions.bibliography || profile.pandocOptions.bibliography.length === 0) {
			// Try to discover bibliography from the first file
			if (files.length > 0) {
				const bibPaths = await this.plugin.bibliographyManager.discoverBibliography(files[0]);
				if (bibPaths.length > 0) {
					// Convert to absolute paths
					profile.pandocOptions.bibliography = bibPaths.map((bibPath) => {
						// If path is relative, resolve it relative to vault
						if (!bibPath.startsWith('/') && !bibPath.match(/^[A-Z]:/)) {
							return `${vaultPath}/${bibPath}`;
						}
						return bibPath;
					});
				}
			}
		}

		// Perform export
		const result = await this.exportEngine.exportManuscript(profile, inputPaths, outputPath, metadata);

		// Show result
		if (result.success) {
			const message = `Export completed: ${result.outputPath}`;
			new Notice(message);

			// Open file if configured
			if (this.plugin.settings.export?.openAfterExport && result.outputPath) {
				await this.openExportedFile(result.outputPath);
			}

			// Show warnings if any
			if (result.warnings && result.warnings.length > 0) {
				console.warn('Export warnings:', result.warnings);
			}
		} else {
			// Check if error is due to missing LaTeX engine
			const errorText = (result.error || '') + (result.pandocOutput || '');

			if (
				errorText.includes('pdflatex not found') ||
				errorText.includes('xelatex not found') ||
				errorText.includes('lualatex not found')
			) {
				// Show LaTeX installation modal
				const { LaTeXInstallModal } = await import('./LaTeXInstallModal');
				new LaTeXInstallModal(this.plugin.app).open();
			} else if (errorText.includes('MiKTeX updates') || errorText.includes(".sty' not found")) {
				// MiKTeX package installation issue
				new Notice(
					'MiKTeX needs to install packages. Please open MiKTeX Console, check for updates, and set "Install missing packages" to "Yes" in Settings.',
					10000,
				);
			} else if (errorText.includes('Undefined control sequence') && errorText.includes('setchapterimage')) {
				// Custom LaTeX command not supported
				new Notice(
					'Your document contains custom LaTeX commands (like \\setchapterimage) that require a custom LaTeX template. Try exporting to DOCX or Markdown instead.',
					10000,
				);
			} else {
				const message = `Export failed: ${result.error}`;
				new Notice(message, 8000);
			}
			console.error('Export error:', result.error);
			if (result.pandocOutput) {
				console.error('Pandoc output:', result.pandocOutput);
			}
		}

		return result;
	}

	/**
	 * Export manuscript (book.json configuration)
	 */
	async exportManuscript(profileId?: string): Promise<ExportResult> {
		// Check if manuscript navigator is available
		if (!this.plugin.manuscriptNavigator) {
			return {
				success: false,
				error: 'Manuscript Navigator not initialized',
			};
		}

		// Get manuscript structure
		const structure = this.plugin.manuscriptNavigator.getStructure();
		if (!structure) {
			return {
				success: false,
				error: 'No manuscript structure found. Please configure book.json.',
			};
		}

		// Collect all chapter files in order
		const files: TFile[] = [];

		// Add chapters from structure.chapters (main chapters array)
		if (structure.chapters && structure.chapters.length > 0) {
			for (const chapter of structure.chapters) {
				if (chapter.included && chapter.file) {
					const file = this.plugin.app.vault.getAbstractFileByPath(chapter.file);
					if (file instanceof TFile) {
						files.push(file);
					}
				}
			}
		}

		// If using parts structure instead
		if (structure.parts && structure.parts.length > 0 && files.length === 0) {
			for (const part of structure.parts) {
				// parts.chapters contains chapter IDs, need to look them up
				for (const chapterId of part.chapters) {
					const chapter = structure.chapters?.find((c) => c.id === chapterId);
					if (chapter && chapter.included && chapter.file) {
						const file = this.plugin.app.vault.getAbstractFileByPath(chapter.file);
						if (file instanceof TFile) {
							files.push(file);
						}
					}
				}
			}
		}

		if (files.length === 0) {
			return {
				success: false,
				error: 'No chapter files found in manuscript',
			};
		}

		return this.exportFiles(files, profileId);
	}

	/**
	 * Open exported file in default application
	 */
	private async openExportedFile(path: string): Promise<void> {
		try {
			// Use Electron's shell to open file
			const { shell } = require('electron');
			await shell.openPath(path);
		} catch (error) {
			console.error('Failed to open exported file:', error);
		}
	}

	/**
	 * Get available templates
	 */
	getTemplates(): TemplateInfo[] {
		return Array.from(this.templates.values());
	}

	/**
	 * Get template by ID
	 */
	getTemplate(id: string): TemplateInfo | undefined {
		return this.templates.get(id);
	}

	/**
	 * Get active export tasks
	 */
	getActiveTasks() {
		return this.exportEngine.getActiveTasks();
	}

	/**
	 * Cancel export task
	 */
	cancelTask(taskId: string): boolean {
		return this.exportEngine.cancelTask(taskId);
	}

	/**
	 * Clear completed tasks
	 */
	clearCompletedTasks(): void {
		this.exportEngine.clearCompletedTasks();
	}

	/**
	 * Export to multiple formats in batch
	 */
	async exportMultipleFormats(
		options: BatchExportOptions,
		inputFiles: TFile[],
		metadata?: any,
	): Promise<BatchExportResult> {
		const results = new Map<ExportFormat, ExportResult>();
		const startTime = Date.now();

		// Check Pandoc availability first
		const pandocAvailable = await this.exportEngine.checkPandocAvailable();
		if (!pandocAvailable) {
			const { PandocInstallModal } = await import('./PandocInstallModal');
			new PandocInstallModal(this.plugin.app).open();
			return {
				results,
				totalDuration: 0,
				successCount: 0,
				failureCount: options.formats.length,
			};
		}

		// Get file paths
		const vaultPath = (this.plugin.app.vault.adapter as any).basePath || '';
		const inputPaths = inputFiles.map((f) => `${vaultPath}/${f.path}`);

		// Extract metadata if not provided
		const exportMetadata = metadata || (await this.exportEngine.extractMetadata(inputFiles));

		// Show initial progress
		new Notice(`Batch export started: ${options.formats.length} formats`, 3000);

		for (const format of options.formats) {
			// Create format-specific profile
			const profile: ExportProfile = {
				...options.baseProfile,
				format,
				...(options.formatOverrides?.[format] || {}),
			};

			const outputPath = path.join(options.outputDirectory, `${options.filenameBase}.${format}`);

			// Show current format
			new Notice(`Exporting ${format.toUpperCase()}...`, 2000);

			// Export this format
			const result = await this.exportEngine.exportManuscript(profile, inputPaths, outputPath, exportMetadata);

			results.set(format, result);

			// Stop on critical failures if configured
			if (!result.success && this.plugin.settings.export?.verboseLogging) {
				console.error(`Batch export: ${format} failed:`, result.error);
			}
		}

		const totalDuration = Date.now() - startTime;
		const successCount = Array.from(results.values()).filter((r) => r.success).length;
		const failureCount = Array.from(results.values()).filter((r) => !r.success).length;

		// Show completion summary
		if (successCount === options.formats.length) {
			new Notice(`✓ Batch export completed: ${successCount}/${options.formats.length} formats`, 5000);
		} else if (successCount > 0) {
			new Notice(`⚠ Batch export completed with errors: ${successCount}/${options.formats.length} succeeded`, 8000);
		} else {
			new Notice(`✗ Batch export failed: All formats failed`, 8000);
		}

		return {
			results,
			totalDuration,
			successCount,
			failureCount,
		};
	}

	/**
	 * Filter files by profile variant (test/sample/full builds)
	 */
	private filterFilesByVariant(files: TFile[], variant?: ExportProfileVariant): TFile[] {
		if (!variant || variant.chapterSelection.type === 'all') {
			return files;
		}

		const selection = variant.chapterSelection;

		switch (selection.type) {
			case 'count':
				return files.slice(0, selection.count);

			case 'range':
				return files.slice(selection.start - 1, selection.end);

			case 'percentage':
				const count = Math.ceil((files.length * selection.percentage) / 100);
				return files.slice(0, count);

			case 'custom':
				return files.filter((f) => selection.chapterIds.includes(f.basename));

			default:
				return files;
		}
	}

	/**
	 * Export with variant filtering applied
	 */
	async exportWithVariant(files: TFile[], profileId?: string, variant?: ExportProfileVariant): Promise<ExportResult> {
		// Apply variant filtering
		const filteredFiles = this.filterFilesByVariant(files, variant);

		if (filteredFiles.length === 0) {
			return {
				success: false,
				error: 'No files match the variant selection',
			};
		}

		// Show info about filtered files
		if (variant && variant.chapterSelection.type !== 'all') {
			new Notice(`${variant.name}: Exporting ${filteredFiles.length}/${files.length} chapters`, 3000);
		}

		return this.exportFiles(filteredFiles, profileId);
	}

	/**
	 * Quick test export (first 3 chapters)
	 */
	async quickTestExport(): Promise<ExportResult> {
		// Get manuscript files
		if (!this.plugin.manuscriptNavigator) {
			return {
				success: false,
				error: 'Manuscript Navigator not initialized',
			};
		}

		const structure = this.plugin.manuscriptNavigator.getStructure();
		if (!structure) {
			return {
				success: false,
				error: 'No manuscript structure found',
			};
		}

		// Collect all chapter files
		const files: TFile[] = [];
		if (structure.chapters && structure.chapters.length > 0) {
			for (const chapter of structure.chapters) {
				if (chapter.included && chapter.file) {
					const file = this.plugin.app.vault.getAbstractFileByPath(chapter.file);
					if (file instanceof TFile) {
						files.push(file);
					}
				}
			}
		}

		if (files.length === 0) {
			return {
				success: false,
				error: 'No chapter files found',
			};
		}

		// Apply test variant (first 3 chapters)
		const testVariant: ExportProfileVariant = {
			id: 'test',
			name: 'Test Build (First 3 Chapters)',
			chapterSelection: { type: 'count', count: 3 },
		};

		return this.exportWithVariant(files, undefined, testVariant);
	}
}
