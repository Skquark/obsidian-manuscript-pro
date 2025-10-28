import { App, Modal, setIcon } from 'obsidian';
import ManuscriptProPlugin from '../main';

/**
 * Onboarding step configuration
 */
interface OnboardingStep {
	title: string;
	description: string;
	icon: string;
	features?: string[];
	action?: {
		label: string;
		callback: () => void;
	};
}

/**
 * Interactive onboarding wizard for first-time users
 */
export class OnboardingModal extends Modal {
	plugin: ManuscriptProPlugin;
	private currentStep: number = 0;
	private steps: OnboardingStep[] = [
		{
			title: 'Welcome to Manuscript Pro! 👋',
			description:
				'Your complete toolkit for academic writing in Obsidian. Let\'s take a quick tour of the key features.',
			icon: 'sparkles',
			features: [
				'LaTeX syntax concealment for clean writing',
				'BibTeX citation management with previews',
				'Professional document export (PDF, DOCX, LaTeX)',
				'Manuscript structure navigation',
				'Focus mode for distraction-free writing',
			],
		},
		{
			title: 'Focus Mode 🎯',
			description:
				'Write without distractions. Focus Mode hides UI elements and emphasizes your current text.',
			icon: 'focus',
			features: [
				'Hide markdown syntax for clean preview',
				'Typewriter mode keeps cursor centered',
				'Dim inactive paragraphs',
				'Fullscreen mode support',
			],
			action: {
				label: 'Try Focus Mode',
				callback: () => {
					this.plugin.focusModeManager.toggle();
				},
			},
		},
		{
			title: 'Citations & Bibliography 📚',
			description:
				'Manage your research sources with powerful BibTeX integration.',
			icon: 'quote',
			features: [
				'Import citations from DOI, arXiv, or PubMed',
				'Hover over citations to see formatted previews',
				'Auto-complete cross-references (\\ref{}, \\label{})',
				'Detect duplicate citations automatically',
			],
			action: {
				label: 'Configure Citations',
				callback: () => {
					this.close();
					// Open settings to citations tab
					(this.app as any).setting.open();
					(this.app as any).setting.openTabById('manuscript-pro');
				},
			},
		},
		{
			title: 'Manuscript Navigator 🗂️',
			description: 'Organize your manuscript with a hierarchical table of contents.',
			icon: 'book-open',
			features: [
				'Track word counts per chapter',
				'Drag and drop to reorder sections',
				'Set writing goals and track progress',
				'Quick navigation between chapters',
			],
			action: {
				label: 'Open Navigator',
				callback: () => {
					this.close();
					this.plugin.activateManuscriptNavigator();
				},
			},
		},
		{
			title: 'Export & Publishing 📤',
			description:
				'Transform your manuscript into publication-ready documents with Pandoc.',
			icon: 'download',
			features: [
				'Export to PDF, DOCX, LaTeX, and more',
				'Pre-configured templates for APA, Chicago, IEEE',
				'Custom export profiles for different publishers',
				'Batch export multiple chapters',
			],
			action: {
				label: 'View Export Options',
				callback: () => {
					this.close();
					(this.app as any).setting.open();
					(this.app as any).setting.openTabById('manuscript-pro');
				},
			},
		},
		{
			title: 'You\'re All Set! 🚀',
			description:
				'Start writing your manuscript with confidence. Press Mod+Shift+/ anytime to open the help panel.',
			icon: 'check-circle',
			features: [
				'**Mod+Shift+Z** - Toggle Focus Mode',
				'**Mod+Shift+/** - Open Help Panel',
				'**Mod+Alt+S** - Open Statistics Panel',
				'**Right-click panel tabs** - Pin panels',
			],
			action: {
				label: 'Open Help Panel',
				callback: () => {
					this.close();
					this.plugin.activateHelpView();
				},
			},
		},
	];

	private contentContainer!: HTMLElement;
	private progressContainer!: HTMLElement;
	private navContainer!: HTMLElement;

	constructor(app: App, plugin: ManuscriptProPlugin) {
		super(app);
		this.plugin = plugin;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass('mp-onboarding-modal');

		// Header with close button
		const header = contentEl.createDiv({ cls: 'mp-onboarding-header' });
		const closeBtn = header.createEl('button', {
			cls: 'mp-onboarding-close',
			attr: { 'aria-label': 'Close' },
		});
		setIcon(closeBtn, 'x');
		closeBtn.addEventListener('click', () => this.close());

		// Progress indicators
		this.progressContainer = contentEl.createDiv({ cls: 'mp-onboarding-progress' });
		this.renderProgress();

		// Content area
		this.contentContainer = contentEl.createDiv({ cls: 'mp-onboarding-content' });
		this.renderStep();

		// Navigation
		this.navContainer = contentEl.createDiv({ cls: 'mp-onboarding-nav' });
		this.renderNavigation();

		// Add styles
		this.addStyles();
	}

	private renderProgress() {
		this.progressContainer.empty();

		this.steps.forEach((_, index) => {
			const dot = this.progressContainer.createDiv({
				cls: 'mp-onboarding-dot' + (index === this.currentStep ? ' is-active' : ''),
			});

			if (index < this.currentStep) {
				dot.addClass('is-complete');
				const checkIcon = dot.createSpan();
				setIcon(checkIcon, 'check');
			}

			dot.addEventListener('click', () => {
				this.currentStep = index;
				this.renderStep();
				this.renderProgress();
				this.renderNavigation();
			});
		});
	}

	private renderStep() {
		this.contentContainer.empty();

		const step = this.steps[this.currentStep];

		// Icon
		const iconContainer = this.contentContainer.createDiv({ cls: 'mp-onboarding-icon' });
		const icon = iconContainer.createSpan();
		setIcon(icon, step.icon);

		// Title
		this.contentContainer.createEl('h2', {
			text: step.title,
			cls: 'mp-onboarding-title',
		});

		// Description
		this.contentContainer.createEl('p', {
			text: step.description,
			cls: 'mp-onboarding-description',
		});

		// Features list
		if (step.features && step.features.length > 0) {
			const featuresList = this.contentContainer.createEl('ul', {
				cls: 'mp-onboarding-features',
			});

			step.features.forEach((feature) => {
				const li = featuresList.createEl('li');
				const checkIcon = li.createSpan({ cls: 'mp-onboarding-feature-icon' });
				setIcon(checkIcon, 'check');

				// Support markdown in features
				const textSpan = li.createSpan({ cls: 'mp-onboarding-feature-text' });
				textSpan.innerHTML = feature
					.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
					.replace(/`(.+?)`/g, '<code>$1</code>');
			});
		}

		// Action button (if present)
		if (step.action) {
			const actionBtn = this.contentContainer.createEl('button', {
				text: step.action.label,
				cls: 'mp-onboarding-action mod-cta',
			});
			actionBtn.addEventListener('click', () => {
				step.action!.callback();
			});
		}
	}

	private renderNavigation() {
		this.navContainer.empty();

		// Left side - Skip button
		const leftNav = this.navContainer.createDiv({ cls: 'mp-onboarding-nav-left' });

		if (this.currentStep === 0) {
			const skipBtn = leftNav.createEl('button', {
				text: 'Skip Tour',
				cls: 'mp-onboarding-skip',
			});
			skipBtn.addEventListener('click', () => {
				this.markComplete();
				this.close();
			});
		}

		// Right side - Previous/Next buttons
		const rightNav = this.navContainer.createDiv({ cls: 'mp-onboarding-nav-right' });

		// Previous button
		if (this.currentStep > 0) {
			const prevBtn = rightNav.createEl('button', {
				text: 'Previous',
				cls: 'mp-onboarding-prev',
			});
			prevBtn.addEventListener('click', () => {
				this.currentStep--;
				this.renderStep();
				this.renderProgress();
				this.renderNavigation();
			});
		}

		// Next/Finish button
		const isLastStep = this.currentStep === this.steps.length - 1;
		const nextBtn = rightNav.createEl('button', {
			text: isLastStep ? 'Get Started' : 'Next',
			cls: 'mp-onboarding-next mod-cta',
		});
		nextBtn.addEventListener('click', () => {
			if (isLastStep) {
				this.markComplete();
				this.close();
			} else {
				this.currentStep++;
				this.renderStep();
				this.renderProgress();
				this.renderNavigation();
			}
		});
	}

	private markComplete() {
		// Store completion in settings
		if (!this.plugin.settings.onboarding) {
			(this.plugin.settings as any).onboarding = {};
		}
		(this.plugin.settings as any).onboarding.completed = true;
		(this.plugin.settings as any).onboarding.completedAt = Date.now();
		this.plugin.saveSettings();
	}

	private addStyles() {
		if (document.getElementById('mp-onboarding-styles')) return;

		const style = document.createElement('style');
		style.id = 'mp-onboarding-styles';
		style.textContent = `
			.mp-onboarding-modal .modal {
				width: 600px;
				max-width: 90vw;
			}

			.mp-onboarding-modal .modal-content {
				padding: 0;
			}

			.mp-onboarding-header {
				position: relative;
				padding: 1rem;
			}

			.mp-onboarding-close {
				position: absolute;
				top: 1rem;
				right: 1rem;
				width: 32px;
				height: 32px;
				padding: 0;
				border: none;
				background: transparent;
				cursor: pointer;
				border-radius: 4px;
				color: var(--text-muted);
				transition: all 0.15s;
			}

			.mp-onboarding-close:hover {
				background: var(--background-modifier-hover);
				color: var(--text-normal);
			}

			.mp-onboarding-progress {
				display: flex;
				justify-content: center;
				gap: 0.5rem;
				padding: 0 2rem 2rem 2rem;
			}

			.mp-onboarding-dot {
				width: 12px;
				height: 12px;
				border-radius: 50%;
				background: var(--background-modifier-border);
				cursor: pointer;
				transition: all 0.2s;
				position: relative;
			}

			.mp-onboarding-dot:hover {
				background: var(--text-muted);
				transform: scale(1.2);
			}

			.mp-onboarding-dot.is-active {
				background: var(--interactive-accent);
				transform: scale(1.3);
			}

			.mp-onboarding-dot.is-complete {
				background: var(--color-green);
			}

			.mp-onboarding-dot.is-complete svg {
				width: 8px;
				height: 8px;
				position: absolute;
				top: 2px;
				left: 2px;
				color: white;
			}

			.mp-onboarding-content {
				padding: 0 3rem 2rem 3rem;
				text-align: center;
				min-height: 400px;
				display: flex;
				flex-direction: column;
				align-items: center;
			}

			.mp-onboarding-icon {
				width: 80px;
				height: 80px;
				margin-bottom: 1.5rem;
				background: var(--interactive-accent);
				border-radius: 50%;
				display: flex;
				align-items: center;
				justify-content: center;
			}

			.mp-onboarding-icon svg {
				width: 40px;
				height: 40px;
				color: var(--text-on-accent);
			}

			.mp-onboarding-title {
				font-size: 1.75rem;
				margin: 0 0 1rem 0;
				font-weight: 600;
			}

			.mp-onboarding-description {
				font-size: 1rem;
				color: var(--text-muted);
				margin: 0 0 2rem 0;
				line-height: 1.6;
				max-width: 500px;
			}

			.mp-onboarding-features {
				list-style: none;
				padding: 0;
				margin: 0 0 2rem 0;
				text-align: left;
				width: 100%;
				max-width: 450px;
			}

			.mp-onboarding-features li {
				display: flex;
				align-items: flex-start;
				gap: 0.75rem;
				margin-bottom: 0.75rem;
			}

			.mp-onboarding-feature-icon {
				flex-shrink: 0;
				width: 20px;
				height: 20px;
				background: var(--color-green);
				border-radius: 50%;
				display: flex;
				align-items: center;
				justify-content: center;
				margin-top: 2px;
			}

			.mp-onboarding-feature-icon svg {
				width: 12px;
				height: 12px;
				color: white;
			}

			.mp-onboarding-feature-text {
				flex: 1;
				line-height: 1.5;
			}

			.mp-onboarding-feature-text code {
				padding: 0.15rem 0.4rem;
				background: var(--background-secondary);
				border-radius: 3px;
				font-family: var(--font-monospace);
				font-size: 0.9em;
			}

			.mp-onboarding-feature-text strong {
				font-weight: 600;
			}

			.mp-onboarding-action {
				margin-top: auto;
				padding: 0.6rem 1.5rem;
				font-size: 1rem;
			}

			.mp-onboarding-nav {
				display: flex;
				justify-content: space-between;
				padding: 1.5rem 2rem;
				border-top: 1px solid var(--background-modifier-border);
			}

			.mp-onboarding-nav-left,
			.mp-onboarding-nav-right {
				display: flex;
				gap: 0.5rem;
			}

			.mp-onboarding-skip {
				padding: 0.5rem 1rem;
				background: transparent;
				border: 1px solid var(--background-modifier-border);
				border-radius: 6px;
				cursor: pointer;
				color: var(--text-muted);
				transition: all 0.15s;
			}

			.mp-onboarding-skip:hover {
				background: var(--background-modifier-hover);
				color: var(--text-normal);
			}

			.mp-onboarding-prev,
			.mp-onboarding-next {
				padding: 0.5rem 1.5rem;
				border-radius: 6px;
				cursor: pointer;
				transition: all 0.15s;
			}

			.mp-onboarding-prev {
				background: transparent;
				border: 1px solid var(--background-modifier-border);
				color: var(--text-normal);
			}

			.mp-onboarding-prev:hover {
				background: var(--background-modifier-hover);
			}

			@media (max-width: 768px) {
				.mp-onboarding-content {
					padding: 0 2rem 2rem 2rem;
					min-height: 350px;
				}

				.mp-onboarding-title {
					font-size: 1.5rem;
				}

				.mp-onboarding-description {
					font-size: 0.95rem;
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
