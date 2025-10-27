import { App, MarkdownView } from 'obsidian';
import { PluginSettings } from '../interfaces/plugin-settings';
import LatexPandocConcealerPlugin from '../main';

/**
 * Manages Focus Mode functionality including markdown concealment,
 * typewriter dimming, reading width, and UI minimization
 */
export class FocusModeManager {
	private plugin: LatexPandocConcealerPlugin;
	private app: App;
	private isActive = false;

	// Store UI state for restoration
	private uiState: {
		leftSidebarVisible: boolean;
		rightSidebarVisible: boolean;
		ribbonVisible: boolean;
	} | null = null;

	constructor(plugin: LatexPandocConcealerPlugin) {
		this.plugin = plugin;
		this.app = plugin.app;
	}

	/**
	 * Enable Focus Mode
	 */
	enable(): void {
		if (this.isActive) return;

		this.isActive = true;
		this.plugin.settings.focusMode.enabled = true;
		this.plugin.saveSettings();

		const settings = this.plugin.settings.focusMode;

		// Apply markdown concealment via CSS
		if (settings.hideMarkdownSyntax) {
			this.applyMarkdownConcealment();
		}

		// Apply centered layout
		if (settings.centerText) {
			this.applyCenteredLayout();
		}

		// Hide UI elements
		if (settings.hideExplorer || settings.hideStatusBar || settings.hideRibbon) {
			this.hideUIElements();
		}

		// Enter fullscreen
		if (settings.enterFullscreen) {
			this.enterFullscreen();
		}

		// Add focus mode class to workspace
		document.body.addClass('latex-pandoc-focus-mode');

		// Update status bar
		this.plugin.updateStatusBar();

		if (this.plugin.settings.debugMode) {
			console.log('Focus Mode: Enabled');
		}
	}

	/**
	 * Disable Focus Mode
	 */
	disable(): void {
		// Don't use early return - always allow disable to clean up state
		// This handles cases where settings and internal state might be out of sync

		this.isActive = false;
		this.plugin.settings.focusMode.enabled = false;
		this.plugin.saveSettings();

		// Remove all CSS classes
		document.body.removeClass('latex-pandoc-focus-mode');
		document.body.removeClass('focus-mode-markdown-concealed');
		document.body.removeClass('focus-mode-centered');

		// Remove individual concealment classes
		document.body.removeClass('focus-mode-hide-headings');
		document.body.removeClass('focus-mode-hide-lists');
		document.body.removeClass('focus-mode-hide-blockquotes');
		document.body.removeClass('focus-mode-hide-code-markers');

		// Restore UI elements
		if (this.uiState) {
			this.restoreUIElements();
		}

		// Exit fullscreen
		if (document.fullscreenElement) {
			document.exitFullscreen();
		}

		// Force editor refresh to re-render visible content
		const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (activeView) {
			// Trigger a refresh by dispatching a state effect
			const editor = activeView.editor as any;
			if (editor?.cm) {
				editor.cm.dispatch({});
			}
		}

		// Update status bar
		this.plugin.updateStatusBar();

		if (this.plugin.settings.debugMode) {
			console.log('Focus Mode: Disabled');
		}
	}

	/**
	 * Toggle Focus Mode on/off
	 */
	toggle(): void {
		if (this.isActive) {
			this.disable();
		} else {
			this.enable();
		}
	}

	/**
	 * Check if Focus Mode is currently active
	 */
	isEnabled(): boolean {
		return this.isActive;
	}

	/**
	 * Apply markdown syntax concealment via CSS classes
	 */
	private applyMarkdownConcealment(): void {
		const settings = this.plugin.settings.focusMode;

		document.body.addClass('focus-mode-markdown-concealed');

		// Individual concealment options
		if (settings.hideHeadingMarkers) {
			document.body.addClass('focus-mode-hide-headings');
		}
		if (settings.hideListMarkers) {
			document.body.addClass('focus-mode-hide-lists');
		}
		if (settings.hideBlockquoteMarkers) {
			document.body.addClass('focus-mode-hide-blockquotes');
		}
		if (settings.hideInlineCode) {
			document.body.addClass('focus-mode-hide-code-markers');
		}
	}

	/**
	 * Apply centered text layout with configurable line width
	 */
	private applyCenteredLayout(): void {
		const settings = this.plugin.settings.focusMode;

		document.body.addClass('focus-mode-centered');

		// Set CSS custom property for line width
		document.body.style.setProperty('--focus-line-width', `${settings.lineWidth}ch`);
	}

	/**
	 * Hide UI elements (explorer, status bar, ribbon)
	 */
	private hideUIElements(): void {
		const settings = this.plugin.settings.focusMode;

		// Store current state for restoration
		this.uiState = {
			leftSidebarVisible: !this.app.workspace.leftSplit.collapsed,
			rightSidebarVisible: !this.app.workspace.rightSplit.collapsed,
			ribbonVisible: document.body.hasClass('is-hidden-frameless'),
		};

		// Hide left sidebar (file explorer)
		if (settings.hideExplorer && this.uiState.leftSidebarVisible) {
			this.app.workspace.leftSplit.collapse();
		}

		// Hide status bar
		if (settings.hideStatusBar) {
			document.body.addClass('focus-mode-hide-status-bar');
		}

		// Hide ribbon
		if (settings.hideRibbon) {
			document.body.addClass('is-hidden-frameless');
		}
	}

	/**
	 * Restore UI elements to their pre-focus mode state
	 */
	private restoreUIElements(): void {
		if (!this.uiState) return;

		const settings = this.plugin.settings.focusMode;

		// Restore left sidebar
		if (settings.hideExplorer && this.uiState.leftSidebarVisible) {
			this.app.workspace.leftSplit.expand();
		}

		// Restore status bar
		if (settings.hideStatusBar) {
			document.body.removeClass('focus-mode-hide-status-bar');
		}

		// Restore ribbon
		if (settings.hideRibbon && !this.uiState.ribbonVisible) {
			document.body.removeClass('is-hidden-frameless');
		}

		this.uiState = null;
	}

	/**
	 * Enter fullscreen mode
	 */
	private enterFullscreen(): void {
		if (!document.fullscreenElement) {
			document.documentElement.requestFullscreen().catch((err) => {
				if (this.plugin.settings.debugMode) {
					console.error('Failed to enter fullscreen:', err);
				}
			});
		}
	}

	/**
	 * Update Focus Mode settings and reapply if active
	 */
	updateSettings(newSettings: PluginSettings): void {
		if (this.isActive) {
			// Reapply focus mode with new settings
			this.disable();
			this.enable();
		}
	}

	/**
	 * Clean up when plugin unloads
	 */
	cleanup(): void {
		if (this.isActive) {
			this.disable();
		}
	}
}
