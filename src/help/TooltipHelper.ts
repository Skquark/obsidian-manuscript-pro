import { setIcon } from 'obsidian';

/**
 * Tooltip configuration
 */
export interface TooltipConfig {
	text: string;
	position?: 'top' | 'bottom' | 'left' | 'right';
	maxWidth?: number;
	showIcon?: boolean;
	iconType?: 'help' | 'info';
	linkToTopic?: string; // Help topic ID to link to
	delay?: number; // Show delay in ms
}

/**
 * Helper class for creating contextual tooltips throughout the UI
 */
export class TooltipHelper {
	private static tooltips: Map<HTMLElement, HTMLElement> = new Map();
	private static currentTooltip: HTMLElement | null = null;

	/**
	 * Add a tooltip to an element
	 */
	static addTooltip(element: HTMLElement, config: TooltipConfig): void {
		// Store config on element for access
		(element as any)._tooltipConfig = config;

		// Add hover listeners
		element.addEventListener('mouseenter', (e) => this.showTooltip(e.target as HTMLElement));
		element.addEventListener('mouseleave', () => this.hideTooltip());
		element.addEventListener('click', () => this.hideTooltip());
	}

	/**
	 * Add a help icon with tooltip to a container
	 */
	static addHelpIcon(
		container: HTMLElement,
		config: TooltipConfig
	): HTMLElement {
		const helpIcon = container.createSpan({ cls: 'mp-help-icon-inline' });
		setIcon(helpIcon, config.iconType === 'info' ? 'info' : 'help-circle');

		this.addTooltip(helpIcon, config);

		// If there's a link to a help topic, make it clickable
		if (config.linkToTopic) {
			helpIcon.addClass('mp-help-icon-clickable');
			helpIcon.addEventListener('click', (e) => {
				e.preventDefault();
				e.stopPropagation();
				this.openHelpTopic(config.linkToTopic!);
			});
		}

		return helpIcon;
	}

	/**
	 * Show tooltip for an element
	 */
	private static showTooltip(element: HTMLElement): void {
		const config = (element as any)._tooltipConfig as TooltipConfig;
		if (!config) return;

		const showDelay = config.delay || 500;

		// Clear any existing timeout
		if ((element as any)._tooltipTimeout) {
			clearTimeout((element as any)._tooltipTimeout);
		}

		// Set delay before showing
		(element as any)._tooltipTimeout = setTimeout(() => {
			this.hideTooltip(); // Hide any existing tooltip

			const tooltip = this.createTooltipElement(config);
			document.body.appendChild(tooltip);
			this.currentTooltip = tooltip;

			// Position tooltip
			this.positionTooltip(tooltip, element, config.position || 'top');

			// Fade in
			requestAnimationFrame(() => {
				tooltip.addClass('is-visible');
			});
		}, showDelay);
	}

	/**
	 * Hide current tooltip
	 */
	private static hideTooltip(): void {
		if (this.currentTooltip) {
			this.currentTooltip.removeClass('is-visible');
			setTimeout(() => {
				if (this.currentTooltip) {
					this.currentTooltip.remove();
					this.currentTooltip = null;
				}
			}, 200); // Match CSS transition
		}
	}

	/**
	 * Create tooltip element
	 */
	private static createTooltipElement(config: TooltipConfig): HTMLElement {
		const tooltip = document.createElement('div');
		tooltip.addClass('mp-tooltip');

		if (config.maxWidth) {
			tooltip.style.maxWidth = `${config.maxWidth}px`;
		}

		// Add icon if requested
		if (config.showIcon) {
			const icon = tooltip.createSpan({ cls: 'mp-tooltip-icon' });
			setIcon(icon, config.iconType === 'info' ? 'info' : 'help-circle');
		}

		// Add text content
		const textEl = tooltip.createDiv({ cls: 'mp-tooltip-text' });
		textEl.innerHTML = this.formatTooltipText(config.text);

		// Add link if topic specified
		if (config.linkToTopic) {
			const linkEl = tooltip.createDiv({ cls: 'mp-tooltip-link' });
			linkEl.createSpan({ text: 'Learn more', cls: 'mp-tooltip-link-text' });
			const linkIcon = linkEl.createSpan({ cls: 'mp-tooltip-link-icon' });
			setIcon(linkIcon, 'external-link');

			linkEl.addEventListener('click', () => {
				this.openHelpTopic(config.linkToTopic!);
				this.hideTooltip();
			});
		}

		return tooltip;
	}

	/**
	 * Format tooltip text (supports simple markdown)
	 */
	private static formatTooltipText(text: string): string {
		// Support **bold**, *italic*, `code`
		return text
			.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
			.replace(/\*(.+?)\*/g, '<em>$1</em>')
			.replace(/`(.+?)`/g, '<code>$1</code>');
	}

	/**
	 * Position tooltip relative to target element
	 */
	private static positionTooltip(
		tooltip: HTMLElement,
		target: HTMLElement,
		position: 'top' | 'bottom' | 'left' | 'right'
	): void {
		const targetRect = target.getBoundingClientRect();
		const tooltipRect = tooltip.getBoundingClientRect();
		const spacing = 8; // Gap between tooltip and target

		let top = 0;
		let left = 0;

		switch (position) {
			case 'top':
				top = targetRect.top - tooltipRect.height - spacing;
				left = targetRect.left + (targetRect.width - tooltipRect.width) / 2;
				tooltip.addClass('mp-tooltip-top');
				break;
			case 'bottom':
				top = targetRect.bottom + spacing;
				left = targetRect.left + (targetRect.width - tooltipRect.width) / 2;
				tooltip.addClass('mp-tooltip-bottom');
				break;
			case 'left':
				top = targetRect.top + (targetRect.height - tooltipRect.height) / 2;
				left = targetRect.left - tooltipRect.width - spacing;
				tooltip.addClass('mp-tooltip-left');
				break;
			case 'right':
				top = targetRect.top + (targetRect.height - tooltipRect.height) / 2;
				left = targetRect.right + spacing;
				tooltip.addClass('mp-tooltip-right');
				break;
		}

		// Keep tooltip on screen
		const margin = 8;
		if (left < margin) {
			left = margin;
		} else if (left + tooltipRect.width > window.innerWidth - margin) {
			left = window.innerWidth - tooltipRect.width - margin;
		}

		if (top < margin) {
			top = margin;
		} else if (top + tooltipRect.height > window.innerHeight - margin) {
			top = window.innerHeight - tooltipRect.height - margin;
		}

		tooltip.style.top = `${top}px`;
		tooltip.style.left = `${left}px`;
	}

	/**
	 * Open a help topic in the help panel
	 */
	private static openHelpTopic(topicId: string): void {
		// Dispatch custom event that the help panel can listen for
		const event = new CustomEvent('mp-open-help-topic', {
			detail: { topicId },
		});
		window.dispatchEvent(event);
	}

	/**
	 * Initialize tooltip styles
	 */
	static initStyles(): void {
		if (document.getElementById('mp-tooltip-styles')) return;

		const style = document.createElement('style');
		style.id = 'mp-tooltip-styles';
		style.textContent = `
			.mp-tooltip {
				position: fixed;
				z-index: 10000;
				background: var(--background-secondary);
				border: 1px solid var(--background-modifier-border);
				border-radius: 6px;
				padding: 0.75rem;
				max-width: 300px;
				box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
				pointer-events: auto;
				opacity: 0;
				transition: opacity 0.2s ease;
			}

			.mp-tooltip.is-visible {
				opacity: 1;
			}

			.mp-tooltip-icon {
				display: inline-block;
				vertical-align: middle;
				margin-right: 0.5rem;
				color: var(--text-accent);
			}

			.mp-tooltip-text {
				font-size: 0.85rem;
				line-height: 1.4;
				color: var(--text-normal);
			}

			.mp-tooltip-text strong {
				font-weight: 600;
				color: var(--text-normal);
			}

			.mp-tooltip-text em {
				font-style: italic;
			}

			.mp-tooltip-text code {
				padding: 0.15rem 0.4rem;
				background: var(--background-primary-alt);
				border-radius: 3px;
				font-family: var(--font-monospace);
				font-size: 0.85em;
			}

			.mp-tooltip-link {
				margin-top: 0.5rem;
				padding-top: 0.5rem;
				border-top: 1px solid var(--background-modifier-border);
				display: flex;
				align-items: center;
				gap: 0.25rem;
				cursor: pointer;
				color: var(--text-accent);
				font-size: 0.8rem;
				font-weight: 500;
				transition: color 0.15s;
			}

			.mp-tooltip-link:hover {
				color: var(--text-accent-hover);
			}

			.mp-tooltip-link-icon {
				width: 14px;
				height: 14px;
			}

			/* Tooltip arrows */
			.mp-tooltip-top::before,
			.mp-tooltip-bottom::before,
			.mp-tooltip-left::before,
			.mp-tooltip-right::before {
				content: '';
				position: absolute;
				width: 0;
				height: 0;
				border-style: solid;
			}

			.mp-tooltip-top::before {
				bottom: -6px;
				left: 50%;
				transform: translateX(-50%);
				border-width: 6px 6px 0 6px;
				border-color: var(--background-secondary) transparent transparent transparent;
			}

			.mp-tooltip-bottom::before {
				top: -6px;
				left: 50%;
				transform: translateX(-50%);
				border-width: 0 6px 6px 6px;
				border-color: transparent transparent var(--background-secondary) transparent;
			}

			.mp-tooltip-left::before {
				right: -6px;
				top: 50%;
				transform: translateY(-50%);
				border-width: 6px 0 6px 6px;
				border-color: transparent transparent transparent var(--background-secondary);
			}

			.mp-tooltip-right::before {
				left: -6px;
				top: 50%;
				transform: translateY(-50%);
				border-width: 6px 6px 6px 0;
				border-color: transparent var(--background-secondary) transparent transparent;
			}

			/* Inline help icons */
			.mp-help-icon-inline {
				display: inline-flex;
				align-items: center;
				justify-content: center;
				width: 16px;
				height: 16px;
				margin-left: 0.35rem;
				color: var(--text-muted);
				opacity: 0.7;
				cursor: help;
				transition: all 0.15s;
			}

			.mp-help-icon-inline:hover {
				color: var(--text-accent);
				opacity: 1;
				transform: scale(1.1);
			}

			.mp-help-icon-inline.mp-help-icon-clickable {
				cursor: pointer;
			}

			.mp-help-icon-inline.mp-help-icon-clickable:hover {
				color: var(--text-accent-hover);
			}

			.mp-help-icon-inline svg {
				width: 14px;
				height: 14px;
			}

			/* Setting item with help icon */
			.setting-item-name {
				display: flex;
				align-items: center;
			}
		`;
		document.head.appendChild(style);
	}

	/**
	 * Cleanup all tooltips
	 */
	static cleanup(): void {
		this.hideTooltip();
		this.tooltips.clear();
	}
}

/**
 * Common tooltip presets for settings
 */
export const TOOLTIP_PRESETS = {
	// Focus Mode
	focusMode: {
		text: 'Distraction-free writing mode that hides UI elements and emphasizes your current text. **Keyboard shortcut:** `Mod+Shift+Z`',
		linkToTopic: 'focus-mode',
	},
	typewriterMode: {
		text: 'Keeps your cursor centered on screen while typing, like a typewriter. Works best with Focus Mode enabled.',
		linkToTopic: 'typewriter-mode',
	},

	// Citations
	citations: {
		text: 'Manage BibTeX citations with inline previews and automatic formatting. Import from **DOI**, **arXiv**, or **PubMed**.',
		linkToTopic: 'citations-overview',
	},
	crossReferences: {
		text: 'Automatically track and validate cross-references to figures, tables, equations, and sections. Use `\\ref{}` and `\\label{}`.',
		linkToTopic: 'cross-references',
	},

	// Export
	exportProfiles: {
		text: 'Export presets for different output formats (DOCX, PDF, LaTeX). Each profile has custom Pandoc options and templates.',
		linkToTopic: 'export-overview',
	},

	// Panels
	panelPinning: {
		text: 'Pin panels to keep them open across sessions. Pinned panels will automatically reopen when you start Obsidian.',
		linkToTopic: 'panel-pinning',
	},
	workspaces: {
		text: 'Save and restore panel layouts for different tasks. Switch between writing, editing, and research setups instantly.',
		linkToTopic: 'panel-workspaces',
	},

	// Backup
	autoBackup: {
		text: 'Automatically backs up your plugin data (characters, research notes, timeline, etc.) at regular intervals.',
		linkToTopic: 'backup-overview',
	},

	// Advanced
	maxBackups: {
		text: 'Maximum number of backup files to keep. Older backups are automatically deleted when this limit is reached.',
	},
	backupInterval: {
		text: 'How often to create automatic backups, in minutes. Set to 30 minutes or higher for optimal performance.',
	},
	debugMode: {
		text: 'Enables detailed console logging for troubleshooting. Only enable if you\'re experiencing issues.',
	},
} as const;
