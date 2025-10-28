import { App, setIcon } from 'obsidian';
import ManuscriptProPlugin from '../main';
import { getTipForDay, getRandomTip, QuickTip } from './QuickTipsData';

/**
 * Manages the display of quick tips with daily rotation
 */
export class QuickTipManager {
	app: App;
	plugin: ManuscriptProPlugin;
	private containerEl: HTMLElement | null = null;
	private currentTip: QuickTip | null = null;
	private isDismissed: boolean = false;

	constructor(app: App, plugin: ManuscriptProPlugin) {
		this.app = app;
		this.plugin = plugin;
	}

	/**
	 * Initialize quick tips system
	 */
	initialize() {
		// Check if quick tips should be shown
		if (!this.shouldShowTip()) {
			return;
		}

		// Get tip for today
		this.currentTip = getTipForDay();

		// Show tip after a delay to not interfere with startup
		setTimeout(() => {
			this.showTip();
		}, 2000);
	}

	/**
	 * Check if tip should be shown based on settings and last shown date
	 */
	private shouldShowTip(): boolean {
		// Check if quick tips are enabled
		if (!this.plugin.settings.quickTips?.enabled) {
			return false;
		}

		// Check if user has dismissed tips for today
		const today = new Date().toISOString().split('T')[0];
		const lastDismissed = this.plugin.settings.quickTips?.lastDismissedDate;

		if (lastDismissed === today) {
			this.isDismissed = true;
			return false;
		}

		// Check if onboarding was just completed (don't overwhelm user)
		const onboardingCompletedAt = this.plugin.settings.onboarding?.completedAt;
		if (onboardingCompletedAt) {
			const daysSinceOnboarding = (Date.now() - onboardingCompletedAt) / (1000 * 60 * 60 * 24);
			if (daysSinceOnboarding < 1) {
				// Don't show tips on the same day as onboarding
				return false;
			}
		}

		return true;
	}

	/**
	 * Show the quick tip
	 */
	showTip() {
		if (!this.currentTip || this.containerEl || this.isDismissed) {
			return;
		}

		// Create tip container
		this.containerEl = document.body.createDiv({ cls: 'mp-quick-tip' });

		// Icon
		const iconEl = this.containerEl.createDiv({ cls: 'mp-quick-tip-icon' });
		setIcon(iconEl, 'lightbulb');

		// Content
		const contentEl = this.containerEl.createDiv({ cls: 'mp-quick-tip-content' });
		contentEl.createEl('strong', {
			text: 'Tip of the Day: ',
			cls: 'mp-quick-tip-label',
		});
		contentEl.createSpan({
			text: this.currentTip.text,
			cls: 'mp-quick-tip-text',
		});

		// Actions
		const actionsEl = this.containerEl.createDiv({ cls: 'mp-quick-tip-actions' });

		// Learn more link (if topic available)
		if (this.currentTip.linkToTopic) {
			const learnMoreBtn = actionsEl.createEl('button', {
				text: 'Learn More',
				cls: 'mp-quick-tip-button',
			});
			learnMoreBtn.addEventListener('click', () => {
				this.openHelpTopic(this.currentTip!.linkToTopic!);
				this.dismiss();
			});
		}

		// Next tip button
		const nextBtn = actionsEl.createEl('button', {
			text: 'Next Tip',
			cls: 'mp-quick-tip-button',
		});
		nextBtn.addEventListener('click', () => {
			this.showNextTip();
		});

		// Dismiss button
		const dismissBtn = actionsEl.createEl('button', {
			cls: 'mp-quick-tip-dismiss',
			attr: { 'aria-label': 'Dismiss' },
		});
		setIcon(dismissBtn, 'x');
		dismissBtn.addEventListener('click', () => {
			this.dismiss();
		});

		// Add animation
		setTimeout(() => {
			this.containerEl?.addClass('is-visible');
		}, 10);

		// Add styles if not already added
		this.addStyles();
	}

	/**
	 * Show next random tip
	 */
	showNextTip() {
		if (!this.containerEl) {
			return;
		}

		// Get random tip
		this.currentTip = getRandomTip();

		// Fade out
		this.containerEl.removeClass('is-visible');

		// Update content after animation
		setTimeout(() => {
			if (!this.containerEl) {
				return;
			}

			// Remove old container
			this.containerEl.remove();
			this.containerEl = null;

			// Show new tip
			this.showTip();
		}, 300);
	}

	/**
	 * Dismiss the quick tip
	 */
	dismiss() {
		if (!this.containerEl) {
			return;
		}

		// Save dismissal date
		const today = new Date().toISOString().split('T')[0];
		if (!this.plugin.settings.quickTips) {
			(this.plugin.settings as any).quickTips = {};
		}
		(this.plugin.settings as any).quickTips.lastDismissedDate = today;
		this.plugin.saveSettings();

		// Mark as dismissed
		this.isDismissed = true;

		// Fade out
		this.containerEl.removeClass('is-visible');

		// Remove after animation
		setTimeout(() => {
			if (this.containerEl) {
				this.containerEl.remove();
				this.containerEl = null;
			}
		}, 300);
	}

	/**
	 * Open help topic
	 */
	private openHelpTopic(topicId: string) {
		window.dispatchEvent(
			new CustomEvent('mp-open-help-topic', {
				detail: { topicId },
			})
		);
	}

	/**
	 * Add CSS styles
	 */
	private addStyles() {
		if (document.getElementById('mp-quick-tip-styles')) {
			return;
		}

		const style = document.createElement('style');
		style.id = 'mp-quick-tip-styles';
		style.textContent = `
			.mp-quick-tip {
				position: fixed;
				bottom: 20px;
				right: 20px;
				max-width: 450px;
				background: var(--background-primary);
				border: 1px solid var(--background-modifier-border);
				border-radius: 8px;
				box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
				padding: 16px;
				display: flex;
				align-items: flex-start;
				gap: 12px;
				z-index: 1000;
				opacity: 0;
				transform: translateY(20px);
				transition: opacity 0.3s, transform 0.3s;
			}

			.mp-quick-tip.is-visible {
				opacity: 1;
				transform: translateY(0);
			}

			.mp-quick-tip-icon {
				flex-shrink: 0;
				width: 32px;
				height: 32px;
				background: var(--interactive-accent);
				border-radius: 50%;
				display: flex;
				align-items: center;
				justify-content: center;
			}

			.mp-quick-tip-icon svg {
				width: 18px;
				height: 18px;
				color: var(--text-on-accent);
			}

			.mp-quick-tip-content {
				flex: 1;
				padding-top: 4px;
			}

			.mp-quick-tip-label {
				color: var(--interactive-accent);
				font-weight: 600;
			}

			.mp-quick-tip-text {
				color: var(--text-normal);
				line-height: 1.5;
			}

			.mp-quick-tip-actions {
				display: flex;
				gap: 8px;
				margin-top: 12px;
				flex-wrap: wrap;
			}

			.mp-quick-tip-button {
				padding: 6px 12px;
				background: var(--interactive-accent);
				color: var(--text-on-accent);
				border: none;
				border-radius: 4px;
				cursor: pointer;
				font-size: 0.9em;
				font-weight: 500;
				transition: opacity 0.15s;
			}

			.mp-quick-tip-button:hover {
				opacity: 0.8;
			}

			.mp-quick-tip-button:first-child {
				background: transparent;
				color: var(--interactive-accent);
				border: 1px solid var(--interactive-accent);
			}

			.mp-quick-tip-button:first-child:hover {
				background: var(--background-modifier-hover);
				opacity: 1;
			}

			.mp-quick-tip-dismiss {
				position: absolute;
				top: 8px;
				right: 8px;
				width: 24px;
				height: 24px;
				padding: 0;
				background: transparent;
				border: none;
				border-radius: 4px;
				cursor: pointer;
				color: var(--text-muted);
				display: flex;
				align-items: center;
				justify-content: center;
				transition: all 0.15s;
			}

			.mp-quick-tip-dismiss:hover {
				background: var(--background-modifier-hover);
				color: var(--text-normal);
			}

			.mp-quick-tip-dismiss svg {
				width: 16px;
				height: 16px;
			}

			/* Mobile adjustments */
			@media (max-width: 768px) {
				.mp-quick-tip {
					left: 20px;
					right: 20px;
					max-width: none;
					bottom: 60px; /* Above mobile controls */
				}
			}

			/* Ensure tip is above other UI elements */
			.mp-quick-tip {
				z-index: var(--layer-popover);
			}
		`;
		document.head.appendChild(style);
	}

	/**
	 * Cleanup
	 */
	cleanup() {
		if (this.containerEl) {
			this.containerEl.remove();
			this.containerEl = null;
		}

		const styles = document.getElementById('mp-quick-tip-styles');
		if (styles) {
			styles.remove();
		}
	}
}
