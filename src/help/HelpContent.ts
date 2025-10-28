/**
 * Help topic interface
 */
export interface HelpTopic {
	id: string;
	title: string;
	category: HelpCategory;
	tags: string[];
	level: 'beginner' | 'intermediate' | 'advanced';
	content: string;
	relatedTopics?: string[];
	keyboardShortcut?: string;
}

/**
 * Help categories
 */
export type HelpCategory =
	| 'getting-started'
	| 'writing'
	| 'panels'
	| 'citations'
	| 'export'
	| 'backup'
	| 'customization'
	| 'keyboard-shortcuts'
	| 'troubleshooting';

/**
 * Category metadata
 */
export interface CategoryInfo {
	id: HelpCategory;
	name: string;
	icon: string;
	description: string;
}

/**
 * All help categories
 */
export const HELP_CATEGORIES: CategoryInfo[] = [
	{
		id: 'getting-started',
		name: 'Getting Started',
		icon: '🚀',
		description: 'New to Manuscript Pro? Start here!',
	},
	{
		id: 'writing',
		name: 'Writing & Focus',
		icon: '✍️',
		description: 'Focus mode, typewriter mode, and writing tools',
	},
	{
		id: 'panels',
		name: 'Panels & Workspace',
		icon: '🎨',
		description: 'Managing panels, workspaces, and layouts',
	},
	{
		id: 'citations',
		name: 'Citations & References',
		icon: '📚',
		description: 'BibTeX, cross-references, and citations',
	},
	{
		id: 'export',
		name: 'Export & Publishing',
		icon: '📤',
		description: 'Export to PDF, DOCX, LaTeX, and more',
	},
	{
		id: 'backup',
		name: 'Backup & Data',
		icon: '💾',
		description: 'Automatic backups and data management',
	},
	{
		id: 'customization',
		name: 'Customization',
		icon: '⚙️',
		description: 'Settings, templates, and personalization',
	},
	{
		id: 'keyboard-shortcuts',
		name: 'Keyboard Shortcuts',
		icon: '⌨️',
		description: 'All keyboard shortcuts and hotkeys',
	},
	{
		id: 'troubleshooting',
		name: 'Troubleshooting',
		icon: '🔧',
		description: 'Common issues and solutions',
	},
];

/**
 * Complete help topics database
 */
export const HELP_TOPICS: HelpTopic[] = [
	// Getting Started
	{
		id: 'welcome',
		title: 'Welcome to Manuscript Pro',
		category: 'getting-started',
		tags: ['introduction', 'overview'],
		level: 'beginner',
		content: `
# Welcome to Manuscript Pro

Manuscript Pro is a comprehensive plugin for academic writing and manuscript management in Obsidian.

## Key Features

- **LaTeX Concealment**: Hide LaTeX commands for cleaner reading
- **Citation Management**: BibTeX integration and citation tools
- **Panel System**: Organize your workspace with specialized panels
- **Export Tools**: Professional document export via Pandoc
- **Auto-Backup**: Never lose your work
- **Focus Mode**: Distraction-free writing

## Quick Start

1. Open the **Settings** tab to configure your preferences
2. Try a **Settings Template** for quick setup (Academic, Fiction, etc.)
3. Use **Mod+Shift+?** to open this help panel anytime

## Need Help?

Use the search bar above to find specific topics, or browse by category on the left.
		`.trim(),
		relatedTopics: ['settings-templates', 'keyboard-shortcuts-overview'],
	},
	{
		id: 'settings-templates',
		title: 'Using Settings Templates',
		category: 'getting-started',
		tags: ['settings', 'templates', 'quick-setup'],
		level: 'beginner',
		content: `
# Settings Templates

Settings templates provide pre-configured setups for common workflows.

## Available Templates

- **Academic Writing**: Citations, cross-references, LaTeX support
- **Fiction Writing**: Focus mode, character tracking, timeline
- **Technical Documentation**: Code blocks, diagrams, structured docs
- **Minimal & Clean**: Simple writing with basic features
- **Research & Notes**: Bibliography and note-taking
- **Screenwriting**: Scene management and character tracking

## How to Apply a Template

1. Open **Settings** → **Manuscript Pro**
2. Click **"Load Template"** button at the top
3. Choose your template
4. Confirm to apply

Templates merge with your existing settings, preserving your customizations where possible.
		`.trim(),
		relatedTopics: ['welcome', 'customization-overview'],
	},

	// Writing & Focus
	{
		id: 'focus-mode',
		title: 'Using Focus Mode',
		category: 'writing',
		tags: ['focus', 'writing', 'distraction-free'],
		level: 'beginner',
		keyboardShortcut: 'Mod+Shift+Z',
		content: `
# Focus Mode

Focus Mode helps you write without distractions by hiding UI elements and emphasizing your current text.

## Features

- **Hide Markdown Syntax**: Clean view without formatting marks
- **Typewriter Mode**: Keep cursor centered while writing
- **Dim Paragraphs**: Highlight active paragraph or sentence
- **Hide UI**: Minimize sidebars, status bar, and ribbon

## Keyboard Shortcut

Press **Mod+Shift+Z** to toggle Focus Mode on/off.

## Customization

In Settings → Focus Mode, you can:
- Choose active zone (sentence/paragraph/section)
- Adjust dim opacity
- Select which UI elements to hide
- Enable/disable typewriter scrolling
		`.trim(),
		relatedTopics: ['typewriter-mode', 'writing-stats'],
	},
	{
		id: 'typewriter-mode',
		title: 'Typewriter Mode',
		category: 'writing',
		tags: ['typewriter', 'writing', 'focus'],
		level: 'beginner',
		content: `
# Typewriter Mode

Typewriter Mode keeps your cursor vertically centered on the screen, reducing eye strain and maintaining focus.

## How It Works

As you type, the document scrolls automatically to keep the cursor in the middle of the screen, similar to a traditional typewriter.

## Enabling Typewriter Mode

1. Open Settings → Focus Mode
2. Enable "Typewriter Mode"
3. Or use the command: "Toggle: Typewriter Mode"

## Best Used With

Typewriter Mode works great with:
- Focus Mode (hide distractions)
- Dim Paragraphs (highlight active text)
- Hide Markdown Syntax (cleaner view)
		`.trim(),
		relatedTopics: ['focus-mode'],
	},

	// Panels & Workspace
	{
		id: 'panel-overview',
		title: 'Understanding Panels',
		category: 'panels',
		tags: ['panels', 'workspace', 'overview'],
		level: 'beginner',
		content: `
# Understanding Panels

Manuscript Pro provides specialized panels for different aspects of your work.

## Available Panels

- **Statistics** (Mod+Alt+S): Writing stats and progress
- **Outliner** (Mod+Alt+O): Manuscript structure
- **Characters** (Mod+Alt+C): Character database
- **Research** (Mod+Alt+R): Research notes
- **Timeline** (Mod+Alt+T): Story timeline
- **Validation** (Mod+Alt+V): Pre-publication checks
- **Label Browser** (Mod+Alt+L): Cross-references
- **Navigator** (Mod+Alt+N): Manuscript navigation
- **Style Checker** (Mod+Alt+K): Style consistency

## Opening Panels

Use keyboard shortcuts (above) or Command Palette:
1. Press **Mod+P**
2. Type the panel name
3. Press Enter

## Panel Features

- **Pin**: Keep panels open when switching workspaces
- **Refresh**: Update panel contents (Mod+Shift+R for all)
- **Close**: Right-click panel header → Close
		`.trim(),
		relatedTopics: ['panel-pinning', 'workspaces', 'keyboard-shortcuts-panels'],
	},
	{
		id: 'panel-pinning',
		title: 'Pinning Panels',
		category: 'panels',
		tags: ['panels', 'pinning', 'workspace'],
		level: 'intermediate',
		content: `
# Pinning Panels

Pin important panels to keep them open across workspace changes.

## How to Pin a Panel

1. Open the panel you want to pin
2. Click the **pin icon** in the panel header
3. The pin icon will turn accent-colored when pinned

## Pinned Panel Behavior

- **Stays open** when loading workspaces
- **Preserved** when closing other panels
- **Highlighted** with accent color pin icon

## Unpinning

Click the pin icon again to unpin the panel.

## Commands

- **Toggle All Pinned Panels**: Open/close all pinned panels at once
		`.trim(),
		relatedTopics: ['panel-overview', 'workspaces'],
	},
	{
		id: 'workspaces',
		title: 'Panel Workspaces',
		category: 'panels',
		tags: ['workspaces', 'panels', 'layouts'],
		level: 'intermediate',
		keyboardShortcut: 'Mod+Alt+W (save), Mod+Shift+Alt+W (load)',
		content: `
# Panel Workspaces

Save and load different panel layouts for different tasks.

## Use Cases

- **Writing Mode**: Outliner + Characters + Research
- **Editing Mode**: Validation + Style Checker + Stats
- **Review Mode**: Navigator + Timeline + Characters

## Saving a Workspace

1. Arrange your panels as desired
2. Press **Mod+Alt+W** (or use Command Palette)
3. Enter a workspace name
4. Press Enter

## Loading a Workspace

1. Press **Mod+Shift+Alt+W**
2. Select from your saved workspaces
3. Press Enter

## Workspace Behavior

- **Pinned panels** are preserved
- **Non-pinned panels** are closed before loading
- **Auto-restore** option available in Settings

## Managing Workspaces

- **Delete**: Command Palette → "Panel: Delete Workspace"
- **View**: Settings → Panel Management
		`.trim(),
		relatedTopics: ['panel-overview', 'panel-pinning'],
	},

	// Citations & References
	{
		id: 'citations-overview',
		title: 'Citation Management',
		category: 'citations',
		tags: ['citations', 'bibtex', 'bibliography'],
		level: 'intermediate',
		content: `
# Citation Management

Manuscript Pro integrates with BibTeX for powerful citation management.

## Setup

1. **Create a .bib file** in your vault
2. Open Settings → Citations
3. Set "Bibliography Paths" to your .bib file(s)
4. Enable "Citation Support"

## Adding Citations

Use standard Pandoc citation syntax:
\`\`\`
[@smith2020] says that...
Multiple citations [@smith2020; @jones2021]
In-text: @smith2020 argues...
\`\`\`

## Features

- **Hover Preview**: Hover over citations to see full reference
- **Auto-complete**: Start typing @ to get citation suggestions
- **Import**: Import from DOI, arXiv, or PubMed
- **Styles**: Choose citation style (APA, Chicago, MLA, etc.)

## Export

Citations are automatically formatted when exporting via Pandoc.
		`.trim(),
		relatedTopics: ['cross-references', 'export-overview'],
	},
	{
		id: 'cross-references',
		title: 'Cross-References',
		category: 'citations',
		tags: ['cross-references', 'labels', 'equations'],
		level: 'intermediate',
		keyboardShortcut: 'Mod+Alt+L (Label Browser)',
		content: `
# Cross-References

Reference equations, figures, tables, and sections throughout your document.

## Creating Labels

Use LaTeX label syntax:
\`\`\`latex
\\label{eq:pythagorean}
\\label{fig:diagram}
\\label{tab:results}
\`\`\`

## Referencing Labels

\`\`\`latex
See equation \\ref{eq:pythagorean}
As shown in \\eqref{eq:pythagorean}
\`\`\`

## Label Browser

Press **Mod+Alt+L** to open the Label Browser:
- View all labels in your vault
- Search and filter labels
- Click to jump to definition
- Rename labels (updates all references)

## Auto-complete

Start typing \\ref{ and get label suggestions.

## Validation

The Validation Panel checks for:
- Undefined references
- Duplicate labels
- Broken cross-references
		`.trim(),
		relatedTopics: ['citations-overview', 'label-browser'],
	},

	// Export & Publishing
	{
		id: 'export-overview',
		title: 'Exporting Documents',
		category: 'export',
		tags: ['export', 'pandoc', 'pdf', 'docx'],
		level: 'intermediate',
		content: `
# Exporting Documents

Export your manuscripts to professional formats using Pandoc.

## Supported Formats

- **PDF**: Academic papers, books, reports
- **DOCX**: Microsoft Word documents
- **LaTeX**: .tex source files
- **HTML**: Web-ready documents
- **EPUB**: E-books

## Requirements

**Pandoc must be installed** on your system.
Download from: https://pandoc.org

## Quick Export

1. Open your document
2. Command Palette → "Quick Export to PDF" (or DOCX)
3. Select output location

## Export Profiles

Use profiles for consistent formatting:
- Academic Paper (APA, Chicago, etc.)
- Book Manuscript
- Technical Documentation
- Conference Paper

Settings → Export → Manage Profiles

## Advanced Options

- Custom templates
- Citation styles (CSL)
- Filters and extensions
- Metadata frontmatter
		`.trim(),
		relatedTopics: ['export-profiles', 'citations-overview'],
	},

	// Backup & Data
	{
		id: 'backup-overview',
		title: 'Automatic Backups',
		category: 'backup',
		tags: ['backup', 'data', 'safety'],
		level: 'beginner',
		keyboardShortcut: 'Mod+Shift+B (create backup)',
		content: `
# Automatic Backups

Never lose your work with automatic backups.

## How It Works

- **Automatic**: Backups created every 30 minutes (configurable)
- **Comprehensive**: Includes all plugin data and settings
- **Smart Cleanup**: Keeps only recent backups (default: 10)
- **Safe Storage**: Saved in your vault at \`.manuscript-pro-backups/\`

## Manual Backup

Press **Mod+Shift+B** to create a backup immediately.

## Managing Backups

Command Palette → "Backup: Browse & Restore Backups"

The Backup Browser shows:
- List of all backups with dates
- Backup size and age
- One-click restore
- Delete old backups

## Restore Process

1. Open Backup Browser
2. Select a backup
3. Click "Restore"
4. Confirm (creates safety backup first)
5. Plugin reloads with restored data

## Export Backups

Command → "Backup: Export as Download" creates a downloadable JSON file for safekeeping outside your vault.

## Configuration

Settings → Backup:
- Enable/disable auto-backup
- Set interval (minutes)
- Maximum backups to keep
- Include settings/data options
		`.trim(),
		relatedTopics: ['backup-restore', 'data-export'],
	},

	// Keyboard Shortcuts
	{
		id: 'keyboard-shortcuts-overview',
		title: 'Keyboard Shortcuts Overview',
		category: 'keyboard-shortcuts',
		tags: ['keyboard', 'shortcuts', 'hotkeys'],
		level: 'beginner',
		content: `
# Keyboard Shortcuts

Master Manuscript Pro with keyboard shortcuts.

## Panel Shortcuts (Mod+Alt)

All panel shortcuts use **Mod+Alt + Letter**:

- **S**: Statistics Panel
- **O**: Outliner
- **C**: Characters
- **R**: Research
- **T**: Timeline
- **V**: Validation
- **L**: Label Browser
- **N**: Navigator
- **K**: Style Checker (K for checKer)

## Workspace Shortcuts

- **Mod+Alt+W**: Save current workspace
- **Mod+Shift+Alt+W**: Load workspace

## Other Shortcuts

- **Mod+Shift+Z**: Toggle Focus Mode
- **Mod+Shift+B**: Create Backup
- **Mod+Shift+R**: Refresh All Panels
- **Mod+Shift+?**: Open Help Panel

## Customization

All shortcuts can be customized:
1. Settings → Hotkeys
2. Search "Manuscript Pro"
3. Click + to add custom hotkey
4. Press your desired key combination

## Tip: Mnemonic System

Panel shortcuts use memorable letters:
S=Stats, O=Outliner, C=Characters, R=Research, etc.
		`.trim(),
		relatedTopics: ['keyboard-shortcuts-panels', 'customization-overview'],
	},
	{
		id: 'keyboard-shortcuts-panels',
		title: 'Panel Keyboard Shortcuts',
		category: 'keyboard-shortcuts',
		tags: ['keyboard', 'panels', 'shortcuts'],
		level: 'beginner',
		content: `
# Panel Keyboard Shortcuts

Quick access to all panels with Mod+Alt combinations.

## Complete List

| Shortcut | Panel |
|----------|-------|
| Mod+Alt+S | Statistics Panel |
| Mod+Alt+O | Outliner Panel |
| Mod+Alt+C | Character Database |
| Mod+Alt+R | Research Notes |
| Mod+Alt+T | Timeline |
| Mod+Alt+V | Validation Panel |
| Mod+Alt+L | Label Browser |
| Mod+Alt+N | Navigator |
| Mod+Alt+K | Style Checker |

**Note**: Mod = Ctrl on Windows/Linux, Cmd on macOS

## Tips

- Press the shortcut again to focus an already-open panel
- Panels open in the right sidebar by default
- Use with workspaces for fast context switching

## Related Commands

- **Refresh All**: Mod+Shift+R
- **Close Non-Pinned**: Command Palette
- **Toggle Pinned**: Command Palette
		`.trim(),
		relatedTopics: ['keyboard-shortcuts-overview', 'panel-overview'],
	},

	// Troubleshooting
	{
		id: 'troubleshooting-export',
		title: 'Export Troubleshooting',
		category: 'troubleshooting',
		tags: ['troubleshooting', 'export', 'pandoc'],
		level: 'intermediate',
		content: `
# Export Troubleshooting

Common export issues and solutions.

## "Pandoc not found"

**Problem**: Export fails with "Pandoc not found" error.

**Solution**:
1. Install Pandoc from https://pandoc.org
2. Restart Obsidian
3. If still failing, set Pandoc path manually:
   - Settings → Export → Pandoc Path
   - Enter full path to pandoc executable

## Citations Not Appearing

**Problem**: Citations show as [@key] instead of formatted references.

**Solution**:
1. Check BibTeX file path in Settings → Citations
2. Ensure bibliography path is correct in export profile
3. Verify .bib file has valid BibTeX syntax
4. Enable "Citeproc" in export profile

## LaTeX Errors in PDF

**Problem**: PDF export fails with LaTeX errors.

**Solution**:
1. Check LaTeX syntax in your document
2. Common issues:
   - Unescaped special characters (& % $ # _ { })
   - Mismatched braces
   - Invalid LaTeX commands
3. Try HTML export to isolate the issue
4. Enable "Verbose Logging" in Settings → Export

## Permission Denied

**Problem**: "Permission denied" when exporting.

**Solution**:
1. Close the output file if it's open
2. Check folder permissions
3. Try exporting to a different location
4. Run Obsidian as administrator (Windows)
		`.trim(),
		relatedTopics: ['export-overview', 'troubleshooting-general'],
	},
	{
		id: 'troubleshooting-general',
		title: 'General Troubleshooting',
		category: 'troubleshooting',
		tags: ['troubleshooting', 'bugs', 'issues'],
		level: 'beginner',
		content: `
# General Troubleshooting

Solutions to common issues.

## Plugin Not Loading

1. Check Settings → Community Plugins → Enable "Manuscript Pro"
2. Restart Obsidian (Ctrl+R)
3. Check for conflicting plugins
4. Reinstall the plugin

## Features Not Working

1. Check if feature is enabled in Settings
2. Try disabling/re-enabling the plugin
3. Check for error messages in Developer Console (Ctrl+Shift+I)
4. Reset to default settings (Settings → Advanced → Reset)

## Slow Performance

1. Reduce backup frequency (Settings → Backup)
2. Limit files to index (Settings → Cross-References)
3. Disable unused features
4. Check Debug Mode logs for bottlenecks

## Data Loss Prevention

1. Enable auto-backup (Settings → Backup)
2. Create manual backups regularly (Mod+Shift+B)
3. Export settings (Settings → Export Settings)
4. Keep backups outside vault for safety

## Getting Help

1. Check documentation in this Help Panel
2. Search for similar issues on GitHub
3. Report bugs: https://github.com/Skquark/obsidian-manuscript-pro/issues
4. Include:
   - Plugin version
   - Obsidian version
   - Error messages
   - Steps to reproduce
		`.trim(),
		relatedTopics: ['troubleshooting-export', 'backup-overview'],
	},
];

/**
 * Get topics by category
 */
export function getTopicsByCategory(category: HelpCategory): HelpTopic[] {
	return HELP_TOPICS.filter((topic) => topic.category === category);
}

/**
 * Get topic by ID
 */
export function getTopicById(id: string): HelpTopic | undefined {
	return HELP_TOPICS.find((topic) => topic.id === id);
}

/**
 * Search topics
 */
export function searchTopics(query: string): HelpTopic[] {
	const lowerQuery = query.toLowerCase().trim();

	if (!lowerQuery) {
		return HELP_TOPICS;
	}

	return HELP_TOPICS.filter((topic) => {
		// Search in title
		if (topic.title.toLowerCase().includes(lowerQuery)) {
			return true;
		}

		// Search in tags
		if (topic.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))) {
			return true;
		}

		// Search in content
		if (topic.content.toLowerCase().includes(lowerQuery)) {
			return true;
		}

		return false;
	});
}

/**
 * Get related topics
 */
export function getRelatedTopics(topicId: string): HelpTopic[] {
	const topic = getTopicById(topicId);

	if (!topic || !topic.relatedTopics) {
		return [];
	}

	return topic.relatedTopics
		.map((id) => getTopicById(id))
		.filter((t): t is HelpTopic => t !== undefined);
}
