import { App, Modal, Notice } from 'obsidian';
import ManuscriptProPlugin from '../main';
import { SETTINGS_TEMPLATES, applyTemplate, SettingsTemplate } from './SettingsTemplates';

/**
 * Settings Template Selection Modal
 */
export class SettingsTemplateModal extends Modal {
	plugin: ManuscriptProPlugin;
	onApply: () => void;

	constructor(app: App, plugin: ManuscriptProPlugin, onApply: () => void) {
		super(app);
		this.plugin = plugin;
		this.onApply = onApply;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass('mp-template-modal');

		// Header
		contentEl.createEl('h2', { text: 'Choose Settings Template' });
		contentEl.createEl('p', {
			text: 'Select a pre-configured template to quickly set up Manuscript Pro for your workflow.',
			cls: 'mp-template-description',
		});

		// Categories
		const categories = [
			{ id: 'all', name: 'All Templates', icon: '📋' },
			{ id: 'academic', name: 'Academic', icon: '🎓' },
			{ id: 'fiction', name: 'Fiction', icon: '📚' },
			{ id: 'technical', name: 'Technical', icon: '⚙️' },
			{ id: 'minimal', name: 'Minimal', icon: '✨' },
		];

		// Template grid
		const templateGrid = contentEl.createDiv({ cls: 'mp-template-grid' });

		SETTINGS_TEMPLATES.forEach((template) => {
			const templateCard = templateGrid.createDiv({ cls: 'mp-template-card' });

			// Icon
			const icon = templateCard.createDiv({ cls: 'mp-template-icon' });
			icon.textContent = template.icon;

			// Content
			const content = templateCard.createDiv({ cls: 'mp-template-content' });
			content.createEl('h3', { text: template.name });
			content.createEl('p', { text: template.description });

			// Apply button
			const applyBtn = templateCard.createEl('button', {
				text: 'Apply Template',
				cls: 'mp-template-apply-btn',
			});

			applyBtn.addEventListener('click', async () => {
				await this.applyTemplate(template);
			});

			templateCard.addEventListener('click', (e) => {
				if (e.target !== applyBtn) {
					this.showTemplatePreview(template);
				}
			});
		});

		// Footer
		const footer = contentEl.createDiv({ cls: 'mp-template-footer' });
		footer.createEl('p', {
			text: '💡 Tip: You can further customize settings after applying a template.',
			cls: 'mp-template-tip',
		});

		// Add styles
		this.addStyles();
	}

	private async applyTemplate(template: SettingsTemplate): Promise<void> {
		const confirmMessage = `Apply "${template.name}" template?\n\nThis will update your current settings. Your existing configuration will be preserved where the template doesn't specify changes.`;

		if (confirm(confirmMessage)) {
			try {
				// Apply template
				this.plugin.settings = applyTemplate(this.plugin.settings, template);
				await this.plugin.saveSettings();

				new Notice(`Applied template: ${template.name}`);

				// Refresh settings display
				this.onApply();

				// Close modal
				this.close();
			} catch (error) {
				console.error('Failed to apply template:', error);
				new Notice('Failed to apply template');
			}
		}
	}

	private showTemplatePreview(template: SettingsTemplate): void {
		// Could add a preview modal here in the future
		// For now, just show more info
		new Notice(`${template.icon} ${template.name}\n\n${template.description}`, 5000);
	}

	private addStyles(): void {
		if (document.getElementById('mp-template-modal-styles')) return;

		const style = document.createElement('style');
		style.id = 'mp-template-modal-styles';
		style.textContent = `
			.mp-template-modal {
				padding: 0;
			}

			.mp-template-modal .modal-content {
				padding: 1.5rem;
				max-width: 800px;
			}

			.mp-template-modal h2 {
				margin-top: 0;
				margin-bottom: 0.5rem;
				font-size: 1.5rem;
			}

			.mp-template-description {
				color: var(--text-muted);
				margin-bottom: 1.5rem;
				font-size: 0.95rem;
			}

			.mp-template-grid {
				display: grid;
				grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
				gap: 1rem;
				margin-bottom: 1.5rem;
			}

			.mp-template-card {
				border: 1px solid var(--background-modifier-border);
				border-radius: 8px;
				padding: 1.25rem;
				cursor: pointer;
				transition: all 0.2s ease;
				background: var(--background-primary);
				position: relative;
			}

			.mp-template-card:hover {
				border-color: var(--interactive-accent);
				box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
				transform: translateY(-2px);
			}

			.mp-template-icon {
				font-size: 2rem;
				margin-bottom: 0.75rem;
				text-align: center;
			}

			.mp-template-content h3 {
				margin: 0 0 0.5rem 0;
				font-size: 1.1rem;
				color: var(--text-normal);
			}

			.mp-template-content p {
				margin: 0 0 1rem 0;
				font-size: 0.9rem;
				color: var(--text-muted);
				line-height: 1.4;
			}

			.mp-template-apply-btn {
				width: 100%;
				padding: 0.6rem;
				border: 1px solid var(--interactive-accent);
				border-radius: 4px;
				background: var(--interactive-accent);
				color: var(--text-on-accent);
				font-weight: 500;
				cursor: pointer;
				transition: all 0.15s ease;
			}

			.mp-template-apply-btn:hover {
				background: var(--interactive-accent-hover);
				transform: scale(1.02);
			}

			.mp-template-footer {
				border-top: 1px solid var(--background-modifier-border);
				padding-top: 1rem;
				margin-top: 1rem;
			}

			.mp-template-tip {
				margin: 0;
				font-size: 0.85rem;
				color: var(--text-muted);
				text-align: center;
			}

			@media (max-width: 600px) {
				.mp-template-grid {
					grid-template-columns: 1fr;
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
