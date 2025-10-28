import { App, Modal, setIcon } from 'obsidian';
import ManuscriptProPlugin from '../main';
import { FeatureDiscovery, addNewBadge } from './FeatureDiscovery';

/**
 * Modal to show new features since last version
 */
export class WhatsNewModal extends Modal {
	plugin: ManuscriptProPlugin;
	featureDiscovery: FeatureDiscovery;

	constructor(app: App, plugin: ManuscriptProPlugin) {
		super(app);
		this.plugin = plugin;
		this.featureDiscovery = new FeatureDiscovery(app, plugin);
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass('mp-feature-discovery');

		const newFeatures = this.featureDiscovery.getNewFeatures();

		// Header
		const header = contentEl.createDiv({ cls: 'mp-feature-discovery-header' });

		const titleContainer = header.createDiv();
		titleContainer.createEl('h2', {
			text: "What's New in Manuscript Pro",
			cls: 'mp-feature-discovery-title',
		});
		titleContainer.createEl('p', {
			text: `Version ${this.plugin.manifest.version}`,
			cls: 'mp-feature-discovery-version',
		});

		if (newFeatures.length > 0) {
			const dismissAllBtn = header.createEl('button', {
				text: 'Mark All as Seen',
				cls: 'mp-feature-discovery-dismiss-all',
			});
			dismissAllBtn.addEventListener('click', () => {
				this.featureDiscovery.markAllAsSeen();
				this.close();
				// Trigger UI refresh
				this.plugin.app.workspace.trigger('mp-feature-discovery-updated');
			});
		}

		// Content
		if (newFeatures.length === 0) {
			this.renderEmptyState(contentEl);
		} else {
			this.renderFeatures(contentEl, newFeatures);
		}

		// Footer
		const footer = contentEl.createDiv({ cls: 'mp-feature-discovery-footer' });
		const closeBtn = footer.createEl('button', {
			text: 'Close',
			cls: 'mod-cta',
		});
		closeBtn.addEventListener('click', () => this.close());
	}

	private renderEmptyState(container: HTMLElement) {
		const empty = container.createDiv({ cls: 'mp-feature-empty' });
		empty.createDiv({
			text: '✨',
			cls: 'mp-feature-empty-icon',
		});
		empty.createEl('p', {
			text: "You're all caught up! No new features to show.",
		});
		empty.createEl('p', {
			text: 'Check the help panel for documentation on all features.',
			cls: 'mp-feature-empty-hint',
		});
	}

	private renderFeatures(container: HTMLElement, features: any[]) {
		// Group by category
		const byCategory = new Map<string, any[]>();
		features.forEach((feature) => {
			if (!byCategory.has(feature.category)) {
				byCategory.set(feature.category, []);
			}
			byCategory.get(feature.category)!.push(feature);
		});

		// Render each category
		byCategory.forEach((categoryFeatures, category) => {
			const categorySection = container.createDiv({ cls: 'mp-feature-category' });

			categorySection.createEl('h3', {
				text: category,
				cls: 'mp-feature-category-title',
			});

			categoryFeatures.forEach((feature) => {
				this.renderFeature(categorySection, feature);
			});
		});
	}

	private renderFeature(container: HTMLElement, feature: any) {
		const item = container.createDiv({ cls: 'mp-feature-item' });

		// Badge
		const badgeContainer = item.createDiv({ cls: 'mp-feature-item-badge' });
		if (feature.badge) {
			addNewBadge(badgeContainer, feature.badge);
		}

		// Content
		const content = item.createDiv({ cls: 'mp-feature-item-content' });

		content.createDiv({
			text: feature.name,
			cls: 'mp-feature-item-name',
		});

		content.createDiv({
			text: feature.description,
			cls: 'mp-feature-item-description',
		});

		// Actions
		const actions = content.createDiv({ cls: 'mp-feature-item-actions' });

		// Learn more button (if help topic available)
		if (feature.helpTopicId) {
			const learnMore = actions.createEl('button', {
				text: 'Learn More',
				cls: 'mp-feature-item-action',
			});
			learnMore.addEventListener('click', () => {
				this.close();
				this.openHelpTopic(feature.helpTopicId);
			});
		}

		// Settings button (if settings path available)
		if (feature.settingsPath) {
			const settingsBtn = actions.createEl('button', {
				text: 'Settings',
				cls: 'mp-feature-item-action',
			});
			settingsBtn.addEventListener('click', () => {
				this.close();
				this.openSettings();
			});
		}

		// Dismiss button
		const dismissBtn = actions.createEl('button', {
			text: 'Dismiss',
			cls: 'mp-feature-item-action',
		});
		dismissBtn.addEventListener('click', () => {
			this.featureDiscovery.dismissFeature(feature.id);
			item.remove();
			// Trigger UI refresh
			this.plugin.app.workspace.trigger('mp-feature-discovery-updated');

			// Check if all features dismissed
			if (container.querySelectorAll('.mp-feature-item').length === 0) {
				this.close();
			}
		});
	}

	private openHelpTopic(topicId: string) {
		window.dispatchEvent(
			new CustomEvent('mp-open-help-topic', {
				detail: { topicId },
			})
		);
	}

	private openSettings() {
		(this.app as any).setting.open();
		(this.app as any).setting.openTabById('manuscript-pro');
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
