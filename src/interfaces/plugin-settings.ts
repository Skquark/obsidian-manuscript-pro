import type { TemplateConfiguration } from '../export/TemplateConfiguration';
import type { ChecklistType, PublicationChecklist } from '../quality/QualityInterfaces';

export interface Pattern {
	regex: RegExp;
	regexString: string; // Store string version for serialization
	replacement: string;
	description?: string;
}

export interface PatternGroup {
	id: string;
	name: string;
	description: string;
	enabled: boolean;
	patterns: Pattern[];
}

export interface PluginSettings {
	// Master toggle
	enabled: boolean;

	// Mode toggles
	enableInLivePreview: boolean;
	enableInReadingMode: boolean;
	enableInSourceMode: boolean;

	// Pattern groups
	groups: {
		mathDelimiters: boolean;
		citations: boolean;
		latexCommands: boolean;
		pandocMarkup: boolean;
		indexingMeta: boolean;
	};

	// Cursor revealing
	cursorReveal: {
		enabled: boolean;
		delay: number;
		revealParagraph: boolean;
		highlightRevealed: boolean;
		highlightColor: string;
	};

	// UI
	showStatusBar: boolean;
	showRibbonIcon: boolean;
	showConcealedCount: boolean;

	// Focus Mode
	focusMode: {
		enabled: boolean;
		// Markdown concealment
		hideMarkdownSyntax: boolean;
		hideHeadingMarkers: boolean;
		hideListMarkers: boolean;
		hideBlockquoteMarkers: boolean;
		hideInlineCode: boolean;
		// Typewriter mode
		typewriterMode: boolean;
		activeZone: 'sentence' | 'paragraph' | 'section';
		dimOpacity: number; // 0.1-0.9
		highlightActive: boolean;
		highlightColor: string;
		// Reading width
		centerText: boolean;
		lineWidth: number; // characters, 40-120
		// UI minimization
		hideExplorer: boolean;
		hideStatusBar: boolean;
		hideRibbon: boolean;
		enterFullscreen: boolean;
	};

	// Statistics Panel
	statistics: {
		enabled: boolean;
		showInSidebar: boolean;
		autoRefresh: boolean;
		refreshInterval: number; // seconds
		trackHistory: boolean;
		showGoals: boolean;
	};

	// Citation Preview
	citations: {
		enabled: boolean;
		showTooltip: boolean;
		citationStyle: string; // APA, Chicago, MLA, etc.
		showVisualIndicators: boolean;
		bibliographyPaths: string[]; // User-configured .bib file paths
		bibliographyFile?: string; // Primary bibliography file path
		cacheTimeout: number; // minutes
	};

	// Cross-Reference Intelligence
	crossRef: {
		enabled: boolean;
		autoComplete: boolean;
		showLabelBrowser: boolean;
		validateOnSave: boolean;
		indexOnStartup: boolean;
		maxFilesToIndex: number; // Limit for very large vaults (0 = unlimited)
		showIndexStats: boolean; // Show index statistics in console/notices
	};

	// Manuscript Navigator
	manuscriptNavigator: {
		enabled: boolean; // Master toggle
		showInSidebar: boolean; // Auto-open on startup
		configFile: string; // Path to book.json (default: "book.json")

		// Display options
		showWordCount: boolean; // Show word counts
		showFigureCount: boolean; // Show figure counts
		showCitationCount: boolean; // Show citation counts
		showLastModified: boolean; // Show timestamps

		// Behavior
		autoRefreshStats: boolean; // Recalc on file change
		confirmReorder: boolean; // Confirm before reordering
		expandPartsOnLoad: boolean; // Expand all parts by default

		// Goals
		defaultChapterWordGoal: number; // Default word count goal per chapter
		totalWordGoal: number; // Total manuscript word count goal
	};

	// Pre-publication Validation
	validation: {
		enabled: boolean;
		autoValidateOnSave: boolean;
		showPanel: boolean;

		// Rule toggles
		validateReferences: boolean;
		validateCitations: boolean;
		validateFigures: boolean;
		validateTables: boolean;
		validateEquations: boolean;
		validateStructure: boolean;

		// Display options
		groupByCategory: boolean;
		hideInfoLevel: boolean;
		showOnlyErrors: boolean;
	};

	// Export & Publishing
	export: {
		enabled: boolean;
		pandocPath?: string;
		defaultOutputDir?: string;
		defaultCslPath?: string;
		openAfterExport: boolean;

		profiles: any[]; // ExportProfile[] - avoid circular dependency
		defaultProfileId?: string;

	templateDirectory?: string;
	maxConcurrentExports: number;
	keepIntermediateFiles: boolean;
	verboseLogging: boolean;

	// PDF compression
	ghostscriptPath?: string;

	// EPUB validation
	epubCheckPath?: string;

	// Template configurations
	templateConfigs?: Record<string, TemplateConfiguration>;
	defaultTemplateConfigId?: string;
	templateAssignments?: Record<string, string>;

	// Generated assets from front matter / metadata tools
	generatedLatexPreamble?: string;
	generatedEpubMetadata?: Record<string, string>;
	generatedAssetsUpdatedAt?: number;
};

	// Enhanced Bibliography
	enhancedBib: {
		enabled: boolean;

		// Auto-import
		enableAutoImport: boolean;
		preferredFormat: 'bibtex' | 'json';

		// External APIs
		apiConfig: {
			crossrefEmail?: string;
			pubmedApiKey?: string;
			pubmedEmail?: string;
			rateLimitDelay?: number;
		};

		// Duplicate detection
		enableDuplicateDetection: boolean;
		duplicateSimilarityThreshold: number;
		autoMergeDuplicates: boolean;

		// Smart suggestions
		enableSmartSuggestions: boolean;
		suggestionContextWindow: number;
		maxSuggestions: number;

		// Analytics
		trackCitationUsage: boolean;
		showAnalytics: boolean;
	};

	// Template & Snippet System
	templates: {
		enabled: boolean;
		customTemplatesPath: string;
		customSnippetsPath: string;
		enableTriggers: boolean;
		showTemplateInserter: boolean;
		enableVariableHints: boolean;
	};

	// Quality & Workflow Enhancements
	quality: {
		// Pre-Publication Checklist
		checklist: {
			enabled: boolean;
			showPanel: boolean;
			autoCheckEnabled: boolean;
			defaultType: 'academic-paper' | 'thesis' | 'technical-doc' | 'conference-paper' | 'grant-proposal';
			templates?: Partial<Record<ChecklistType, PublicationChecklist>>;
		};

		// Enhanced Progress Tracking
		progress: {
			enabled: boolean;
			trackSessions: boolean;
			trackStreaks: boolean;
			calculateVelocity: boolean;
			showInStatusBar: boolean;
			autoSnapshot: boolean;
			snapshotInterval: number; // minutes
		};

		// Research Knowledge Base
		researchBible: {
			enabled: boolean;
			autoDetectTerms: boolean;
			checkConsistency: boolean;
			showInlineHints: boolean;
			exportFormat: 'markdown' | 'latex' | 'html';
		};

		// Readability Analysis
		readability: {
			enabled: boolean;
			targetAudience: 'general-public' | 'undergraduate' | 'graduate' | 'expert' | 'journal';
			showInlineWarnings: boolean;
			analyzeSections: boolean;
			highlightPassiveVoice: boolean;
			exportReports: boolean;
		};
	};

	// Scene/Chapter Outliner
	outliner: {
		enabled: boolean;
		showInSidebar: boolean;
		expandByDefault: boolean;
		showWordCounts: boolean;
		showSceneMetadata: boolean;
		showStatus: boolean;
		manuscriptStructures?: Record<string, any>; // ManuscriptStructure[]
		outlinerState?: {
			currentManuscriptId?: string;
			expandedItems?: string[];
		};
	};

	// Character Database
	characters: {
		enabled: boolean;
		showInSidebar: boolean;
		groupBy: 'role' | 'importance' | 'alphabetical' | 'recent';
		showAppearances: boolean;
		showRelationships: boolean;
		charactersData?: Record<string, any>; // Character[]
	};

	// Research Notes Panel
	research: {
		enabled: boolean;
		showInSidebar: boolean;
		groupBy: 'category' | 'priority' | 'status' | 'recent' | 'folders';
		showSummaries: boolean;
		showCitations: boolean;
		showTags: boolean;
		researchNotes?: Record<string, any>; // ResearchNote[]
		researchFolders?: Record<string, any>; // ResearchFolder[]
	};

	// Style Consistency Checker
	styleChecker: {
		enabled: boolean;
		autoCheckOnSave: boolean;
		showInlineIssues: boolean;
		enabledRuleSets: string[];  // IDs of enabled rule sets
		showErrors: boolean;
		showWarnings: boolean;
		showInfo: boolean;
		showSuggestions: boolean;
		customRules?: any[];  // StyleRule[] - custom user-defined rules
	};

	// Timeline/Chronology Tool
	timeline: {
		enabled: boolean;
		showInSidebar: boolean;
		defaultView: 'list' | 'timeline';
		sortBy: 'chronological' | 'importance' | 'type' | 'recent';
		autoDetectConflicts: boolean;
		showConflictWarnings: boolean;
		events?: Record<string, any>; // TimelineEvent[]
	};

	// Panel Management
	panelManagement: {
		pinnedPanels: string[]; // Array of panel view types that are pinned
		panelWorkspaces: {
			[name: string]: {
				openPanels: string[]; // Panel view types
				layout?: string; // Future: panel positions/sizes
			};
		};
		currentWorkspace?: string; // Active workspace name
		autoRestoreWorkspace: boolean; // Restore workspace on startup
	};

	// Data Backup & Sync
	backup: {
		enabled: boolean; // Enable auto-backup
		interval: number; // Backup interval in minutes (default: 30)
		maxBackups: number; // Maximum number of backups to keep (default: 10)
		backupDirectory: string; // Directory to save backups (default: ".manuscript-pro-backups")
		includeSettings: boolean; // Include plugin settings in backups
		includeData: boolean; // Include all plugin data (characters, research, etc.)
		lastBackupTime?: number; // Timestamp of last backup
		compressionEnabled: boolean; // Compress backups (future feature)
	};

	// Advanced
	debugMode: boolean;
	customPatterns: string[];
	performance: {
		viewportBuffer: number;
		debounceDelay: number;
		maxDecorationsPerUpdate: number;
	};

	// Legacy support for migration
	regexp?: Array<string>;
	doConcealEditMode?: boolean;

	// Onboarding & Help
	onboarding?: {
		completed: boolean;
		completedAt?: number;
		skipped?: boolean;
	};

	// Quick Tips
	quickTips?: {
		enabled: boolean;
		lastDismissedDate?: string; // YYYY-MM-DD format
	};

	// Feature Discovery
	featureDiscovery?: {
		lastSeenVersion: string; // Last version user saw "What's New" for
		dismissedFeatures: string[]; // Feature IDs that user has dismissed
	};

	// Plot Arc Tracker
	plotArc?: import('../plotArc/PlotArcInterfaces').PlotArcData;

	// License storage (obfuscated)
	_lic?: string; // Encrypted license data
	_inst?: string; // Instance ID
}
