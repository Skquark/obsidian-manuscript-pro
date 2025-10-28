import { App } from 'obsidian';
import ManuscriptProPlugin from '../main';

/**
 * Feature definition with version tracking
 */
export interface Feature {
	id: string;
	name: string;
	description: string;
	introducedInVersion: string; // Semantic version (e.g., "0.3.0")
	category: string;
	settingsPath?: string; // Path to settings location
	helpTopicId?: string; // Link to help topic
	badge?: 'new' | 'beta' | 'improved' | 'experimental';
}

/**
 * Feature discovery database
 * Add new features here when introducing them
 */
export const FEATURES: Feature[] = [
	// Phase 6 Features (v0.3.0)
	{
		id: 'help-panel',
		name: 'Help Panel',
		description: 'Searchable documentation with categories and search',
		introducedInVersion: '0.3.0',
		category: 'Documentation & Help',
		helpTopicId: 'getting-started',
		badge: 'new',
	},
	{
		id: 'onboarding-wizard',
		name: 'Welcome Tour',
		description: 'Interactive onboarding wizard for first-time users',
		introducedInVersion: '0.3.0',
		category: 'Documentation & Help',
		badge: 'new',
	},
	{
		id: 'quick-tips',
		name: 'Quick Tips',
		description: 'Daily helpful tips to discover features',
		introducedInVersion: '0.3.0',
		category: 'Documentation & Help',
		settingsPath: 'quickTips.enabled',
		badge: 'new',
	},
	{
		id: 'contextual-tooltips',
		name: 'Contextual Tooltips',
		description: 'Helpful tooltips throughout settings and UI',
		introducedInVersion: '0.3.0',
		category: 'Documentation & Help',
		badge: 'new',
	},
	{
		id: 'outliner-panel',
		name: 'Scene/Chapter Outliner',
		description: 'Structure and organize your manuscript scenes',
		introducedInVersion: '0.3.0',
		category: 'Organization',
		settingsPath: 'outliner.enabled',
		helpTopicId: 'outliner',
		badge: 'new',
	},
	{
		id: 'character-database',
		name: 'Character Database',
		description: 'Track characters, appearances, and relationships',
		introducedInVersion: '0.3.0',
		category: 'Organization',
		settingsPath: 'characters.enabled',
		helpTopicId: 'characters',
		badge: 'new',
	},
	{
		id: 'research-panel',
		name: 'Research Notes Panel',
		description: 'Organize research notes and sources',
		introducedInVersion: '0.3.0',
		category: 'Organization',
		settingsPath: 'research.enabled',
		helpTopicId: 'research',
		badge: 'new',
	},
	{
		id: 'style-checker',
		name: 'Style Consistency Checker',
		description: 'Maintain consistent writing style with custom rules',
		introducedInVersion: '0.3.0',
		category: 'Quality',
		settingsPath: 'styleChecker.enabled',
		helpTopicId: 'style-checker',
		badge: 'new',
	},
	{
		id: 'timeline-tool',
		name: 'Timeline/Chronology Tool',
		description: 'Track events and detect chronological conflicts',
		introducedInVersion: '0.3.0',
		category: 'Organization',
		settingsPath: 'timeline.enabled',
		helpTopicId: 'timeline',
		badge: 'new',
	},
	{
		id: 'panel-workspaces',
		name: 'Panel Workspaces',
		description: 'Save and restore panel layouts for different contexts',
		introducedInVersion: '0.3.0',
		category: 'Workflow',
		settingsPath: 'panelManagement.autoRestoreWorkspace',
		badge: 'new',
	},
	{
		id: 'auto-backup',
		name: 'Auto Backup & Sync',
		description: 'Automatic backup of manuscript data and settings',
		introducedInVersion: '0.3.0',
		category: 'Data Management',
		settingsPath: 'backup.enabled',
		helpTopicId: 'backup',
		badge: 'new',
	},

	// Phase 5 Features (v0.2.0) - These would appear if user upgraded from v0.1.x
	{
		id: 'latex-template-editor',
		name: 'LaTeX Template Editor',
		description: 'Create and customize export templates',
		introducedInVersion: '0.2.0',
		category: 'Export',
		helpTopicId: 'export',
		badge: 'improved',
	},
	{
		id: 'batch-export',
		name: 'Batch Export',
		description: 'Export multiple chapters simultaneously',
		introducedInVersion: '0.2.0',
		category: 'Export',
		badge: 'improved',
	},

	// Core Features (v0.1.0) - Won't show as new for most users
	{
		id: 'focus-mode',
		name: 'Focus Mode',
		description: 'Distraction-free writing with typewriter mode',
		introducedInVersion: '0.1.0',
		category: 'Writing',
		settingsPath: 'focusMode.enabled',
		helpTopicId: 'focus-mode',
	},
	{
		id: 'citation-management',
		name: 'Citation Management',
		description: 'BibTeX integration with DOI/arXiv import',
		introducedInVersion: '0.1.0',
		category: 'References',
		settingsPath: 'citations.enabled',
		helpTopicId: 'citations',
	},
	{
		id: 'manuscript-navigator',
		name: 'Manuscript Navigator',
		description: 'Navigate chapters with word counts',
		introducedInVersion: '0.1.0',
		category: 'Organization',
		settingsPath: 'manuscriptNavigator.enabled',
		helpTopicId: 'manuscript-navigator',
	},
];

/**
 * Manages feature discovery and "new" badges
 */
export class FeatureDiscovery {
	app: App;
	plugin: ManuscriptProPlugin;

	constructor(app: App, plugin: ManuscriptProPlugin) {
		this.app = app;
		this.plugin = plugin;
	}

	/**
	 * Get all new features since user's last seen version
	 */
	getNewFeatures(): Feature[] {
		const lastSeenVersion = this.plugin.settings.featureDiscovery?.lastSeenVersion || '0.0.0';
		return FEATURES.filter((feature) => this.isFeatureNew(feature, lastSeenVersion));
	}

	/**
	 * Get features by category
	 */
	getFeaturesByCategory(category: string): Feature[] {
		return FEATURES.filter((f) => f.category === category);
	}

	/**
	 * Check if a feature is new for the user
	 */
	isFeatureNew(feature: Feature, userVersion?: string): boolean {
		const lastSeenVersion = userVersion || this.plugin.settings.featureDiscovery?.lastSeenVersion || '0.0.0';
		return this.compareVersions(feature.introducedInVersion, lastSeenVersion) > 0;
	}

	/**
	 * Check if a specific feature ID is new
	 */
	isFeatureIdNew(featureId: string): boolean {
		const feature = FEATURES.find((f) => f.id === featureId);
		return feature ? this.isFeatureNew(feature) : false;
	}

	/**
	 * Mark current version as seen (dismiss all "new" badges)
	 */
	markAllAsSeen() {
		if (!this.plugin.settings.featureDiscovery) {
			(this.plugin.settings as any).featureDiscovery = {};
		}
		(this.plugin.settings as any).featureDiscovery.lastSeenVersion = this.plugin.manifest.version;
		(this.plugin.settings as any).featureDiscovery.dismissedFeatures = [];
		this.plugin.saveSettings();
	}

	/**
	 * Dismiss a specific feature (stop showing "new" badge for it)
	 */
	dismissFeature(featureId: string) {
		if (!this.plugin.settings.featureDiscovery) {
			(this.plugin.settings as any).featureDiscovery = {
				lastSeenVersion: '0.0.0',
				dismissedFeatures: [],
			};
		}

		const dismissed = this.plugin.settings.featureDiscovery?.dismissedFeatures || [];
		if (!dismissed.includes(featureId)) {
			dismissed.push(featureId);
			(this.plugin.settings as any).featureDiscovery.dismissedFeatures = dismissed;
			this.plugin.saveSettings();
		}
	}

	/**
	 * Check if a feature has been manually dismissed
	 */
	isFeatureDismissed(featureId: string): boolean {
		const dismissed = this.plugin.settings.featureDiscovery?.dismissedFeatures;
		return dismissed ? dismissed.includes(featureId) : false;
	}

	/**
	 * Check if feature should show "new" badge
	 * (new AND not dismissed)
	 */
	shouldShowNewBadge(featureId: string): boolean {
		return this.isFeatureIdNew(featureId) && !this.isFeatureDismissed(featureId);
	}

	/**
	 * Get feature by ID
	 */
	getFeature(featureId: string): Feature | undefined {
		return FEATURES.find((f) => f.id === featureId);
	}

	/**
	 * Compare semantic versions
	 * Returns: -1 if v1 < v2, 0 if equal, 1 if v1 > v2
	 */
	private compareVersions(v1: string, v2: string): number {
		const parts1 = v1.split('.').map(Number);
		const parts2 = v2.split('.').map(Number);

		for (let i = 0; i < 3; i++) {
			const p1 = parts1[i] || 0;
			const p2 = parts2[i] || 0;

			if (p1 > p2) return 1;
			if (p1 < p2) return -1;
		}

		return 0;
	}

	/**
	 * Get count of new features
	 */
	getNewFeatureCount(): number {
		return this.getNewFeatures().length;
	}

	/**
	 * Get all feature categories
	 */
	getCategories(): string[] {
		return [...new Set(FEATURES.map((f) => f.category))];
	}
}

/**
 * Add "new" badge to an element
 */
export function addNewBadge(element: HTMLElement, badge: 'new' | 'beta' | 'improved' | 'experimental' = 'new') {
	const badgeEl = element.createSpan({ cls: `mp-feature-badge mp-badge-${badge}` });
	badgeEl.textContent = badge.toUpperCase();

	// Add click to dismiss
	badgeEl.addEventListener('click', (e) => {
		e.stopPropagation();
		badgeEl.remove();
	});

	return badgeEl;
}

/**
 * Initialize feature discovery styles
 */
export function initFeatureDiscoveryStyles() {
	if (document.getElementById('mp-feature-discovery-styles')) {
		return;
	}

	const style = document.createElement('style');
	style.id = 'mp-feature-discovery-styles';
	style.textContent = `
		.mp-feature-badge {
			display: inline-block;
			padding: 2px 6px;
			margin-left: 8px;
			font-size: 0.7em;
			font-weight: 600;
			border-radius: 3px;
			vertical-align: middle;
			cursor: pointer;
			transition: opacity 0.15s;
		}

		.mp-feature-badge:hover {
			opacity: 0.7;
		}

		.mp-badge-new {
			background: var(--color-green);
			color: white;
		}

		.mp-badge-beta {
			background: var(--color-orange);
			color: white;
		}

		.mp-badge-improved {
			background: var(--color-blue);
			color: white;
		}

		.mp-badge-experimental {
			background: var(--color-purple);
			color: white;
		}

		/* Feature discovery panel */
		.mp-feature-discovery {
			padding: 16px;
		}

		.mp-feature-discovery-header {
			display: flex;
			justify-content: space-between;
			align-items: center;
			margin-bottom: 16px;
		}

		.mp-feature-discovery-title {
			font-size: 1.2em;
			font-weight: 600;
		}

		.mp-feature-discovery-dismiss-all {
			padding: 6px 12px;
			background: var(--interactive-accent);
			color: var(--text-on-accent);
			border: none;
			border-radius: 4px;
			cursor: pointer;
			font-size: 0.9em;
			transition: opacity 0.15s;
		}

		.mp-feature-discovery-dismiss-all:hover {
			opacity: 0.8;
		}

		.mp-feature-category {
			margin-bottom: 24px;
		}

		.mp-feature-category-title {
			font-size: 1em;
			font-weight: 600;
			margin-bottom: 12px;
			color: var(--text-normal);
			border-bottom: 1px solid var(--background-modifier-border);
			padding-bottom: 4px;
		}

		.mp-feature-item {
			display: flex;
			align-items: flex-start;
			gap: 12px;
			padding: 12px;
			margin-bottom: 8px;
			background: var(--background-secondary);
			border-radius: 6px;
			transition: background 0.15s;
		}

		.mp-feature-item:hover {
			background: var(--background-modifier-hover);
		}

		.mp-feature-item-badge {
			flex-shrink: 0;
		}

		.mp-feature-item-content {
			flex: 1;
		}

		.mp-feature-item-name {
			font-weight: 600;
			margin-bottom: 4px;
		}

		.mp-feature-item-description {
			color: var(--text-muted);
			font-size: 0.9em;
			line-height: 1.4;
		}

		.mp-feature-item-actions {
			display: flex;
			gap: 8px;
			margin-top: 8px;
		}

		.mp-feature-item-action {
			padding: 4px 10px;
			background: transparent;
			border: 1px solid var(--interactive-accent);
			color: var(--interactive-accent);
			border-radius: 4px;
			cursor: pointer;
			font-size: 0.85em;
			transition: all 0.15s;
		}

		.mp-feature-item-action:hover {
			background: var(--interactive-accent);
			color: var(--text-on-accent);
		}

		.mp-feature-empty {
			text-align: center;
			padding: 32px;
			color: var(--text-muted);
		}

		.mp-feature-empty-icon {
			font-size: 3em;
			margin-bottom: 16px;
			opacity: 0.5;
		}
	`;
	document.head.appendChild(style);
}
