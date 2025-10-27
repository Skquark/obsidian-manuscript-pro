import { App, Modal } from 'obsidian';
import type ManuscriptProPlugin from '../../main';
import { ProFeature } from '../types';

/**
 * Modal shown when user tries to access a Pro feature
 */
export class UpgradeModal extends Modal {
	private plugin: ManuscriptProPlugin;
	private feature: ProFeature;
	private context?: string;

	constructor(
		app: App,
		plugin: ManuscriptProPlugin,
		feature: ProFeature,
		context?: string
	) {
		super(app);
		this.plugin = plugin;
		this.feature = feature;
		this.context = context;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass('manuscript-upgrade-modal');

		// Get feature info
		const featureInfo = this.plugin.featureGate.getFeatureInfo(this.feature);

		// Header
		const header = contentEl.createDiv({ cls: 'manuscript-upgrade-header' });
		header.createEl('h2', {
			text: `${featureInfo.icon} ${featureInfo.name}`,
		});

		// Pro badge
		const badge = contentEl.createDiv({ cls: 'manuscript-pro-badge' });
		badge.createEl('span', { text: '⭐ Pro Feature' });

		// Description
		contentEl.createEl('p', {
			text: featureInfo.description,
			cls: 'manuscript-upgrade-description',
		});

		// Benefits list
		if (featureInfo.benefits.length > 0) {
			const benefitsSection = contentEl.createDiv({
				cls: 'manuscript-upgrade-benefits',
			});
			benefitsSection.createEl('h3', { text: 'What you get:' });

			const benefitsList = benefitsSection.createEl('ul');
			featureInfo.benefits.forEach((benefit) => {
				const li = benefitsList.createEl('li');
				li.createSpan({ text: '✓ ', cls: 'manuscript-check-mark' });
				li.createSpan({ text: benefit });
			});
		}

		// Pricing section
		const pricing = contentEl.createDiv({ cls: 'manuscript-upgrade-pricing' });

		pricing.createEl('div', {
			text: 'ManuScript Pro',
			cls: 'manuscript-upgrade-title',
		});

		const priceContainer = pricing.createDiv({
			cls: 'manuscript-price-container',
		});
		priceContainer.createEl('span', {
			text: '$39',
			cls: 'manuscript-upgrade-price',
		});

		pricing.createEl('div', {
			text: 'One-time payment • Lifetime access',
			cls: 'manuscript-upgrade-subtitle',
		});

		pricing.createEl('div', {
			text: 'Includes all Pro features + future updates',
			cls: 'manuscript-upgrade-note',
		});

		// Buttons
		const buttonContainer = contentEl.createDiv({
			cls: 'manuscript-upgrade-buttons',
		});

		// Upgrade button
		const upgradeBtn = buttonContainer.createEl('button', {
			text: 'Upgrade to Pro',
			cls: 'mod-cta',
		});
		upgradeBtn.onclick = () => {
			// TODO: Replace with actual purchase URL
			const purchaseUrl = `https://your-site.com/manuscript-pro?feature=${this.feature}`;
			window.open(purchaseUrl, '_blank');
			this.close();
		};

		// Already have license button
		const activateBtn = buttonContainer.createEl('button', {
			text: 'I already have a license',
		});
		activateBtn.onclick = () => {
			this.close();
			// Open license activation modal
			import('./LicenseModal').then(({ LicenseModal }) => {
				new LicenseModal(this.app, this.plugin).open();
			});
		};

		// Maybe later button
		const cancelBtn = buttonContainer.createEl('button', {
			text: 'Maybe later',
			cls: 'manuscript-cancel-btn',
		});
		cancelBtn.onclick = () => this.close();

		// Learn more link
		const footer = contentEl.createDiv({ cls: 'manuscript-upgrade-footer' });
		const learnMore = footer.createEl('a', {
			text: 'Learn more about ManuScript Pro →',
			href: 'https://your-site.com/manuscript-pro',
		});
		learnMore.onclick = (e) => {
			e.preventDefault();
			window.open('https://your-site.com/manuscript-pro', '_blank');
		};
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
