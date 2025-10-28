import { setIcon } from 'obsidian';

/**
 * Helper for adding help icons throughout the UI
 * Provides consistent help icon styling and behavior
 */

export interface HelpIconConfig {
	topicId: string; // Help topic to link to
	position?: 'inline' | 'header' | 'setting'; // Visual style variant
	tooltip?: string; // Optional custom tooltip
}

/**
 * Add a help icon to an element
 */
export function addHelpIcon(container: HTMLElement, config: HelpIconConfig): HTMLElement {
	const helpIcon = container.createSpan({
		cls: `mp-help-icon mp-help-icon-${config.position || 'inline'}`,
		attr: {
			'aria-label': config.tooltip || 'Open help',
			'data-topic-id': config.topicId,
		},
	});

	setIcon(helpIcon, 'help-circle');

	// Add click handler to open help topic
	helpIcon.addEventListener('click', (e) => {
		e.preventDefault();
		e.stopPropagation();

		window.dispatchEvent(
			new CustomEvent('mp-open-help-topic', {
				detail: { topicId: config.topicId },
			})
		);
	});

	return helpIcon;
}

/**
 * Add help icon to a settings section header
 */
export function addSettingsSectionHelp(
	container: HTMLElement,
	sectionTitle: string,
	topicId: string
): HTMLElement {
	// Find or create the section title element
	const titleEl = container.createEl('h3', {
		text: sectionTitle,
		cls: 'mp-settings-section-title',
	});

	return addHelpIcon(titleEl, {
		topicId,
		position: 'header',
		tooltip: `Learn more about ${sectionTitle}`,
	});
}

/**
 * Add help icon to a panel header
 */
export function addPanelHelp(headerEl: HTMLElement, topicId: string, panelName: string): HTMLElement {
	return addHelpIcon(headerEl, {
		topicId,
		position: 'header',
		tooltip: `Help: ${panelName}`,
	});
}

/**
 * Add help link to the bottom of a panel
 */
export function addPanelFooterHelp(container: HTMLElement, topicId: string, linkText?: string): HTMLElement {
	const footer = container.createDiv({ cls: 'mp-panel-footer-help' });

	const link = footer.createEl('a', {
		text: linkText || 'Learn more',
		cls: 'mp-help-link',
		attr: {
			'data-topic-id': topicId,
		},
	});

	const icon = link.createSpan({ cls: 'mp-help-link-icon' });
	setIcon(icon, 'help-circle');

	link.addEventListener('click', (e) => {
		e.preventDefault();
		window.dispatchEvent(
			new CustomEvent('mp-open-help-topic', {
				detail: { topicId },
			})
		);
	});

	return footer;
}

/**
 * Initialize help icon styles
 */
export function initHelpIconStyles() {
	if (document.getElementById('mp-help-icon-styles')) {
		return;
	}

	const style = document.createElement('style');
	style.id = 'mp-help-icon-styles';
	style.textContent = `
		/* Help icon base styles */
		.mp-help-icon {
			display: inline-flex;
			align-items: center;
			justify-content: center;
			width: 16px;
			height: 16px;
			margin-left: 6px;
			color: var(--text-muted);
			cursor: pointer;
			transition: all 0.15s;
			vertical-align: middle;
		}

		.mp-help-icon svg {
			width: 14px;
			height: 14px;
		}

		.mp-help-icon:hover {
			color: var(--interactive-accent);
			transform: scale(1.1);
		}

		/* Header variant (in panel/section titles) */
		.mp-help-icon-header {
			width: 18px;
			height: 18px;
			margin-left: 8px;
		}

		.mp-help-icon-header svg {
			width: 16px;
			height: 16px;
		}

		/* Setting variant (next to setting names) */
		.mp-help-icon-setting {
			width: 14px;
			height: 14px;
			margin-left: 4px;
		}

		.mp-help-icon-setting svg {
			width: 12px;
			height: 12px;
		}

		/* Settings section title with help icon */
		.mp-settings-section-title {
			display: flex;
			align-items: center;
			font-size: 1.1em;
			font-weight: 600;
			margin: 1.5em 0 0.75em 0;
			padding-bottom: 0.5em;
			border-bottom: 1px solid var(--background-modifier-border);
		}

		/* Panel footer help link */
		.mp-panel-footer-help {
			padding: 12px 16px;
			border-top: 1px solid var(--background-modifier-border);
			margin-top: auto;
		}

		.mp-help-link {
			display: inline-flex;
			align-items: center;
			gap: 6px;
			color: var(--text-muted);
			text-decoration: none;
			font-size: 0.9em;
			cursor: pointer;
			transition: color 0.15s;
		}

		.mp-help-link:hover {
			color: var(--interactive-accent);
		}

		.mp-help-link-icon {
			width: 14px;
			height: 14px;
			display: inline-flex;
			align-items: center;
			justify-content: center;
		}

		.mp-help-link-icon svg {
			width: 12px;
			height: 12px;
		}

		/* Help button in panel header */
		.mp-panel-header-help {
			margin-left: auto;
			padding: 4px;
			background: transparent;
			border: none;
			cursor: pointer;
			color: var(--text-muted);
			border-radius: 4px;
			transition: all 0.15s;
		}

		.mp-panel-header-help:hover {
			background: var(--background-modifier-hover);
			color: var(--interactive-accent);
		}

		.mp-panel-header-help svg {
			width: 16px;
			height: 16px;
		}

		/* Inline help icon in running text */
		.mp-help-icon-inline {
			width: 14px;
			height: 14px;
			margin-left: 3px;
			opacity: 0.7;
		}

		.mp-help-icon-inline:hover {
			opacity: 1;
		}
	`;
	document.head.appendChild(style);
}

/**
 * Cleanup help icon styles
 */
export function cleanupHelpIconStyles() {
	const styles = document.getElementById('mp-help-icon-styles');
	if (styles) {
		styles.remove();
	}
}
