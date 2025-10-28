import { PluginSettings } from '../interfaces/plugin-settings';

/**
 * Deep Partial - Makes all properties optional, recursively
 */
type DeepPartial<T> = {
	[P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Settings Template Definition
 */
export interface SettingsTemplate {
	id: string;
	name: string;
	description: string;
	category: 'academic' | 'fiction' | 'technical' | 'minimal';
	icon: string;
	settings: DeepPartial<PluginSettings>;
}

/**
 * Predefined Settings Templates
 */
export const SETTINGS_TEMPLATES: SettingsTemplate[] = [
	{
		id: 'academic-full',
		name: 'Academic Writing (Full)',
		description: 'Complete setup for academic papers with citations, cross-references, and LaTeX support',
		category: 'academic',
		icon: '🎓',
		settings: {
			enabled: true,
			enableInLivePreview: true,
			enableInReadingMode: true,
			groups: {
				mathDelimiters: true,
				citations: true,
				latexCommands: true,
				pandocMarkup: true,
				indexingMeta: true,
			},
			cursorReveal: {
				enabled: true,
				delay: 100,
				revealParagraph: false,
				highlightRevealed: true,
				highlightColor: '#ffeb3b33',
			},
			focusMode: {
				enabled: false,
				hideMarkdownSyntax: true,
				hideHeadingMarkers: false,
				hideListMarkers: false,
			},
			citations: {
				enabled: true,
				showTooltip: true,
			},
			manuscriptNavigator: {
				enabled: true,
			},
			validation: {
				enabled: true,
			},
		},
	},
	{
		id: 'fiction-writer',
		name: 'Fiction Writing',
		description: 'Optimized for fiction with focus mode, character tracking, and timeline management',
		category: 'fiction',
		icon: '📚',
		settings: {
			enabled: true,
			enableInLivePreview: true,
			enableInReadingMode: false,
			groups: {
				mathDelimiters: false,
				citations: false,
				latexCommands: false,
				pandocMarkup: true,
				indexingMeta: false,
			},
			cursorReveal: {
				enabled: true,
				delay: 150,
				revealParagraph: true,
				highlightRevealed: false,
			},
			focusMode: {
				enabled: true,
				hideMarkdownSyntax: true,
				hideHeadingMarkers: true,
				hideListMarkers: true,
				typewriterMode: true,
				hideStatusBar: true,
				hideRibbon: true,
			},
			characters: {
				enabled: true,
			},
			timeline: {
				enabled: true,
			},
			outliner: {
				enabled: true,
			},
		},
	},
	{
		id: 'technical-docs',
		name: 'Technical Documentation',
		description: 'Code blocks, diagrams, and structured documentation with minimal distraction',
		category: 'technical',
		icon: '⚙️',
		settings: {
			enabled: true,
			enableInLivePreview: true,
			enableInReadingMode: true,
			groups: {
				mathDelimiters: true,
				citations: false,
				latexCommands: false,
				pandocMarkup: true,
				indexingMeta: true,
			},
			cursorReveal: {
				enabled: true,
				delay: 100,
				revealParagraph: false,
				highlightRevealed: false,
			},
			focusMode: {
				enabled: false,
				hideMarkdownSyntax: false,
			},
			validation: {
				enabled: true,
			},
			export: {
				enabled: true,
			},
		},
	},
	{
		id: 'minimal-clean',
		name: 'Minimal & Clean',
		description: 'Simple writing experience with basic features and minimal UI elements',
		category: 'minimal',
		icon: '✨',
		settings: {
			enabled: true,
			enableInLivePreview: true,
			enableInReadingMode: false,
			groups: {
				mathDelimiters: false,
				citations: false,
				latexCommands: false,
				pandocMarkup: false,
				indexingMeta: false,
			},
			cursorReveal: {
				enabled: true,
				delay: 100,
				revealParagraph: true,
				highlightRevealed: false,
			},
			focusMode: {
				enabled: true,
				hideMarkdownSyntax: true,
				hideHeadingMarkers: true,
				hideListMarkers: true,
				typewriterMode: false,
			},
			showStatusBar: false,
			showRibbonIcon: false,
		},
	},
	{
		id: 'research-heavy',
		name: 'Research & Notes',
		description: 'Research management, bibliography, and note-taking with citation support',
		category: 'academic',
		icon: '🔬',
		settings: {
			enabled: true,
			enableInLivePreview: true,
			groups: {
				mathDelimiters: false,
				citations: true,
				latexCommands: false,
				pandocMarkup: true,
				indexingMeta: true,
			},
			citations: {
				enabled: true,
				showTooltip: true,
			},
			research: {
				enabled: true,
			},
			characters: {
				enabled: false,
			},
			timeline: {
				enabled: false,
			},
		},
	},
	{
		id: 'screenwriter',
		name: 'Screenwriting',
		description: 'Scene management, character tracking, and dialogue formatting',
		category: 'fiction',
		icon: '🎬',
		settings: {
			enabled: true,
			enableInLivePreview: true,
			groups: {
				mathDelimiters: false,
				citations: false,
				latexCommands: false,
				pandocMarkup: true,
				indexingMeta: false,
			},
			focusMode: {
				enabled: true,
				hideMarkdownSyntax: true,
				typewriterMode: true,
			},
			characters: {
				enabled: true,
			},
			outliner: {
				enabled: true,
			},
			timeline: {
				enabled: true,
			},
		},
	},
];

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category?: string): SettingsTemplate[] {
	if (!category) return SETTINGS_TEMPLATES;
	return SETTINGS_TEMPLATES.filter((t) => t.category === category);
}

/**
 * Get template by ID
 */
export function getTemplateById(id: string): SettingsTemplate | undefined {
	return SETTINGS_TEMPLATES.find((t) => t.id === id);
}

/**
 * Merge template settings with current settings
 */
export function applyTemplate(
	currentSettings: PluginSettings,
	template: SettingsTemplate
): PluginSettings {
	return {
		...currentSettings,
		...template.settings,
	} as PluginSettings;
}
