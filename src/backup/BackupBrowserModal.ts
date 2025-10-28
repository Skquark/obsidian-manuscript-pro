import { App, Modal, Notice, setIcon } from 'obsidian';
import ManuscriptProPlugin from '../main';
import type { BackupFileInfo } from './BackupManager';

/**
 * Modal for browsing and managing backups
 */
export class BackupBrowserModal extends Modal {
	plugin: ManuscriptProPlugin;
	backupList: BackupFileInfo[] = [];

	constructor(app: App, plugin: ManuscriptProPlugin) {
		super(app);
		this.plugin = plugin;
	}

	async onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass('mp-backup-browser');

		// Header
		const header = contentEl.createDiv({ cls: 'mp-backup-header' });
		header.createEl('h2', { text: 'Backup Manager' });

		const headerActions = header.createDiv({ cls: 'mp-backup-header-actions' });

		const refreshBtn = headerActions.createEl('button', {
			text: 'Refresh',
			cls: 'mod-cta',
		});
		refreshBtn.addEventListener('click', async () => {
			await this.loadBackupList();
			this.renderBackupList();
		});

		const createBtn = headerActions.createEl('button', {
			text: 'Create Backup Now',
			cls: 'mod-cta',
		});
		createBtn.addEventListener('click', async () => {
			if (this.plugin.backupManager) {
				const success = await this.plugin.backupManager.performBackup();
				if (success) {
					await this.loadBackupList();
					this.renderBackupList();
				}
			}
		});

		// Stats
		const stats = contentEl.createDiv({ cls: 'mp-backup-stats' });
		await this.renderStats(stats);

		// Backup list container
		const listContainer = contentEl.createDiv({ cls: 'mp-backup-list-container' });
		this.backupListContainer = listContainer;

		// Load and render backup list
		await this.loadBackupList();
		this.renderBackupList();

		// Add styles
		this.addStyles();
	}

	private backupListContainer!: HTMLElement;

	private async loadBackupList(): Promise<void> {
		if (!this.plugin.backupManager) {
			this.backupList = [];
			return;
		}

		this.backupList = await this.plugin.backupManager.getBackupList();
	}

	private async renderStats(container: HTMLElement): Promise<void> {
		container.empty();

		const totalBackups = this.backupList.length;
		const maxBackups = this.plugin.settings.backup.maxBackups;
		const backupInterval = this.plugin.settings.backup.interval;
		const lastBackupTime = this.plugin.settings.backup.lastBackupTime;

		const statsGrid = container.createDiv({ cls: 'mp-stats-grid' });

		// Total backups
		const totalStat = statsGrid.createDiv({ cls: 'mp-stat' });
		totalStat.createEl('div', { text: String(totalBackups), cls: 'mp-stat-value' });
		totalStat.createEl('div', { text: `of ${maxBackups} backups`, cls: 'mp-stat-label' });

		// Interval
		const intervalStat = statsGrid.createDiv({ cls: 'mp-stat' });
		intervalStat.createEl('div', { text: `${backupInterval}m`, cls: 'mp-stat-value' });
		intervalStat.createEl('div', { text: 'interval', cls: 'mp-stat-label' });

		// Last backup
		const lastBackupStat = statsGrid.createDiv({ cls: 'mp-stat' });
		if (lastBackupTime) {
			const timeSince = Date.now() - lastBackupTime;
			const minutesSince = Math.floor(timeSince / (1000 * 60));
			const hoursSince = Math.floor(minutesSince / 60);

			let timeText = '';
			if (hoursSince > 0) {
				timeText = `${hoursSince}h ago`;
			} else {
				timeText = `${minutesSince}m ago`;
			}

			lastBackupStat.createEl('div', { text: timeText, cls: 'mp-stat-value' });
		} else {
			lastBackupStat.createEl('div', { text: 'Never', cls: 'mp-stat-value' });
		}
		lastBackupStat.createEl('div', { text: 'last backup', cls: 'mp-stat-label' });
	}

	private renderBackupList(): void {
		this.backupListContainer.empty();

		if (this.backupList.length === 0) {
			const emptyState = this.backupListContainer.createDiv({ cls: 'mp-empty-state' });
			emptyState.createEl('p', { text: 'No backups found' });
			emptyState.createEl('p', {
				text: 'Backups are created automatically every ' + this.plugin.settings.backup.interval + ' minutes',
				cls: 'mp-empty-hint',
			});
			return;
		}

		const table = this.backupListContainer.createEl('table', { cls: 'mp-backup-table' });

		// Header
		const thead = table.createEl('thead');
		const headerRow = thead.createEl('tr');
		headerRow.createEl('th', { text: 'Date & Time' });
		headerRow.createEl('th', { text: 'Size' });
		headerRow.createEl('th', { text: 'Actions' });

		// Body
		const tbody = table.createEl('tbody');

		this.backupList.forEach((backup) => {
			const row = tbody.createEl('tr');

			// Date column
			const dateCell = row.createEl('td');
			dateCell.createEl('div', { text: backup.date, cls: 'mp-backup-date' });
			dateCell.createEl('div', { text: backup.filename, cls: 'mp-backup-filename' });

			// Size column
			const sizeCell = row.createEl('td');
			const sizeKB = (backup.size / 1024).toFixed(1);
			sizeCell.textContent = `${sizeKB} KB`;

			// Actions column
			const actionsCell = row.createEl('td', { cls: 'mp-backup-actions' });

			const restoreBtn = actionsCell.createEl('button', {
				text: 'Restore',
				cls: 'mod-warning',
			});
			restoreBtn.addEventListener('click', async () => {
				await this.restoreBackup(backup);
			});

			const deleteBtn = actionsCell.createEl('button', {
				text: 'Delete',
				cls: 'mod-danger',
			});
			deleteBtn.addEventListener('click', async () => {
				await this.deleteBackup(backup);
			});
		});
	}

	private async restoreBackup(backup: BackupFileInfo): Promise<void> {
		const confirmed = confirm(
			`Restore backup from ${backup.date}?\n\n` +
			`This will replace your current data with the backup.\n` +
			`Current data will be lost unless you create a backup first.\n\n` +
			`It's recommended to create a backup before restoring.`
		);

		if (!confirmed) {
			return;
		}

		if (this.plugin.backupManager) {
			const success = await this.plugin.backupManager.restoreBackup(backup.filename);
			if (success) {
				new Notice('Backup restored successfully! Reloading plugin...');

				// Reload the plugin to apply restored data
				setTimeout(() => {
					// @ts-ignore - reload method exists
					this.app.plugins.disablePlugin('manuscript-pro').then(() => {
						// @ts-ignore
						this.app.plugins.enablePlugin('manuscript-pro');
					});
				}, 1000);

				this.close();
			}
		}
	}

	private async deleteBackup(backup: BackupFileInfo): Promise<void> {
		const confirmed = confirm(`Delete backup from ${backup.date}?`);

		if (!confirmed) {
			return;
		}

		if (this.plugin.backupManager) {
			const success = await this.plugin.backupManager.deleteBackup(backup.filename);
			if (success) {
				await this.loadBackupList();
				this.renderBackupList();
			}
		}
	}

	private addStyles(): void {
		if (document.getElementById('mp-backup-browser-styles')) return;

		const style = document.createElement('style');
		style.id = 'mp-backup-browser-styles';
		style.textContent = `
			.mp-backup-browser .modal-content {
				padding: 1.5rem;
				max-width: 800px;
			}

			.mp-backup-header {
				display: flex;
				justify-content: space-between;
				align-items: center;
				margin-bottom: 1.5rem;
			}

			.mp-backup-header h2 {
				margin: 0;
			}

			.mp-backup-header-actions {
				display: flex;
				gap: 0.5rem;
			}

			.mp-backup-stats {
				margin-bottom: 1.5rem;
			}

			.mp-stats-grid {
				display: grid;
				grid-template-columns: repeat(3, 1fr);
				gap: 1rem;
			}

			.mp-stat {
				padding: 1rem;
				background: var(--background-primary-alt);
				border-radius: 6px;
				text-align: center;
			}

			.mp-stat-value {
				font-size: 1.5rem;
				font-weight: 600;
				color: var(--text-normal);
			}

			.mp-stat-label {
				font-size: 0.85rem;
				color: var(--text-muted);
				margin-top: 0.25rem;
			}

			.mp-backup-list-container {
				max-height: 400px;
				overflow-y: auto;
			}

			.mp-backup-table {
				width: 100%;
				border-collapse: collapse;
			}

			.mp-backup-table th {
				text-align: left;
				padding: 0.75rem;
				background: var(--background-primary-alt);
				border-bottom: 1px solid var(--background-modifier-border);
				font-weight: 600;
			}

			.mp-backup-table td {
				padding: 0.75rem;
				border-bottom: 1px solid var(--background-modifier-border);
			}

			.mp-backup-table tr:hover {
				background: var(--background-secondary-alt);
			}

			.mp-backup-date {
				font-weight: 500;
			}

			.mp-backup-filename {
				font-size: 0.85rem;
				color: var(--text-muted);
				margin-top: 0.25rem;
			}

			.mp-backup-actions {
				display: flex;
				gap: 0.5rem;
			}

			.mp-backup-actions button {
				padding: 0.4rem 0.8rem;
				font-size: 0.85rem;
			}

			.mp-empty-state {
				text-align: center;
				padding: 3rem 1rem;
				color: var(--text-muted);
			}

			.mp-empty-state p {
				margin: 0.5rem 0;
			}

			.mp-empty-hint {
				font-size: 0.9rem;
			}

			@media (max-width: 600px) {
				.mp-stats-grid {
					grid-template-columns: 1fr;
				}

				.mp-backup-actions {
					flex-direction: column;
				}
			}
		`;
		document.head.appendChild(style);
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
