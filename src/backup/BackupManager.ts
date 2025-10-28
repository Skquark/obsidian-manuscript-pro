import { App, Notice, TFolder, TFile } from 'obsidian';
import ManuscriptProPlugin from '../main';

/**
 * Backup data structure
 */
export interface BackupData {
	metadata: {
		timestamp: number;
		date: string;
		pluginVersion: string;
		obsidianVersion: string;
	};
	settings?: any;
	data?: {
		characters?: Record<string, any>;
		research?: {
			notes: Record<string, any>;
			folders: Record<string, any>;
		};
		timeline?: Record<string, any>;
		outliner?: Record<string, any>;
		panelWorkspaces?: Record<string, any>;
	};
}

/**
 * Backup file metadata
 */
export interface BackupFileInfo {
	filename: string;
	timestamp: number;
	date: string;
	size: number;
}

/**
 * Manages automatic backups of plugin data
 */
export class BackupManager {
	private app: App;
	private plugin: ManuscriptProPlugin;
	private backupInterval: number | null = null;

	constructor(app: App, plugin: ManuscriptProPlugin) {
		this.app = app;
		this.plugin = plugin;
	}

	/**
	 * Start the auto-backup system
	 */
	async start(): Promise<void> {
		if (!this.plugin.settings.backup.enabled) {
			return;
		}

		// Stop any existing interval
		this.stop();

		// Convert minutes to milliseconds
		const intervalMs = this.plugin.settings.backup.interval * 60 * 1000;

		// Start interval
		this.backupInterval = window.setInterval(() => {
			this.performBackup();
		}, intervalMs);

		// Perform initial backup if it's been a while
		const lastBackup = this.plugin.settings.backup.lastBackupTime || 0;
		const timeSinceLastBackup = Date.now() - lastBackup;

		if (timeSinceLastBackup > intervalMs) {
			await this.performBackup();
		}

		if (this.plugin.settings.debugMode) {
			console.log(`Manuscript Pro: Auto-backup started (interval: ${this.plugin.settings.backup.interval} minutes)`);
		}
	}

	/**
	 * Stop the auto-backup system
	 */
	stop(): void {
		if (this.backupInterval !== null) {
			window.clearInterval(this.backupInterval);
			this.backupInterval = null;

			if (this.plugin.settings.debugMode) {
				console.log('Manuscript Pro: Auto-backup stopped');
			}
		}
	}

	/**
	 * Perform a backup now
	 */
	async performBackup(): Promise<boolean> {
		try {
			const backupData = this.collectBackupData();
			const filename = await this.saveBackup(backupData);

			// Update last backup time
			this.plugin.settings.backup.lastBackupTime = Date.now();
			await this.plugin.saveSettings();

			// Clean up old backups
			await this.cleanupOldBackups();

			if (this.plugin.settings.debugMode) {
				console.log(`Manuscript Pro: Backup created: ${filename}`);
			}

			return true;
		} catch (error) {
			console.error('Manuscript Pro: Backup failed:', error);
			new Notice('Failed to create backup');
			return false;
		}
	}

	/**
	 * Collect all data for backup
	 */
	private collectBackupData(): BackupData {
		const backup: BackupData = {
			metadata: {
				timestamp: Date.now(),
				date: new Date().toISOString(),
				pluginVersion: this.plugin.manifest.version,
				obsidianVersion: (this.app as any).appVersion || 'unknown',
			},
		};

		// Include settings if enabled
		if (this.plugin.settings.backup.includeSettings) {
			backup.settings = this.plugin.settings;
		}

		// Include plugin data if enabled
		if (this.plugin.settings.backup.includeData) {
			backup.data = {
				characters: this.plugin.settings.characters?.charactersData || {},
				research: {
					notes: this.plugin.settings.research?.researchNotes || {},
					folders: this.plugin.settings.research?.researchFolders || {},
				},
				timeline: this.plugin.settings.timeline?.events || {},
				outliner: this.plugin.settings.outliner?.manuscriptStructures || {},
				panelWorkspaces: this.plugin.settings.panelManagement?.panelWorkspaces || {},
			};
		}

		return backup;
	}

	/**
	 * Save backup to file
	 */
	private async saveBackup(backupData: BackupData): Promise<string> {
		// Ensure backup directory exists
		const backupDir = this.plugin.settings.backup.backupDirectory;
		await this.ensureBackupDirectoryExists(backupDir);

		// Generate filename with timestamp
		const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
		const time = new Date().toISOString().split('T')[1].split('.')[0].replace(/:/g, '-');
		const filename = `${backupDir}/backup-${timestamp}-${time}.json`;

		// Save to file
		const content = JSON.stringify(backupData, null, 2);
		await this.app.vault.create(filename, content);

		return filename;
	}

	/**
	 * Ensure backup directory exists
	 */
	private async ensureBackupDirectoryExists(dirPath: string): Promise<void> {
		const folder = this.app.vault.getAbstractFileByPath(dirPath);

		if (!folder) {
			await this.app.vault.createFolder(dirPath);
		}
	}

	/**
	 * Clean up old backups based on maxBackups setting
	 */
	private async cleanupOldBackups(): Promise<void> {
		const backupDir = this.plugin.settings.backup.backupDirectory;
		const folder = this.app.vault.getAbstractFileByPath(backupDir);

		if (!(folder instanceof TFolder)) {
			return;
		}

		// Get all backup files
		const backupFiles = folder.children.filter(
			(file) => file instanceof TFile && file.extension === 'json'
		) as TFile[];

		// Sort by modification time (newest first)
		backupFiles.sort((a, b) => b.stat.mtime - a.stat.mtime);

		// Delete old backups beyond maxBackups
		const maxBackups = this.plugin.settings.backup.maxBackups;
		const filesToDelete = backupFiles.slice(maxBackups);

		for (const file of filesToDelete) {
			await this.app.vault.delete(file);

			if (this.plugin.settings.debugMode) {
				console.log(`Manuscript Pro: Deleted old backup: ${file.path}`);
			}
		}
	}

	/**
	 * Get list of available backups
	 */
	async getBackupList(): Promise<BackupFileInfo[]> {
		const backupDir = this.plugin.settings.backup.backupDirectory;
		const folder = this.app.vault.getAbstractFileByPath(backupDir);

		if (!(folder instanceof TFolder)) {
			return [];
		}

		const backupFiles = folder.children.filter(
			(file) => file instanceof TFile && file.extension === 'json'
		) as TFile[];

		// Sort by modification time (newest first)
		backupFiles.sort((a, b) => b.stat.mtime - a.stat.mtime);

		return backupFiles.map((file) => ({
			filename: file.name,
			timestamp: file.stat.mtime,
			date: new Date(file.stat.mtime).toLocaleString(),
			size: file.stat.size,
		}));
	}

	/**
	 * Restore from a backup file
	 */
	async restoreBackup(filename: string): Promise<boolean> {
		try {
			const backupDir = this.plugin.settings.backup.backupDirectory;
			const filePath = `${backupDir}/${filename}`;
			const file = this.app.vault.getAbstractFileByPath(filePath);

			if (!(file instanceof TFile)) {
				new Notice('Backup file not found');
				return false;
			}

			const content = await this.app.vault.read(file);
			const backupData: BackupData = JSON.parse(content);

			// Restore settings if included
			if (backupData.settings) {
				this.plugin.settings = backupData.settings;
			}

			// Restore data if included
			if (backupData.data) {
				if (backupData.data.characters && this.plugin.characterManager) {
					this.plugin.characterManager.loadCharacters(backupData.data.characters);
					this.plugin.settings.characters = this.plugin.settings.characters || {} as any;
					this.plugin.settings.characters.charactersData = backupData.data.characters;
				}

				if (backupData.data.research && this.plugin.researchManager) {
					if (backupData.data.research.notes) {
						this.plugin.researchManager.loadNotes(backupData.data.research.notes);
						this.plugin.settings.research = this.plugin.settings.research || {} as any;
						this.plugin.settings.research.researchNotes = backupData.data.research.notes;
					}
					if (backupData.data.research.folders) {
						this.plugin.researchManager.loadFolders(backupData.data.research.folders);
						this.plugin.settings.research.researchFolders = backupData.data.research.folders;
					}
				}

				if (backupData.data.timeline && this.plugin.timelineManager) {
					this.plugin.timelineManager.loadEvents(backupData.data.timeline);
					this.plugin.settings.timeline = this.plugin.settings.timeline || {} as any;
					this.plugin.settings.timeline.events = backupData.data.timeline;
				}

				if (backupData.data.outliner && this.plugin.outlinerManager) {
					this.plugin.outlinerManager.loadStructures(backupData.data.outliner);
					this.plugin.settings.outliner = this.plugin.settings.outliner || {} as any;
					this.plugin.settings.outliner.manuscriptStructures = backupData.data.outliner;
				}

				if (backupData.data.panelWorkspaces) {
					this.plugin.settings.panelManagement = this.plugin.settings.panelManagement || {} as any;
					this.plugin.settings.panelManagement.panelWorkspaces = backupData.data.panelWorkspaces;
				}
			}

			await this.plugin.saveSettings();

			new Notice(`Backup restored from ${backupData.metadata.date}`);
			return true;
		} catch (error) {
			console.error('Manuscript Pro: Restore failed:', error);
			new Notice('Failed to restore backup');
			return false;
		}
	}

	/**
	 * Delete a backup file
	 */
	async deleteBackup(filename: string): Promise<boolean> {
		try {
			const backupDir = this.plugin.settings.backup.backupDirectory;
			const filePath = `${backupDir}/${filename}`;
			const file = this.app.vault.getAbstractFileByPath(filePath);

			if (!(file instanceof TFile)) {
				new Notice('Backup file not found');
				return false;
			}

			await this.app.vault.delete(file);
			new Notice('Backup deleted');
			return true;
		} catch (error) {
			console.error('Manuscript Pro: Delete backup failed:', error);
			new Notice('Failed to delete backup');
			return false;
		}
	}

	/**
	 * Export backup data as downloadable JSON
	 */
	async exportBackupAsDownload(): Promise<void> {
		const backupData = this.collectBackupData();
		const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
		const filename = `manuscript-pro-backup-${timestamp}.json`;

		const jsonContent = JSON.stringify(backupData, null, 2);
		const blob = new Blob([jsonContent], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = filename;
		link.click();
		URL.revokeObjectURL(url);

		new Notice(`Backup exported as ${filename}`);
	}
}
