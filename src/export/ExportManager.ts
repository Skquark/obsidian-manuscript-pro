/**
 * Export Manager
 * Manages export profiles, templates, and coordinates export operations
 */

import { Notice, TFile } from 'obsidian';
import type LatexPandocConcealerPlugin from '../main';
import { ExportEngine } from './ExportEngine';
import type {
	ExportProfile,
	ExportResult,
	TemplateInfo,
	ManuscriptMetadata,
	DEFAULT_EXPORT_PROFILES,
} from './ExportInterfaces';

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
		// Check Pandoc availability
		const pandocAvailable = await this.exportEngine.checkPandocAvailable();
		if (!pandocAvailable) {
			console.warn('Pandoc not detected. Export functionality will be limited.');
			new Notice('Pandoc not found. Please install Pandoc to enable export features.');
		} else {
			const version = this.exportEngine.getPandocVersion();
			console.log(`Export Manager initialized with Pandoc ${version}`);
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
		const { DEFAULT_EXPORT_PROFILES } = require('./ExportInterfaces');
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
			const message = `Export failed: ${result.error}`;
			new Notice(message);
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
}
