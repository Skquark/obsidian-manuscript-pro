import { App, ItemView, WorkspaceLeaf, setIcon, Notice } from 'obsidian';
import ManuscriptProPlugin from '../main';

/**
 * Panel State Manager
 * Manages pinned state and workspaces for all plugin panels
 */
export class PanelStateManager {
	private app: App;
	private plugin: ManuscriptProPlugin;

	// Known panel view types
	public static readonly PANEL_TYPES = {
		CHARACTERS: 'manuscript-pro-characters',
		TIMELINE: 'manuscript-pro-timeline',
		RESEARCH: 'manuscript-pro-research',
		OUTLINER: 'manuscript-pro-outliner',
		STYLE_CHECKER: 'manuscript-pro-style-checker',
		STATS: 'manuscript-pro-stats',
		VALIDATION: 'manuscript-pro-validation',
		CHECKLIST: 'manuscript-pro-checklist',
		PROGRESS: 'manuscript-pro-progress',
		LABEL_BROWSER: 'manuscript-pro-label-browser',
		NAVIGATOR: 'manuscript-pro-navigator',
	};

	constructor(app: App, plugin: ManuscriptProPlugin) {
		this.app = app;
		this.plugin = plugin;
	}

	/**
	 * Check if a panel is pinned
	 */
	isPinned(viewType: string): boolean {
		return this.plugin.settings.panelManagement.pinnedPanels.includes(viewType);
	}

	/**
	 * Pin a panel
	 */
	async pin(viewType: string): Promise<void> {
		if (!this.isPinned(viewType)) {
			this.plugin.settings.panelManagement.pinnedPanels.push(viewType);
			await this.plugin.saveSettings();
			this.updatePinIndicators(viewType);
		}
	}

	/**
	 * Unpin a panel
	 */
	async unpin(viewType: string): Promise<void> {
		const index = this.plugin.settings.panelManagement.pinnedPanels.indexOf(viewType);
		if (index > -1) {
			this.plugin.settings.panelManagement.pinnedPanels.splice(index, 1);
			await this.plugin.saveSettings();
			this.updatePinIndicators(viewType);
		}
	}

	/**
	 * Toggle pin state for a panel
	 */
	async togglePin(viewType: string): Promise<void> {
		if (this.isPinned(viewType)) {
			await this.unpin(viewType);
		} else {
			await this.pin(viewType);
		}
	}

	/**
	 * Add pin icon to a panel's header
	 */
	addPinIcon(view: ItemView): void {
		const viewType = view.getViewType();

		// Check if pin icon already exists
		const existingIcon = view.containerEl.querySelector('.mp-pin-icon');
		if (existingIcon) {
			existingIcon.remove();
		}

		// Find the view header actions container
		const actionsContainer = view.containerEl.querySelector('.view-actions');
		if (!actionsContainer) {
			console.warn('Could not find view-actions container for pin icon');
			return;
		}

		// Create pin button
		const pinButton = actionsContainer.createDiv({
			cls: 'clickable-icon view-action mp-pin-icon',
			attr: {
				'aria-label': this.isPinned(viewType) ? 'Unpin panel' : 'Pin panel',
			},
		});

		// Set icon based on pin state
		this.updatePinIcon(pinButton, viewType);

		// Add click handler
		pinButton.addEventListener('click', async (e) => {
			e.stopPropagation();
			await this.togglePin(viewType);

			// Update tooltip
			pinButton.setAttribute(
				'aria-label',
				this.isPinned(viewType) ? 'Unpin panel' : 'Pin panel'
			);
		});

		// Insert before other actions (like close button)
		const firstAction = actionsContainer.querySelector('.view-action');
		if (firstAction && firstAction !== pinButton) {
			actionsContainer.insertBefore(pinButton, firstAction);
		}
	}

	/**
	 * Update pin icon appearance based on state
	 */
	private updatePinIcon(iconEl: HTMLElement, viewType: string): void {
		iconEl.empty();

		if (this.isPinned(viewType)) {
			setIcon(iconEl, 'pin');
			iconEl.addClass('is-pinned');
		} else {
			setIcon(iconEl, 'pin-off');
			iconEl.removeClass('is-pinned');
		}
	}

	/**
	 * Update pin indicators for all instances of a view type
	 */
	private updatePinIndicators(viewType: string): void {
		const leaves = this.app.workspace.getLeavesOfType(viewType);
		leaves.forEach((leaf) => {
			const view = leaf.view;
			if (view instanceof ItemView) {
				const pinIcon = view.containerEl.querySelector('.mp-pin-icon') as HTMLElement;
				if (pinIcon) {
					this.updatePinIcon(pinIcon, viewType);
					pinIcon.setAttribute(
						'aria-label',
						this.isPinned(viewType) ? 'Unpin panel' : 'Pin panel'
					);
				}
			}
		});
	}

	/**
	 * Get all currently open panel view types
	 */
	getOpenPanels(): string[] {
		const openPanels: string[] = [];
		const allPanelTypes = Object.values(PanelStateManager.PANEL_TYPES);

		allPanelTypes.forEach((viewType) => {
			const leaves = this.app.workspace.getLeavesOfType(viewType);
			if (leaves.length > 0) {
				openPanels.push(viewType);
			}
		});

		return openPanels;
	}

	/**
	 * Save current panel layout as a workspace
	 */
	async saveWorkspace(name: string): Promise<void> {
		const openPanels = this.getOpenPanels();

		this.plugin.settings.panelManagement.panelWorkspaces[name] = {
			openPanels,
		};

		await this.plugin.saveSettings();
		new Notice(`Workspace "${name}" saved with ${openPanels.length} panel(s)`);
	}

	/**
	 * Load a workspace
	 */
	async loadWorkspace(name: string): Promise<void> {
		const workspace = this.plugin.settings.panelManagement.panelWorkspaces[name];

		if (!workspace) {
			new Notice(`Workspace "${name}" not found`);
			return;
		}

		// Close all non-pinned panels
		const currentPanels = this.getOpenPanels();
		for (const viewType of currentPanels) {
			if (!this.isPinned(viewType)) {
				this.app.workspace.detachLeavesOfType(viewType);
			}
		}

		// Open workspace panels
		for (const viewType of workspace.openPanels) {
			// Skip if already open
			if (this.app.workspace.getLeavesOfType(viewType).length > 0) {
				continue;
			}

			// Open panel in right sidebar
			const leaf = this.app.workspace.getRightLeaf(false);
			if (leaf) {
				await leaf.setViewState({ type: viewType });
			}
		}

		this.plugin.settings.panelManagement.currentWorkspace = name;
		await this.plugin.saveSettings();

		new Notice(`Workspace "${name}" loaded`);
	}

	/**
	 * Delete a workspace
	 */
	async deleteWorkspace(name: string): Promise<void> {
		if (this.plugin.settings.panelManagement.panelWorkspaces[name]) {
			delete this.plugin.settings.panelManagement.panelWorkspaces[name];

			if (this.plugin.settings.panelManagement.currentWorkspace === name) {
				this.plugin.settings.panelManagement.currentWorkspace = undefined;
			}

			await this.plugin.saveSettings();
			new Notice(`Workspace "${name}" deleted`);
		}
	}

	/**
	 * Get list of saved workspaces
	 */
	getWorkspaceNames(): string[] {
		return Object.keys(this.plugin.settings.panelManagement.panelWorkspaces);
	}

	/**
	 * Restore workspace on startup if enabled
	 */
	async restoreWorkspaceOnStartup(): Promise<void> {
		if (!this.plugin.settings.panelManagement.autoRestoreWorkspace) {
			return;
		}

		const currentWorkspace = this.plugin.settings.panelManagement.currentWorkspace;
		if (currentWorkspace) {
			// Wait a bit for workspace to be ready
			setTimeout(() => {
				this.loadWorkspace(currentWorkspace);
			}, 1000);
		}
	}

	/**
	 * Check if a panel should be prevented from closing (if pinned)
	 */
	shouldPreventClose(viewType: string): boolean {
		return this.isPinned(viewType);
	}
}
