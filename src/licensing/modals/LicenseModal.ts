import { App, Modal, Notice, Setting } from 'obsidian';
import type ManuscriptProPlugin from '../../main';
import { License, LicenseStatus } from '../types';

/**
 * Modal for license activation and management
 */
export class LicenseModal extends Modal {
	private plugin: ManuscriptProPlugin;
	private licenseInput: HTMLInputElement | null = null;
	private emailInput: HTMLInputElement | null = null;

	constructor(app: App, plugin: ManuscriptProPlugin) {
		super(app);
		this.plugin = plugin;
	}

	async onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass('manuscript-license-modal');

		const license = this.plugin.licenseManager.getLicense();

		if (license?.tier === 'pro' && license.status === LicenseStatus.ACTIVE) {
			this.renderActivatedState(contentEl, license);
		} else {
			this.renderActivationForm(contentEl);
		}
	}

	/**
	 * Render activated license state
	 */
	private renderActivatedState(el: HTMLElement, license: License) {
		// Header
		el.createEl('h2', { text: '✅ ManuScript Pro Activated' });

		// Success message
		el.createEl('p', {
			text: 'Your license is active. All Pro features are unlocked.',
			cls: 'manuscript-license-success',
		});

		// License info
		const info = el.createDiv({ cls: 'manuscript-license-info' });

		const infoGrid = info.createDiv({ cls: 'manuscript-info-grid' });

		// Email
		const emailRow = infoGrid.createDiv({ cls: 'manuscript-info-row' });
		emailRow.createSpan({ text: 'Email:', cls: 'manuscript-info-label' });
		emailRow.createSpan({ text: license.email, cls: 'manuscript-info-value' });

		// Activated date
		const activatedRow = infoGrid.createDiv({ cls: 'manuscript-info-row' });
		activatedRow.createSpan({
			text: 'Activated:',
			cls: 'manuscript-info-label',
		});
		activatedRow.createSpan({
			text: new Date(license.activatedAt).toLocaleDateString(),
			cls: 'manuscript-info-value',
		});

		// Status
		const statusRow = infoGrid.createDiv({ cls: 'manuscript-info-row' });
		statusRow.createSpan({ text: 'Status:', cls: 'manuscript-info-label' });
		const statusValue = statusRow.createSpan({
			text: this.getStatusText(license.status),
			cls: `manuscript-info-value manuscript-status-${license.status}`,
		});

		// Last validated
		if (license.lastChecked) {
			const daysSince = Math.floor(
				(Date.now() - license.lastChecked) / (1000 * 60 * 60 * 24)
			);
			const lastCheckedRow = infoGrid.createDiv({
				cls: 'manuscript-info-row',
			});
			lastCheckedRow.createSpan({
				text: 'Last validated:',
				cls: 'manuscript-info-label',
			});
			lastCheckedRow.createSpan({
				text: `${daysSince} ${daysSince === 1 ? 'day' : 'days'} ago`,
				cls: 'manuscript-info-value',
			});
		}

		// Grace period warning
		if (license.status === LicenseStatus.GRACE_PERIOD && license.gracePeriodEnds) {
			const daysLeft = Math.ceil(
				(license.gracePeriodEnds - Date.now()) / (1000 * 60 * 60 * 24)
			);

			const warning = el.createDiv({ cls: 'manuscript-grace-period-warning' });
			warning.createEl('strong', {
				text: `⚠ Grace Period: ${daysLeft} ${daysLeft === 1 ? 'day' : 'days'} remaining`,
			});
			warning.createEl('p', {
				text: 'Please connect to the internet to validate your license.',
			});
		}

		// Actions
		const actions = el.createDiv({ cls: 'manuscript-license-actions' });

		// Validate now button
		const validateBtn = actions.createEl('button', {
			text: 'Validate Now',
			cls: 'mod-cta',
		});
		validateBtn.onclick = async () => {
			new Notice('Validating license...');
			const success = await this.plugin.licenseManager.validateOnline();
			if (success) {
				new Notice('✅ License validated successfully');
				this.onOpen(); // Refresh modal
			} else {
				new Notice('⚠ Validation failed. Please check your connection.');
			}
		};

		// Deactivate button
		const deactivateBtn = actions.createEl('button', {
			text: 'Deactivate License',
			cls: 'mod-warning',
		});
		deactivateBtn.onclick = async () => {
			const confirmed = confirm(
				'Are you sure you want to deactivate this license? You will need to re-activate it to use Pro features.'
			);
			if (confirmed) {
				await this.plugin.licenseManager.deactivate();
				this.onOpen(); // Refresh to show activation form
			}
		};

		// Close button
		const closeBtn = actions.createEl('button', { text: 'Close' });
		closeBtn.onclick = () => this.close();
	}

	/**
	 * Render activation form
	 */
	private renderActivationForm(el: HTMLElement) {
		// Header
		el.createEl('h2', { text: '⭐ Activate ManuScript Pro' });

		// Description
		el.createEl('p', {
			text: 'Enter your license key to unlock all Pro features.',
			cls: 'manuscript-activation-description',
		});

		// Form
		const form = el.createDiv({ cls: 'manuscript-activation-form' });

		// Email field
		new Setting(form)
			.setName('Email')
			.setDesc('The email address used for your purchase')
			.addText((text) => {
				this.emailInput = text.inputEl;
				text.setPlaceholder('your@email.com');
				text.inputEl.type = 'email';
				text.inputEl.style.width = '100%';
			});

		// License key field
		new Setting(form)
			.setName('License Key')
			.setDesc('Your ManuScript Pro license key')
			.addText((text) => {
				this.licenseInput = text.inputEl;
				text.setPlaceholder('MANU-XXXX-XXXX-XXXX');
				text.inputEl.style.width = '100%';
				text.inputEl.style.fontFamily = 'monospace';

				// Auto-format license key
				text.inputEl.addEventListener('input', (e) => {
					let value = (e.target as HTMLInputElement).value
						.toUpperCase()
						.replace(/[^A-Z0-9]/g, '');

					// Add dashes
					if (value.length > 4) {
						value = value.substring(0, 4) + '-' + value.substring(4);
					}
					if (value.length > 9) {
						value = value.substring(0, 9) + '-' + value.substring(9);
					}
					if (value.length > 14) {
						value = value.substring(0, 14) + '-' + value.substring(14);
					}
					if (value.length > 19) {
						value = value.substring(0, 19);
					}

					(e.target as HTMLInputElement).value = value;
				});
			});

		// Buttons
		const buttons = el.createDiv({ cls: 'manuscript-activation-buttons' });

		// Activate button
		const activateBtn = buttons.createEl('button', {
			text: 'Activate',
			cls: 'mod-cta',
		});
		activateBtn.onclick = async () => {
			await this.activateLicense();
		};

		// Purchase button
		const buyBtn = buttons.createEl('button', {
			text: 'Purchase License',
		});
		buyBtn.onclick = () => {
			window.open('https://your-site.com/manuscript-pro', '_blank');
		};

		// Cancel button
		const cancelBtn = buttons.createEl('button', {
			text: 'Cancel',
		});
		cancelBtn.onclick = () => this.close();

		// Footer
		const footer = el.createDiv({ cls: 'manuscript-activation-footer' });
		footer.createEl('p', {
			text: 'Need help? ',
		});
		const supportLink = footer.createEl('a', {
			text: 'Contact Support',
			href: 'https://your-site.com/support',
		});
		supportLink.onclick = (e) => {
			e.preventDefault();
			window.open('https://your-site.com/support', '_blank');
		};
	}

	/**
	 * Activate license
	 */
	private async activateLicense() {
		if (!this.emailInput || !this.licenseInput) {
			return;
		}

		const email = this.emailInput.value.trim();
		const key = this.licenseInput.value.trim();

		// Validate inputs
		if (!email) {
			new Notice('⚠ Please enter your email address');
			return;
		}

		if (!key) {
			new Notice('⚠ Please enter your license key');
			return;
		}

		// Validate email format
		const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailPattern.test(email)) {
			new Notice('⚠ Please enter a valid email address');
			return;
		}

		// Show loading state
		new Notice('Validating license...');

		// Attempt activation
		const result = await this.plugin.licenseManager.activate(email, key);

		if (result.success) {
			new Notice('✅ License activated successfully!');
			this.close();

			// Show success notification with feature list
			setTimeout(() => {
				new Notice('All Pro features are now unlocked!', 5000);
			}, 500);
		} else {
			new Notice(`❌ Activation failed: ${result.error || 'Unknown error'}`);
		}
	}

	/**
	 * Get human-readable status text
	 */
	private getStatusText(status: LicenseStatus): string {
		switch (status) {
			case LicenseStatus.ACTIVE:
				return 'Active';
			case LicenseStatus.GRACE_PERIOD:
				return 'Grace Period';
			case LicenseStatus.EXPIRED:
				return 'Expired';
			case LicenseStatus.INVALID:
				return 'Invalid';
			default:
				return 'Unknown';
		}
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
