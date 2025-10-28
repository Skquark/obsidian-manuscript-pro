/**
 * Quick tips database
 * Tips are shown in rotation to help users discover features
 */

export interface QuickTip {
	id: string;
	category: string;
	text: string;
	linkToTopic?: string; // Optional link to help topic
	command?: string; // Optional command to run
}

export const QUICK_TIPS: QuickTip[] = [
	// Focus Mode Tips
	{
		id: 'focus-mode-toggle',
		category: 'Focus Mode',
		text: 'Press Mod+Shift+Z to toggle Focus Mode for distraction-free writing.',
		linkToTopic: 'focus-mode',
	},
	{
		id: 'typewriter-mode',
		category: 'Focus Mode',
		text: 'Enable Typewriter Mode in Focus Mode settings to keep your cursor centered while typing.',
		linkToTopic: 'focus-mode',
	},
	{
		id: 'dim-opacity',
		category: 'Focus Mode',
		text: 'Adjust the dim opacity in Focus Mode to control how much inactive text is dimmed.',
		linkToTopic: 'focus-mode',
	},

	// Citation Tips
	{
		id: 'citation-import',
		category: 'Citations',
		text: 'Import citations directly from DOI, arXiv, or PubMed using the citation importer.',
		linkToTopic: 'citations',
	},
	{
		id: 'citation-hover',
		category: 'Citations',
		text: 'Hover over citation keys to see formatted previews in your selected citation style.',
		linkToTopic: 'citations',
	},
	{
		id: 'bibliography-path',
		category: 'Citations',
		text: 'Configure your BibTeX file path in settings to enable citation features.',
		linkToTopic: 'citations',
	},

	// Export Tips
	{
		id: 'export-profiles',
		category: 'Export',
		text: 'Create custom export profiles for different publishers or document types.',
		linkToTopic: 'export',
	},
	{
		id: 'pandoc-required',
		category: 'Export',
		text: 'Install Pandoc to enable professional document export (PDF, DOCX, LaTeX).',
		linkToTopic: 'export',
	},
	{
		id: 'batch-export',
		category: 'Export',
		text: 'Use the Manuscript Navigator to export multiple chapters at once.',
		linkToTopic: 'manuscript-navigator',
	},

	// Manuscript Navigator Tips
	{
		id: 'navigator-panel',
		category: 'Manuscript Navigator',
		text: 'Press Mod+Alt+N to open the Manuscript Navigator for quick chapter navigation.',
		linkToTopic: 'manuscript-navigator',
	},
	{
		id: 'word-counts',
		category: 'Manuscript Navigator',
		text: 'Track word counts per chapter automatically in the Manuscript Navigator.',
		linkToTopic: 'manuscript-navigator',
	},
	{
		id: 'reorder-chapters',
		category: 'Manuscript Navigator',
		text: 'Drag and drop chapters in the Manuscript Navigator to reorder your manuscript.',
		linkToTopic: 'manuscript-navigator',
	},

	// Statistics Tips
	{
		id: 'stats-panel',
		category: 'Statistics',
		text: 'Press Mod+Alt+S to open the Statistics Panel and track your writing progress.',
		linkToTopic: 'statistics',
	},
	{
		id: 'writing-goals',
		category: 'Statistics',
		text: 'Set daily writing goals in the Statistics Panel to track your progress.',
		linkToTopic: 'statistics',
	},
	{
		id: 'session-tracking',
		category: 'Statistics',
		text: 'Enable session tracking to see detailed statistics about your writing sessions.',
		linkToTopic: 'statistics',
	},

	// Cross-Reference Tips
	{
		id: 'crossref-autocomplete',
		category: 'Cross-References',
		text: 'Type \\ref{ to see autocomplete suggestions for all labels in your manuscript.',
		linkToTopic: 'cross-references',
	},
	{
		id: 'label-browser',
		category: 'Cross-References',
		text: 'Use the Label Browser to view and manage all \\label{} commands in your manuscript.',
		linkToTopic: 'cross-references',
	},
	{
		id: 'crossref-validation',
		category: 'Cross-References',
		text: 'Enable validation-on-save to catch broken cross-references before export.',
		linkToTopic: 'cross-references',
	},

	// Template Tips
	{
		id: 'template-inserter',
		category: 'Templates',
		text: 'Press Mod+Alt+T to insert templates for common document structures.',
		linkToTopic: 'templates',
	},
	{
		id: 'snippet-triggers',
		category: 'Templates',
		text: 'Enable snippet triggers to expand abbreviations as you type.',
		linkToTopic: 'templates',
	},
	{
		id: 'custom-templates',
		category: 'Templates',
		text: 'Create custom templates in your templates folder for reusable content.',
		linkToTopic: 'templates',
	},

	// Concealment Tips
	{
		id: 'concealment-toggle',
		category: 'Concealment',
		text: 'Toggle concealment patterns on/off to see the raw LaTeX when needed.',
		linkToTopic: 'concealment',
	},
	{
		id: 'custom-patterns',
		category: 'Concealment',
		text: 'Add custom concealment patterns in settings to hide your own LaTeX commands.',
		linkToTopic: 'concealment',
	},
	{
		id: 'cursor-reveal',
		category: 'Concealment',
		text: 'Enable cursor reveal to automatically show LaTeX syntax near your cursor.',
		linkToTopic: 'concealment',
	},

	// General Tips
	{
		id: 'help-panel',
		category: 'General',
		text: 'Press Mod+Shift+/ to open the help panel and search for documentation.',
		linkToTopic: 'getting-started',
	},
	{
		id: 'command-palette',
		category: 'General',
		text: 'Press Ctrl/Cmd+P to access all Manuscript Pro commands from the command palette.',
	},
	{
		id: 'panel-pinning',
		category: 'General',
		text: 'Right-click panel tabs to pin them, keeping them open across sessions.',
		linkToTopic: 'getting-started',
	},
	{
		id: 'panel-workspaces',
		category: 'General',
		text: 'Save panel layouts as workspaces for different writing contexts (editing, reviewing, etc.).',
		linkToTopic: 'getting-started',
	},

	// Validation Tips
	{
		id: 'validation-panel',
		category: 'Validation',
		text: 'Run pre-publication validation to check for broken references, citations, and figures.',
		linkToTopic: 'validation',
	},
	{
		id: 'auto-validation',
		category: 'Validation',
		text: 'Enable auto-validate-on-save to catch issues as you write.',
		linkToTopic: 'validation',
	},

	// Quality Tips
	{
		id: 'checklist',
		category: 'Quality',
		text: 'Use the pre-publication checklist to ensure your manuscript is ready for submission.',
		linkToTopic: 'quality',
	},
	{
		id: 'readability',
		category: 'Quality',
		text: 'Run readability analysis to ensure your writing matches your target audience.',
		linkToTopic: 'quality',
	},

	// Outliner Tips
	{
		id: 'outliner-panel',
		category: 'Outliner',
		text: 'Use the Scene/Chapter Outliner to structure your manuscript before writing.',
		linkToTopic: 'outliner',
	},
	{
		id: 'scene-metadata',
		category: 'Outliner',
		text: 'Track scene metadata like POV, setting, and status in the Outliner.',
		linkToTopic: 'outliner',
	},

	// Character Database Tips
	{
		id: 'character-db',
		category: 'Characters',
		text: 'Maintain a character database to track appearances and relationships.',
		linkToTopic: 'characters',
	},
	{
		id: 'character-appearances',
		category: 'Characters',
		text: 'Enable appearance tracking to see which characters appear in each chapter.',
		linkToTopic: 'characters',
	},

	// Research Tips
	{
		id: 'research-panel',
		category: 'Research',
		text: 'Use the Research Notes Panel to organize background information and sources.',
		linkToTopic: 'research',
	},
	{
		id: 'research-folders',
		category: 'Research',
		text: 'Organize research notes into folders by topic or chapter.',
		linkToTopic: 'research',
	},

	// Style Checker Tips
	{
		id: 'style-checker',
		category: 'Style',
		text: 'Enable the Style Consistency Checker to maintain consistent writing style.',
		linkToTopic: 'style-checker',
	},
	{
		id: 'custom-style-rules',
		category: 'Style',
		text: 'Create custom style rules for project-specific terminology and formatting.',
		linkToTopic: 'style-checker',
	},

	// Backup Tips
	{
		id: 'auto-backup',
		category: 'Backup',
		text: 'Enable auto-backup to protect your manuscript data and settings.',
		linkToTopic: 'backup',
	},
	{
		id: 'backup-interval',
		category: 'Backup',
		text: 'Adjust backup interval to balance protection with storage space.',
		linkToTopic: 'backup',
	},
];

/**
 * Get a tip for a specific day (deterministic rotation)
 */
export function getTipForDay(date: Date = new Date()): QuickTip {
	// Use date string as seed for deterministic rotation
	const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD

	// Simple hash function for date string
	let hash = 0;
	for (let i = 0; i < dateString.length; i++) {
		hash = (hash << 5) - hash + dateString.charCodeAt(i);
		hash = hash & hash; // Convert to 32-bit integer
	}

	// Use hash to select tip (always the same for the same date)
	const index = Math.abs(hash) % QUICK_TIPS.length;
	return QUICK_TIPS[index];
}

/**
 * Get random tip (for manual refresh)
 */
export function getRandomTip(): QuickTip {
	return QUICK_TIPS[Math.floor(Math.random() * QUICK_TIPS.length)];
}

/**
 * Get tips by category
 */
export function getTipsByCategory(category: string): QuickTip[] {
	return QUICK_TIPS.filter((tip) => tip.category === category);
}

/**
 * Get all categories
 */
export function getTipCategories(): string[] {
	return [...new Set(QUICK_TIPS.map((tip) => tip.category))];
}
