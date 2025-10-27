import { App, Modal } from 'obsidian';
import { ValidationResult, ValidationIssue } from './EpubValidator';

export class ValidationResultModal extends Modal {
	private result: ValidationResult;
	private epubPath: string;

	constructor(app: App, result: ValidationResult, epubPath: string) {
		super(app);
		this.result = result;
		this.epubPath = epubPath;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass('export-validation-modal');

		// Header
		const header = contentEl.createDiv('modal-title');
		header.setText('EPUB Validation Results');

		// File info
		const fileInfo = contentEl.createDiv('validation-file-info');
		fileInfo.setText(`File: ${this.epubPath.split('/').pop()}`);

		// Overall status
		const statusSection = contentEl.createDiv('validation-status-section');
		this.renderOverallStatus(statusSection);

		// Issues sections
		if (this.result.errors && this.result.errors.length > 0) {
			const errorsSection = contentEl.createDiv('validation-errors-section');
			this.renderIssueSection(errorsSection, 'Errors', this.result.errors, 'error');
		}

		if (this.result.warnings && this.result.warnings.length > 0) {
			const warningsSection = contentEl.createDiv('validation-warnings-section');
			this.renderIssueSection(warningsSection, 'Warnings', this.result.warnings, 'warning');
		}

		if (this.result.info && this.result.info.length > 0) {
			const infoSection = contentEl.createDiv('validation-info-section');
			this.renderIssueSection(infoSection, 'Info', this.result.info, 'info');
		}

		// No issues message
		if (this.result.valid && (!this.result.warnings || this.result.warnings.length === 0)) {
			const successSection = contentEl.createDiv('validation-success-section');
			successSection.createEl('p', {
				text: '✓ Your EPUB file is valid and ready for distribution!',
				cls: 'validation-success-message',
			});
			successSection.createEl('p', {
				text: 'This file meets EPUB standards and should be accepted by all major retailers and distributors.',
				cls: 'validation-success-detail',
			});
		}

		// Action buttons
		const buttonContainer = contentEl.createDiv('modal-button-container');

		if (!this.result.valid) {
			const fixButton = buttonContainer.createEl('button', { text: 'How to Fix Issues' });
			fixButton.addEventListener('click', () => {
				this.showFixGuidance();
			});
		}

		const closeButton = buttonContainer.createEl('button', {
			text: 'Close',
			cls: 'mod-cta',
		});
		closeButton.addEventListener('click', () => {
			this.close();
		});
	}

	private renderOverallStatus(container: HTMLElement) {
		const statusBox = container.createDiv('validation-status-box');

		if (this.result.valid) {
			statusBox.addClass('validation-status-valid');
			const icon = statusBox.createSpan('validation-status-icon');
			icon.setText('✓');

			const text = statusBox.createSpan('validation-status-text');
			text.setText('Valid EPUB');

			if (this.result.warnings && this.result.warnings.length > 0) {
				const warningNote = statusBox.createDiv('validation-status-note');
				warningNote.setText(`${this.result.warnings.length} warning(s) found`);
			}
		} else {
			statusBox.addClass('validation-status-invalid');
			const icon = statusBox.createSpan('validation-status-icon');
			icon.setText('✗');

			const text = statusBox.createSpan('validation-status-text');
			text.setText('Invalid EPUB');

			const errorNote = statusBox.createDiv('validation-status-note');
			const errorCount = this.result.errors ? this.result.errors.length : 0;
			errorNote.setText(`${errorCount} error(s) must be fixed`);
		}
	}

	private renderIssueSection(
		container: HTMLElement,
		title: string,
		issues: ValidationIssue[],
		severity: 'error' | 'warning' | 'info',
	) {
		const section = container.createDiv(`validation-issues-${severity}`);

		const header = section.createDiv('validation-section-header');
		const headerText = header.createEl('h3');
		headerText.setText(`${title} (${issues.length})`);

		const issuesList = section.createDiv('validation-issues-list');

		for (const issue of issues) {
			const issueItem = issuesList.createDiv('validation-issue-item');
			issueItem.addClass(`validation-issue-${severity}`);

			const issueIcon = issueItem.createSpan('validation-issue-icon');
			switch (severity) {
				case 'error':
					issueIcon.setText('✗');
					break;
				case 'warning':
					issueIcon.setText('⚠');
					break;
				case 'info':
					issueIcon.setText('ℹ');
					break;
			}

			const issueContent = issueItem.createDiv('validation-issue-content');

			const issueMessage = issueContent.createDiv('validation-issue-message');
			issueMessage.setText(issue.message);

			if (issue.location) {
				const issueLocation = issueContent.createDiv('validation-issue-location');
				issueLocation.setText(`Location: ${issue.location}`);
			}
		}
	}

	private showFixGuidance() {
		const guidanceEl = this.contentEl.createDiv('validation-fix-guidance');
		guidanceEl.empty();

		const title = guidanceEl.createEl('h3', { text: 'Common EPUB Issues & Fixes' });

		const guidance = guidanceEl.createDiv('validation-guidance-content');

		guidance.createEl('h4', { text: 'Missing Metadata' });
		guidance.createEl('p', {
			text: 'Ensure your manuscript has title, author, and language metadata set in the Project Editor.',
		});

		guidance.createEl('h4', { text: 'Invalid HTML' });
		guidance.createEl('p', {
			text: 'Check your Markdown for improperly nested tags or unclosed elements. Common issues include malformed links or image references.',
		});

		guidance.createEl('h4', { text: 'Missing Files' });
		guidance.createEl('p', {
			text: 'Verify that all images and resources referenced in your manuscript exist and are included in the vault.',
		});

		guidance.createEl('h4', { text: 'Cover Image' });
		guidance.createEl('p', {
			text: 'Ensure your cover image is set in the export profile and the file exists. Cover should be at least 1600px wide for most retailers.',
		});

		guidance.createEl('h4', { text: 'Navigation Document' });
		guidance.createEl('p', {
			text: 'EPUB requires a table of contents. Ensure your chapters have proper headings (# Chapter Title).',
		});

		const backButton = guidance.createEl('button', {
			text: 'Back to Results',
			cls: 'mod-cta',
		});
		backButton.addEventListener('click', () => {
			guidanceEl.remove();
		});
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
