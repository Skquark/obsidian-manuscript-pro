import { MarkdownView, Plugin, Notice, WorkspaceLeaf, Menu } from 'obsidian';
import { SettingsTab } from './settingsTab';
import { EditorView } from '@codemirror/view';
import { Extension } from '@codemirror/state';
import { concealViewPlugin, workspaceLayoutChangeEffect } from './editorExtensions/conceal-view-plugin';
import { PluginSettings } from './interfaces/plugin-settings';
import { getAllPatternGroups } from './patterns';
import { FocusModeManager } from './focusMode/FocusModeManager';
import { createTypewriterPlugin } from './focusMode/typewriterPlugin';
import { ProfileManager } from './profiles/ProfileManager';
import { ProfileDropdown } from './profiles/ProfileDropdown';
import { StatsPanel, STATS_VIEW_TYPE } from './stats/StatsPanel';
import type { StatsData } from './stats/StatsInterfaces';
import { BibliographyManager } from './citations/BibliographyManager';
import { CitationFormatter } from './citations/CitationFormatter';
import { createCitationHoverExtension, loadBibliographyForActiveFile } from './citations/citationHoverExtension';
import { CrossRefManager } from './crossref/CrossRefManager';
import { createRefAutoComplete } from './crossref/refAutoComplete';
import { LabelBrowser, LABEL_BROWSER_VIEW_TYPE } from './crossref/LabelBrowser';
import { ManuscriptNavigator, MANUSCRIPT_NAVIGATOR_VIEW_TYPE } from './manuscript/ManuscriptNavigator';
import { ManuscriptLoader } from './manuscript/ManuscriptLoader';
import { ManuscriptEditorModal } from './manuscript/ManuscriptEditorModal';
import { PrePublicationPanel, VALIDATION_PANEL_VIEW_TYPE } from './validation/PrePublicationPanel';
import { ExportManager } from './export/ExportManager';
import { ExportDialog } from './export/ExportDialog';
import { CitationImporter } from './citations/CitationImporter';
import { DuplicateDetector } from './citations/DuplicateDetector';
import { CitationSuggestionEngine } from './citations/CitationSuggestionEngine';
import { CitationImportDialog, DuplicateManagementDialog } from './citations/CitationImportDialog';
import { TemplateManager } from './templates/TemplateManager';
import { SnippetManager } from './templates/SnippetManager';
import { TemplateSelectorModal, TemplateVariableModal, SnippetSelectorModal } from './templates/TemplateDialog';
import { SnippetSuggest } from './templates/SnippetSuggest';
import { TemplateVariableHelper } from './templates/TemplateVariableHelper';
import { PublicationChecklistManager } from './quality/PublicationChecklistManager';
import { ProgressTrackingManager } from './quality/ProgressTrackingManager';
import { ResearchBibleManager } from './quality/ResearchBibleManager';
import { ReadabilityAnalyzer } from './quality/ReadabilityAnalyzer';
import { ResearchFactModal } from './modals/ResearchFactModal';
import { ResearchSearchModal } from './modals/ResearchSearchModal';
import { ChecklistPanelView, CHECKLIST_PANEL_VIEW_TYPE } from './views/ChecklistPanelView';

// Default Settings
const DEFAULT_SETTINGS: PluginSettings = {
	enabled: true,

	// Mode toggles
	enableInLivePreview: true,
	enableInReadingMode: false,
	enableInSourceMode: false,

	// Pattern groups
	groups: {
		mathDelimiters: true,
		citations: true,
		latexCommands: true,
		pandocMarkup: true,
		indexingMeta: true,
	},

	// Cursor revealing
	cursorReveal: {
		enabled: true,
		delay: 100,
		revealParagraph: false,
		highlightRevealed: false,
		highlightColor: '#ffeb3b33',
	},

	// UI
	showStatusBar: true,
	showRibbonIcon: true,
	showConcealedCount: false,

	// Focus Mode
	focusMode: {
		enabled: false,
		// Markdown concealment
		hideMarkdownSyntax: true,
		hideHeadingMarkers: true,
		hideListMarkers: true,
		hideBlockquoteMarkers: true,
		hideInlineCode: false,
		// Typewriter mode
		typewriterMode: true,
		activeZone: 'paragraph',
		dimOpacity: 0.3,
		highlightActive: false,
		highlightColor: '#ffeb3b22',
		// Reading width
		centerText: true,
		lineWidth: 80,
		// UI minimization
		hideExplorer: false,
		hideStatusBar: false,
		hideRibbon: false,
		enterFullscreen: false,
	},

	// Statistics Panel
	statistics: {
		enabled: true,
		showInSidebar: true,
		autoRefresh: true,
		refreshInterval: 5,
		trackHistory: true,
		showGoals: true,
	},

	// Citation Preview
	citations: {
		enabled: true,
		showTooltip: true,
		citationStyle: 'APA',
		showVisualIndicators: true,
		bibliographyPaths: [],
		bibliographyFile: undefined,
		cacheTimeout: 5, // minutes
	},

	// Cross-Reference Intelligence
	crossRef: {
		enabled: true,
		autoComplete: true,
		showLabelBrowser: true,
		validateOnSave: false,
		indexOnStartup: true,
		maxFilesToIndex: 1000, // Limit for very large vaults (0 = unlimited)
		showIndexStats: true, // Show index statistics in console/notices
	},

	// Manuscript Navigator
	manuscriptNavigator: {
		enabled: true,
		showInSidebar: false,
		configFile: 'book.json',

		// Display options
		showWordCount: true,
		showFigureCount: false,
		showCitationCount: false,
		showLastModified: false,

		// Behavior
		autoRefreshStats: true,
		confirmReorder: false,
		expandPartsOnLoad: true,

		// Goals
		defaultChapterWordGoal: 5000,
		totalWordGoal: 80000,
	},

	// Pre-publication Validation
	validation: {
		enabled: true,
		autoValidateOnSave: false,
		showPanel: false,

		// Rule toggles
		validateReferences: true,
		validateCitations: true,
		validateFigures: true,
		validateTables: true,
		validateEquations: true,
		validateStructure: true,

		// Display options
		groupByCategory: true,
		hideInfoLevel: false,
		showOnlyErrors: false,
	},

	// Export & Publishing
	export: {
		enabled: true,
		pandocPath: undefined, // Auto-detect
		defaultOutputDir: undefined, // Use vault root
		openAfterExport: true,

		profiles: [], // Will be populated with DEFAULT_EXPORT_PROFILES
		defaultProfileId: 'pdf-academic',

		templateDirectory: undefined,
		maxConcurrentExports: 3,
		keepIntermediateFiles: false,
		verboseLogging: false,
	},

	// Enhanced Bibliography
	enhancedBib: {
		enabled: true,

		// Auto-import
		enableAutoImport: true,
		preferredFormat: 'bibtex',

		// External APIs
		apiConfig: {
			crossrefEmail: undefined,
			pubmedApiKey: undefined,
			pubmedEmail: undefined,
			rateLimitDelay: 1000,
		},

		// Duplicate detection
		enableDuplicateDetection: true,
		duplicateSimilarityThreshold: 0.8,
		autoMergeDuplicates: false, // Require manual confirmation

		// Smart suggestions
		enableSmartSuggestions: true,
		suggestionContextWindow: 500,
		maxSuggestions: 10,

		// Analytics
		trackCitationUsage: true,
		showAnalytics: false,
	},

	// Template & Snippet System
	templates: {
		enabled: true,
		customTemplatesPath: '.templates',
		customSnippetsPath: '.snippets',
		enableTriggers: true,
		showTemplateInserter: true,
		enableVariableHints: true,
	},

	// Phase 4A: Quality & Workflow Enhancements
	quality: {
		// Pre-Publication Checklist
		checklist: {
			enabled: true,
			showPanel: false,
			autoCheckEnabled: true,
			defaultType: 'academic-paper',
		},

		// Enhanced Progress Tracking
		progress: {
			enabled: true,
			trackSessions: true,
			trackStreaks: true,
			calculateVelocity: true,
			showInStatusBar: false,
			autoSnapshot: true,
			snapshotInterval: 30, // 30 minutes
		},

		// Research Knowledge Base
		researchBible: {
			enabled: true,
			autoDetectTerms: false,
			checkConsistency: true,
			showInlineHints: true,
			exportFormat: 'markdown',
		},

		// Readability Analysis
		readability: {
			enabled: true,
			targetAudience: 'graduate',
			showInlineWarnings: false,
			analyzeSections: true,
			highlightPassiveVoice: false,
			exportReports: true,
		},
	},

	// Advanced
	debugMode: false,
	customPatterns: [],
	performance: {
		viewportBuffer: 500,
		debounceDelay: 100,
		maxDecorationsPerUpdate: 1000,
	},
};

/**
 * Create a RegExp with 'd' flag for indices support, falling back to 'gm' if not supported
 */
function createRegexWithFallback(pattern: string): RegExp {
	try {
		// Try with 'd' flag for indices support (newer Electron/browsers)
		return new RegExp(pattern, 'gmd');
	} catch (e) {
		// Fallback to 'gm' if 'd' flag is not supported (older Electron)
		// The conceal-view-plugin has fallback logic to handle missing indices
		return new RegExp(pattern, 'gm');
	}
}

export default class ManuscriptProPlugin extends Plugin {
	settings: PluginSettings;
	editorExtensions: Extension[] = [];
	statusBarItem: HTMLElement | null = null;
	ribbonIconEl: HTMLElement | null = null;
	focusModeManager: FocusModeManager;
	profileManager: ProfileManager;
	profileDropdown: ProfileDropdown | null = null;
	statsData: StatsData = {
		history: {},
		goals: [],
		sessionStart: 0,
		sessionWordCount: 0,
	};
	bibliographyManager: BibliographyManager;
	citationFormatter: CitationFormatter;
	crossRefManager: CrossRefManager;
	manuscriptNavigator: ManuscriptNavigator | null = null;
	exportManager: ExportManager;
	citationImporter: CitationImporter;
	duplicateDetector: DuplicateDetector;
	citationSuggestionEngine: CitationSuggestionEngine;
	templateManager: TemplateManager;
	snippetManager: SnippetManager;
	templateVariableHelper: TemplateVariableHelper;
	snippetSuggest: SnippetSuggest;
	checklistManager: PublicationChecklistManager;
	progressManager: ProgressTrackingManager;
	researchBible: ResearchBibleManager;
	readabilityAnalyzer: ReadabilityAnalyzer;

	async loadSettings() {
		const loadedData = await this.loadData();
		this.settings = Object.assign({}, DEFAULT_SETTINGS, loadedData);

		// Migrate old settings from Dynamic Text Concealer if present
		if (loadedData?.regexp && Array.isArray(loadedData.regexp)) {
			// Migration handled, but we'll keep custom patterns
			if (this.settings.debugMode) {
				console.log('Manuscript Pro: Migrated from Dynamic Text Concealer');
			}
		}
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async loadStatsData() {
		const data = await this.loadData();
		if (data?.statsData) {
			this.statsData = Object.assign(
				{
					history: {},
					goals: [],
					sessionStart: 0,
					sessionWordCount: 0,
				},
				data.statsData,
			);
		}
	}

	async saveStatsData() {
		// Prune old history entries to prevent unbounded growth
		this.pruneStatsHistory();

		const currentData = (await this.loadData()) || {};
		currentData.statsData = this.statsData;
		await this.saveData(currentData);
	}

	/**
	 * Prune stats history to keep only last 365 days
	 */
	private pruneStatsHistory() {
		const MAX_HISTORY_DAYS = 365;
		const now = Date.now();
		const cutoffDate = new Date(now - MAX_HISTORY_DAYS * 24 * 60 * 60 * 1000);
		const cutoffKey = cutoffDate.toISOString().split('T')[0];

		const history = this.statsData.history;
		const keysToDelete: string[] = [];

		// Find old entries
		for (const dateKey in history) {
			if (dateKey < cutoffKey) {
				keysToDelete.push(dateKey);
			}
		}

		// Delete old entries
		if (keysToDelete.length > 0) {
			keysToDelete.forEach((key) => delete history[key]);
			if (this.settings.debugMode) {
				console.log(`Pruned ${keysToDelete.length} old stats history entries`);
			}
		}
	}

	addEditorExtension() {
		this.editorExtensions.length = 0;

		if (!this.settings.enabled || !this.settings.enableInLivePreview) {
			return;
		}

		// Get all pattern groups
		const allGroups = getAllPatternGroups();

		// Filter enabled groups
		const enabledGroups = allGroups.filter((group) => {
			const groupKey = group.id as keyof typeof this.settings.groups;
			return this.settings.groups[groupKey] === true;
		});

		// Add view plugin for each enabled pattern in each group
		enabledGroups.forEach((group) => {
			group.patterns.forEach((pattern) => {
				if (this.settings.debugMode) {
					console.log(`Manuscript Pro: Adding pattern - ${pattern.description}`);
				}

				// Create regex with proper flags (g=global, m=multiline, d=indices)
				const regex = createRegexWithFallback(pattern.regexString);
				this.editorExtensions.push(concealViewPlugin(regex, this.settings, pattern.replacement));
			});
		});

		// Add custom patterns if any
		this.settings.customPatterns.forEach((regexString) => {
			if (!regexString) return;
			try {
				const regex = createRegexWithFallback(regexString);
				this.editorExtensions.push(concealViewPlugin(regex, this.settings));
			} catch (e) {
				if (this.settings.debugMode) {
					console.error('Invalid custom pattern:', regexString, e);
				}
			}
		});

		// Add typewriter plugin if Focus Mode typewriter is enabled
		if (this.settings.focusMode.enabled && this.settings.focusMode.typewriterMode) {
			this.editorExtensions.push(createTypewriterPlugin(() => this.settings));
		}

		// Add citation hover extension if enabled
		if (this.settings.citations.enabled && this.settings.citations.showTooltip) {
			this.editorExtensions.push(createCitationHoverExtension(this));
		}

		// Add cross-ref auto-completion if enabled
		if (this.settings.crossRef.enabled && this.settings.crossRef.autoComplete) {
			this.editorExtensions.push(createRefAutoComplete(this));
		}
	}

	updateEditorExtension() {
		this.addEditorExtension();
		this.app.workspace.updateOptions();
		this.updateStatusBar();
	}

	addEvents() {
		if (this.settings.enabled && this.settings.enableInLivePreview) {
			this.registerEvent(
				this.app.workspace.on('layout-change', () => {
					this.app.workspace.iterateAllLeaves((leaf) => {
						if (leaf.view instanceof MarkdownView) {
							// Access CodeMirror editor instance (internal API)
							const editor = (leaf.view as any).editor;
							if (editor && editor.cm) {
								const cm = editor.cm as EditorView;
								cm.dispatch({
									effects: workspaceLayoutChangeEffect.of(null),
								});
							}
						}
					});
				}),
			);
		}

		// Load bibliography when file is opened
		if (this.settings.citations.enabled) {
			this.registerEvent(
				this.app.workspace.on('active-leaf-change', async () => {
					await loadBibliographyForActiveFile(this);
				}),
			);

			// Also load on file change
			this.registerEvent(
				this.app.workspace.on('file-open', async () => {
					await loadBibliographyForActiveFile(this);
				}),
			);
		}
	}

	setupStatusBar() {
		if (this.settings.showStatusBar) {
			this.statusBarItem = this.addStatusBarItem();
			this.statusBarItem.addClass('manuscript-pro-status');

			// Initialize profile dropdown
			if (this.profileManager) {
				this.profileDropdown = new ProfileDropdown(this, this.statusBarItem);
			}

			this.updateStatusBar();
		}
	}

	updateStatusBar() {
		if (!this.statusBarItem) return;

		// If profile dropdown exists, use it to display active profile
		if (this.profileDropdown) {
			this.profileDropdown.updateDisplay();
		} else {
			// Fallback to old display (for backwards compatibility)
			const icon = this.settings.enabled ? '👁️' : '👁️‍🗨️';
			const enabledGroupsCount = Object.values(this.settings.groups).filter((v) => v).length;

			this.statusBarItem.setText(`${icon} Manuscript Pro (${enabledGroupsCount}/5)`);
			this.statusBarItem.title =
				this.settings.enabled ?
					`Manuscript Pro: Active (${enabledGroupsCount} groups enabled)\nClick to toggle`
				:	'Manuscript Pro: Inactive\nClick to toggle';
		}
	}

	setupRibbon() {
		if (this.settings.showRibbonIcon) {
			this.ribbonIconEl = this.addRibbonIcon('scroll', 'Manuscript Pro', (evt: MouseEvent) => {
				// Create a comprehensive menu with organized sections
				const menu = new Menu();

				// === MAIN TOGGLE ===
				menu.addItem((item) => {
					const icon = this.settings.enabled ? 'eye' : 'eye-off';
					item
						.setTitle(this.settings.enabled ? 'Disable Concealment' : 'Enable Concealment')
						.setIcon(icon)
						.onClick(() => {
							this.toggleConcealer();
						});
				});

				menu.addSeparator();

				// === EXPORT SUBMENU ===
				menu.addItem((item) => {
					item.setTitle('📤 Export →').onClick((evt: MouseEvent) => {
						const exportMenu = new Menu();

						const activeFile = this.app.workspace.getActiveFile();

						// Export current file
						if (activeFile) {
							exportMenu.addItem((subItem) => {
								subItem
									.setTitle('Export Current File...')
									.setIcon('file')
									.onClick(() => {
										const dialog = new ExportDialog(
											this.app,
											this,
											[activeFile],
											async (profile, files, outputPath) => {
												await this.exportManager.exportFiles(files, profile.id, outputPath);
											},
										);
										dialog.open();
									});
							});

							exportMenu.addSeparator();

							// Quick exports
							exportMenu.addItem((subItem) => {
								subItem
									.setTitle('Quick Export to PDF')
									.setIcon('file-text')
									.onClick(() => {
										this.exportManager.exportFiles([activeFile], 'pdf-academic');
									});
							});

							exportMenu.addItem((subItem) => {
								subItem
									.setTitle('Quick Export to DOCX')
									.setIcon('file-text')
									.onClick(() => {
										this.exportManager.exportFiles([activeFile], 'docx-standard');
									});
							});

							exportMenu.addItem((subItem) => {
								subItem
									.setTitle('Quick Export to HTML')
									.setIcon('code')
									.onClick(() => {
										this.exportManager.exportFiles([activeFile], 'html-web');
									});
							});

							exportMenu.addItem((subItem) => {
								subItem
									.setTitle('Quick Export to EPUB')
									.setIcon('book')
									.onClick(() => {
										this.exportManager.exportFiles([activeFile], 'epub-ebook');
									});
							});

							exportMenu.addSeparator();
						}

						// Export manuscript
						exportMenu.addItem((subItem) => {
							subItem
								.setTitle('Export Manuscript Project...')
								.setIcon('files')
								.onClick(() => {
									const dialog = new ExportDialog(this.app, this, [], async (profile, files, outputPath) => {
										await this.exportManager.exportManuscript(profile.id);
									});
									dialog.open();
								});
						});

						exportMenu.showAtMouseEvent(evt);
					});
				});

				// === CITATIONS SUBMENU ===
				menu.addItem((item) => {
					item.setTitle('📚 Citations & Bibliography →').onClick((evt: MouseEvent) => {
						const citMenu = new Menu();

						citMenu.addItem((subItem) => {
							subItem
								.setTitle('Import from DOI/arXiv/PubMed...')
								.setIcon('download')
								.onClick(() => {
									const dialog = new CitationImportDialog(this.app, this, async (result) => {
										if (result.success && result.entry) {
											this.bibliographyManager.addEntry(result.entry.key, result.entry);
											const bibFile = this.settings.citations.bibliographyFile;
											if (bibFile) {
												await this.bibliographyManager.saveToBibFile(bibFile);
											}
										}
									});
									dialog.open();
								});
						});

						citMenu.addItem((subItem) => {
							subItem
								.setTitle('Reload Bibliography')
								.setIcon('refresh-cw')
								.onClick(async () => {
									this.bibliographyManager.invalidateCache();
									await loadBibliographyForActiveFile(this);
									const stats = this.bibliographyManager.getStats();
									new Notice(`Bibliography reloaded: ${stats.totalEntries} entries from ${stats.filesLoaded} files`);
								});
						});

						citMenu.addItem((subItem) => {
							subItem
								.setTitle('Detect Duplicate Citations')
								.setIcon('copy')
								.onClick(async () => {
									const allEntries = this.bibliographyManager.getAllCitations();
									const threshold = this.settings.enhancedBib?.duplicateSimilarityThreshold || 0.8;
									const duplicates = this.duplicateDetector.findDuplicates(allEntries, threshold);

									if (duplicates.length === 0) {
										new Notice('✓ No duplicate citations found');
										return;
									}

									const dialog = new DuplicateManagementDialog(
										this.app,
										this,
										duplicates,
										async (canonical, duplicateKeys) => {
											const canonicalEntry = allEntries.get(canonical);
											if (!canonicalEntry) return;

											for (const dupKey of duplicateKeys) {
												const dupEntry = allEntries.get(dupKey);
												if (dupEntry) {
													const merged = this.duplicateDetector.mergeDuplicates(canonicalEntry, dupEntry);
													this.bibliographyManager.addEntry(canonical, merged);
													this.bibliographyManager.removeEntry(dupKey);
												}
											}

											const bibFile = this.settings.citations.bibliographyFile;
											if (bibFile) {
												await this.bibliographyManager.saveToBibFile(bibFile);
											}

											new Notice(`✓ Merged ${duplicateKeys.length} duplicate(s) into ${canonical}`);
										},
									);
									dialog.open();
								});
						});

						citMenu.addSeparator();

						citMenu.addItem((subItem) => {
							subItem
								.setTitle(this.settings.citations.enabled ? '✓ Citation Preview' : 'Citation Preview')
								.setChecked(this.settings.citations.enabled)
								.onClick(async () => {
									this.settings.citations.enabled = !this.settings.citations.enabled;
									await this.saveSettings();
									this.updateEditorExtension();
									new Notice(`Citation Preview ${this.settings.citations.enabled ? 'enabled' : 'disabled'}`);
								});
						});

						citMenu.showAtMouseEvent(evt);
					});
				});

				// === CROSS-REFERENCES SUBMENU ===
				menu.addItem((item) => {
					item.setTitle('🔗 Cross-References →').onClick((evt: MouseEvent) => {
						const xrefMenu = new Menu();

						xrefMenu.addItem((subItem) => {
							subItem
								.setTitle('Open Label Browser')
								.setIcon('tag')
								.onClick(() => {
									this.activateLabelBrowser();
								});
						});

						xrefMenu.addItem((subItem) => {
							subItem
								.setTitle('Index All Labels')
								.setIcon('refresh-cw')
								.onClick(async () => {
									const startTime = Date.now();
									await this.crossRefManager.indexVault();
									const duration = Date.now() - startTime;
									const stats = this.crossRefManager.getStats();

									const totalFiles = this.app.vault.getMarkdownFiles().length;
									const skipped = totalFiles - stats.filesIndexed;

									let message = `✓ Indexed ${stats.totalLabels} labels from ${stats.filesIndexed} files`;
									if (skipped > 0) {
										message += ` (${skipped} files skipped due to limit)`;
									}
									message += ` in ${duration}ms`;

									new Notice(message);
								});
						});

						xrefMenu.addItem((subItem) => {
							subItem
								.setTitle('Validate All References')
								.setIcon('check-circle')
								.onClick(async () => {
									const issues = await this.crossRefManager.validateReferences();
									if (issues.length === 0) {
										new Notice('✓ All references are valid!');
									} else {
										const errors = issues.filter((i) => i.severity === 'error').length;
										const warnings = issues.filter((i) => i.severity === 'warning').length;
										new Notice(`Found ${errors} errors and ${warnings} warnings`);
										console.log('Reference validation issues:', issues);
									}
								});
						});

						xrefMenu.addSeparator();

						xrefMenu.addItem((subItem) => {
							subItem
								.setTitle(
									this.settings.crossRef.enabled ? '✓ Cross-Reference Intelligence' : 'Cross-Reference Intelligence',
								)
								.setChecked(this.settings.crossRef.enabled)
								.onClick(async () => {
									this.settings.crossRef.enabled = !this.settings.crossRef.enabled;
									await this.saveSettings();
									this.updateEditorExtension();
									new Notice(`Cross-Reference Intelligence ${this.settings.crossRef.enabled ? 'enabled' : 'disabled'}`);
								});
						});

						xrefMenu.showAtMouseEvent(evt);
					});
				});

				// === MANUSCRIPT TOOLS SUBMENU ===
				menu.addItem((item) => {
					item.setTitle('📋 Manuscript Tools →').onClick((evt: MouseEvent) => {
						const msMenu = new Menu();

						msMenu.addItem((subItem) => {
							subItem
								.setTitle('Open Manuscript Navigator')
								.setIcon('list-tree')
								.onClick(() => {
									this.activateManuscriptNavigator();
								});
						});

						msMenu.addItem((subItem) => {
							subItem
								.setTitle('Edit Manuscript Project')
								.setIcon('edit')
								.onClick(async () => {
									await this.openManuscriptEditor();
								});
						});

						msMenu.addItem((subItem) => {
							subItem
								.setTitle('Open Pre-publication Checklist')
								.setIcon('clipboard-check')
								.onClick(() => {
									this.activateValidationPanel();
								});
						});

						msMenu.addItem((subItem) => {
							subItem
								.setTitle('Run Validation')
								.setIcon('shield-check')
								.onClick(async () => {
									await this.activateValidationPanel();
									const leaves = this.app.workspace.getLeavesOfType(VALIDATION_PANEL_VIEW_TYPE);
									if (leaves.length > 0) {
										const view = leaves[0].view;
										if (view instanceof PrePublicationPanel) {
											await view.runValidation();
										}
									}
								});
						});

						msMenu.addSeparator();

						msMenu.addItem((subItem) => {
							subItem
								.setTitle('Open Statistics Panel')
								.setIcon('bar-chart-2')
								.onClick(() => {
									this.activateStatsView();
								});
						});

						msMenu.addItem((subItem) => {
							subItem
								.setTitle('Refresh Statistics')
								.setIcon('refresh-cw')
								.onClick(async () => {
									const leaves = this.app.workspace.getLeavesOfType(STATS_VIEW_TYPE);
									if (leaves.length > 0) {
										const view = leaves[0].view;
										if (view instanceof StatsPanel) {
											await view.refresh();
											new Notice('Statistics refreshed');
										}
									}
								});
						});

						msMenu.showAtMouseEvent(evt);
					});
				});

				// === TEMPLATES & SNIPPETS SUBMENU ===
				menu.addItem((item) => {
					item.setTitle('📝 Templates & Snippets →').onClick((evt: MouseEvent) => {
						const templMenu = new Menu();

						templMenu.addItem((subItem) => {
							subItem
								.setTitle('Insert Template...')
								.setIcon('layout-template')
								.onClick(() => {
									if (!this.settings.templates?.enabled) {
										new Notice('Templates are disabled in settings');
										return;
									}

									const templates = this.templateManager.getAllTemplates();
									const selector = new TemplateSelectorModal(this.app, templates, (template) => {
										const variableDialog = new TemplateVariableModal(
											this.app,
											template,
											async (values) => {
												const result = await this.templateManager.insertTemplate({
													template,
													variableValues: values,
													insertAtCursor: true,
												});

												if (!result.success) {
													new Notice(`Failed to insert template: ${result.error}`);
												}
											},
											this,
										);
										variableDialog.open();
									});
									selector.open();
								});
						});

						templMenu.addItem((subItem) => {
							subItem
								.setTitle('Insert Snippet...')
								.setIcon('code')
								.onClick(() => {
									if (!this.settings.templates?.enabled) {
										new Notice('Snippets are disabled in settings');
										return;
									}

									const snippets = this.snippetManager.getAllSnippets();
									const selector = new SnippetSelectorModal(this.app, snippets, (snippet) => {
										const variableDialog = new TemplateVariableModal(
											this.app,
											snippet,
											async (values) => {
												const result = await this.snippetManager.insertSnippet({
													snippet,
													variableValues: values,
													insertAtCursor: true,
												});

												if (!result.success) {
													new Notice(`Failed to insert snippet: ${result.error}`);
												}
											},
											this,
										);
										variableDialog.open();
									});
									selector.open();
								});
						});

						templMenu.addSeparator();

						// Quick snippets
						templMenu.addItem((subItem) => {
							subItem
								.setTitle('Insert Figure')
								.setIcon('image')
								.onClick(() => {
									const snippet = this.snippetManager.getSnippet('figure-latex');
									if (!snippet) {
										new Notice('Figure snippet not found');
										return;
									}

									const variableDialog = new TemplateVariableModal(
										this.app,
										snippet,
										async (values) => {
											const result = await this.snippetManager.insertSnippet({
												snippet,
												variableValues: values,
												insertAtCursor: true,
											});

											if (!result.success) {
												new Notice(`Failed to insert figure: ${result.error}`);
											}
										},
										this,
									);
									variableDialog.open();
								});
						});

						templMenu.addItem((subItem) => {
							subItem
								.setTitle('Insert Table')
								.setIcon('table')
								.onClick(() => {
									const snippet = this.snippetManager.getSnippet('table-basic');
									if (!snippet) {
										new Notice('Table snippet not found');
										return;
									}

									const variableDialog = new TemplateVariableModal(
										this.app,
										snippet,
										async (values) => {
											const result = await this.snippetManager.insertSnippet({
												snippet,
												variableValues: values,
												insertAtCursor: true,
											});

											if (!result.success) {
												new Notice(`Failed to insert table: ${result.error}`);
											}
										},
										this,
									);
									variableDialog.open();
								});
						});

						templMenu.addItem((subItem) => {
							subItem
								.setTitle('Insert Equation')
								.setIcon('sigma')
								.onClick(() => {
									const snippet = this.snippetManager.getSnippet('equation-display');
									if (!snippet) {
										new Notice('Equation snippet not found');
										return;
									}

									const variableDialog = new TemplateVariableModal(
										this.app,
										snippet,
										async (values) => {
											const result = await this.snippetManager.insertSnippet({
												snippet,
												variableValues: values,
												insertAtCursor: true,
											});

											if (!result.success) {
												new Notice(`Failed to insert equation: ${result.error}`);
											}
										},
										this,
									);
									variableDialog.open();
								});
						});

						templMenu.showAtMouseEvent(evt);
					});
				});

				menu.addSeparator();

				// === CONCEALMENT GROUPS ===
				menu.addItem((item) => {
					item.setTitle('👁️ Concealment Groups →').onClick((evt: MouseEvent) => {
						const groupMenu = new Menu();

						groupMenu.addItem((subItem) => {
							subItem
								.setTitle('Math Delimiters')
								.setChecked(this.settings.groups.mathDelimiters)
								.onClick(() => {
									this.toggleGroup('mathDelimiters', 'Math Delimiters');
								});
						});

						groupMenu.addItem((subItem) => {
							subItem
								.setTitle('Citations')
								.setChecked(this.settings.groups.citations)
								.onClick(() => {
									this.toggleGroup('citations', 'Citations');
								});
						});

						groupMenu.addItem((subItem) => {
							subItem
								.setTitle('LaTeX Commands')
								.setChecked(this.settings.groups.latexCommands)
								.onClick(() => {
									this.toggleGroup('latexCommands', 'LaTeX Commands');
								});
						});

						groupMenu.addItem((subItem) => {
							subItem
								.setTitle('Pandoc Markup')
								.setChecked(this.settings.groups.pandocMarkup)
								.onClick(() => {
									this.toggleGroup('pandocMarkup', 'Pandoc Markup');
								});
						});

						groupMenu.addItem((subItem) => {
							subItem
								.setTitle('Indexing & Metadata')
								.setChecked(this.settings.groups.indexingMeta)
								.onClick(() => {
									this.toggleGroup('indexingMeta', 'Indexing & Metadata');
								});
						});

						groupMenu.addSeparator();

						groupMenu.addItem((subItem) => {
							subItem
								.setTitle('Hide All Syntax')
								.setIcon('eye-off')
								.onClick(() => {
									this.settings.groups.mathDelimiters = true;
									this.settings.groups.citations = true;
									this.settings.groups.latexCommands = true;
									this.settings.groups.pandocMarkup = true;
									this.settings.groups.indexingMeta = true;
									this.saveSettings();
									this.updateEditorExtension();
									new Notice('All syntax groups enabled');
								});
						});

						groupMenu.addItem((subItem) => {
							subItem
								.setTitle('Show All Syntax')
								.setIcon('eye')
								.onClick(() => {
									this.settings.groups.mathDelimiters = false;
									this.settings.groups.citations = false;
									this.settings.groups.latexCommands = false;
									this.settings.groups.pandocMarkup = false;
									this.settings.groups.indexingMeta = false;
									this.saveSettings();
									this.updateEditorExtension();
									new Notice('All syntax groups disabled (showing original markup)');
								});
						});

						groupMenu.showAtMouseEvent(evt);
					});
				});

				// === FOCUS MODE ===
				menu.addItem((item) => {
					const enabled = this.settings.focusMode.enabled;
					item.setTitle(enabled ? '🎯 Exit Focus Mode' : '🎯 Enter Focus Mode').onClick(() => {
						if (enabled) {
							this.focusModeManager.disable();
						} else {
							this.focusModeManager.enable();
						}
					});
				});

				menu.addSeparator();

				// === SETTINGS ===
				menu.addItem((item) => {
					item.setTitle('⚙️ Settings').onClick(() => {
						// Open plugin settings
						(this.app as any).setting.open();
						(this.app as any).setting.openTabById(this.manifest.id);
					});
				});

				// Show menu at cursor position
				menu.showAtMouseEvent(evt);
			});
		}
	}

	registerCommands() {
		// Main toggle
		this.addCommand({
			id: 'toggle-concealer',
			name: 'Toggle Manuscript Pro',
			callback: () => {
				this.toggleConcealer();
			},
		});

		// Group toggles
		this.addCommand({
			id: 'toggle-math-delimiters',
			name: 'Toggle Math Delimiters',
			callback: () => {
				this.toggleGroup('mathDelimiters', 'Math Delimiters');
			},
		});

		this.addCommand({
			id: 'toggle-citations',
			name: 'Toggle Citations',
			callback: () => {
				this.toggleGroup('citations', 'Citations');
			},
		});

		this.addCommand({
			id: 'toggle-latex-commands',
			name: 'Toggle LaTeX Commands',
			callback: () => {
				this.toggleGroup('latexCommands', 'LaTeX Commands');
			},
		});

		this.addCommand({
			id: 'toggle-pandoc-markup',
			name: 'Toggle Pandoc Markup',
			callback: () => {
				this.toggleGroup('pandocMarkup', 'Pandoc Markup');
			},
		});

		this.addCommand({
			id: 'toggle-indexing-meta',
			name: 'Toggle Indexing & Metadata',
			callback: () => {
				this.toggleGroup('indexingMeta', 'Indexing & Metadata');
			},
		});

		// Show/hide all
		this.addCommand({
			id: 'hide-all-syntax',
			name: 'Hide All Syntax',
			callback: () => {
				this.settings.groups.mathDelimiters = true;
				this.settings.groups.citations = true;
				this.settings.groups.latexCommands = true;
				this.settings.groups.pandocMarkup = true;
				this.settings.groups.indexingMeta = true;
				this.saveSettings();
				this.updateEditorExtension();
				new Notice('All syntax groups enabled');
			},
		});

		this.addCommand({
			id: 'show-all-syntax',
			name: 'Show All Hidden Syntax',
			callback: () => {
				this.settings.groups.mathDelimiters = false;
				this.settings.groups.citations = false;
				this.settings.groups.latexCommands = false;
				this.settings.groups.pandocMarkup = false;
				this.settings.groups.indexingMeta = false;
				this.saveSettings();
				this.updateEditorExtension();
				new Notice('All syntax groups disabled (showing original markup)');
			},
		});

		// Focus Mode commands
		this.addCommand({
			id: 'toggle-focus-mode',
			name: 'Toggle Focus Mode',
			hotkeys: [{ modifiers: ['Mod', 'Shift'], key: 'z' }],
			callback: () => {
				this.focusModeManager.toggle();
				new Notice(`Focus Mode ${this.focusModeManager.isEnabled() ? 'enabled' : 'disabled'}`);
			},
		});

		this.addCommand({
			id: 'toggle-typewriter-mode',
			name: 'Toggle Typewriter Dimming',
			callback: () => {
				this.settings.focusMode.typewriterMode = !this.settings.focusMode.typewriterMode;
				this.saveSettings();
				this.updateEditorExtension();
				new Notice(`Typewriter Mode ${this.settings.focusMode.typewriterMode ? 'enabled' : 'disabled'}`);
			},
		});

		this.addCommand({
			id: 'toggle-reading-width',
			name: 'Toggle Reading Width',
			callback: () => {
				this.settings.focusMode.centerText = !this.settings.focusMode.centerText;
				this.saveSettings();
				if (this.focusModeManager.isEnabled()) {
					this.focusModeManager.updateSettings(this.settings);
				}
				new Notice(`Reading Width ${this.settings.focusMode.centerText ? 'enabled' : 'disabled'}`);
			},
		});

		// Profile commands
		this.addCommand({
			id: 'save-current-as-profile',
			name: 'Save Current Settings as Profile',
			callback: () => {
				// This will be handled by the profile dropdown modal
				const event = new MouseEvent('click');
				this.statusBarItem?.dispatchEvent(event);
			},
		});

		// Add commands for each default profile for quick switching
		this.addCommand({
			id: 'switch-to-full-concealment',
			name: 'Switch to Profile: Full Concealment',
			callback: async () => {
				const profile = this.profileManager.getAllProfiles().find((p) => p.name === 'Full Concealment');
				if (profile) {
					await this.profileManager.applyProfile(profile.id);
				}
			},
		});

		this.addCommand({
			id: 'switch-to-math-review',
			name: 'Switch to Profile: Math Review',
			callback: async () => {
				const profile = this.profileManager.getAllProfiles().find((p) => p.name === 'Math Review');
				if (profile) {
					await this.profileManager.applyProfile(profile.id);
				}
			},
		});

		this.addCommand({
			id: 'switch-to-citation-check',
			name: 'Switch to Profile: Citation Check',
			callback: async () => {
				const profile = this.profileManager.getAllProfiles().find((p) => p.name === 'Citation Check');
				if (profile) {
					await this.profileManager.applyProfile(profile.id);
				}
			},
		});

		this.addCommand({
			id: 'switch-to-clean-prose',
			name: 'Switch to Profile: Clean Prose',
			callback: async () => {
				const profile = this.profileManager.getAllProfiles().find((p) => p.name === 'Clean Prose');
				if (profile) {
					await this.profileManager.applyProfile(profile.id);
				}
			},
		});

		this.addCommand({
			id: 'switch-to-technical-edit',
			name: 'Switch to Profile: Technical Edit',
			callback: async () => {
				const profile = this.profileManager.getAllProfiles().find((p) => p.name === 'Technical Edit');
				if (profile) {
					await this.profileManager.applyProfile(profile.id);
				}
			},
		});

		this.addCommand({
			id: 'switch-to-final-proofread',
			name: 'Switch to Profile: Final Proofread',
			callback: async () => {
				const profile = this.profileManager.getAllProfiles().find((p) => p.name === 'Final Proofread');
				if (profile) {
					await this.profileManager.applyProfile(profile.id);
				}
			},
		});

		// Statistics Panel Commands
		this.addCommand({
			id: 'open-stats-panel',
			name: 'Open Manuscript Statistics Panel',
			callback: async () => {
				await this.activateStatsView();
			},
		});

		this.addCommand({
			id: 'toggle-stats-panel',
			name: 'Toggle Statistics Panel',
			callback: async () => {
				const leaves = this.app.workspace.getLeavesOfType(STATS_VIEW_TYPE);
				if (leaves.length > 0) {
					// Close if open
					this.app.workspace.detachLeavesOfType(STATS_VIEW_TYPE);
				} else {
					// Open if closed
					await this.activateStatsView();
				}
			},
		});

		this.addCommand({
			id: 'refresh-stats',
			name: 'Refresh Manuscript Statistics',
			callback: async () => {
				const leaves = this.app.workspace.getLeavesOfType(STATS_VIEW_TYPE);
				if (leaves.length > 0) {
					const view = leaves[0].view;
					if (view instanceof StatsPanel) {
						await view.refresh();
						new Notice('Statistics refreshed');
					}
				}
			},
		});

		// Citation Commands
		this.addCommand({
			id: 'reload-bibliography',
			name: 'Reload Bibliography',
			callback: async () => {
				this.bibliographyManager.invalidateCache();
				await loadBibliographyForActiveFile(this);
				const stats = this.bibliographyManager.getStats();
				new Notice(`Bibliography reloaded: ${stats.totalEntries} entries from ${stats.filesLoaded} files`);
			},
		});

		this.addCommand({
			id: 'toggle-citation-preview',
			name: 'Toggle Citation Preview',
			callback: async () => {
				this.settings.citations.enabled = !this.settings.citations.enabled;
				await this.saveSettings();
				this.updateEditorExtension();
				new Notice(`Citation Preview ${this.settings.citations.enabled ? 'enabled' : 'disabled'}`);
			},
		});

		// Cross-Reference Commands
		this.addCommand({
			id: 'index-labels',
			name: 'Index All Labels',
			callback: async () => {
				const startTime = Date.now();
				await this.crossRefManager.indexVault();
				const duration = Date.now() - startTime;
				const stats = this.crossRefManager.getStats();

				const totalFiles = this.app.vault.getMarkdownFiles().length;
				const skipped = totalFiles - stats.filesIndexed;

				let message = `✓ Indexed ${stats.totalLabels} labels from ${stats.filesIndexed} files`;
				if (skipped > 0) {
					message += ` (${skipped} files skipped due to limit)`;
				}
				message += ` in ${duration}ms`;

				new Notice(message);

				if (this.settings.crossRef.showIndexStats) {
					console.log(`CrossRef Index Stats:`, {
						labels: stats.totalLabels,
						files: stats.filesIndexed,
						totalFiles: totalFiles,
						skipped: skipped,
						duration: `${duration}ms`,
						labelsPerFile: (stats.totalLabels / stats.filesIndexed).toFixed(2),
					});
				}
			},
		});

		this.addCommand({
			id: 'open-label-browser',
			name: 'Open Label Browser',
			callback: async () => {
				await this.activateLabelBrowser();
			},
		});

		this.addCommand({
			id: 'validate-references',
			name: 'Validate All References',
			callback: async () => {
				const issues = await this.crossRefManager.validateReferences();
				if (issues.length === 0) {
					new Notice('✓ All references are valid!');
				} else {
					const errors = issues.filter((i) => i.severity === 'error').length;
					const warnings = issues.filter((i) => i.severity === 'warning').length;
					new Notice(`Found ${errors} errors and ${warnings} warnings`);
					console.log('Reference validation issues:', issues);
				}
			},
		});

		this.addCommand({
			id: 'toggle-crossref',
			name: 'Toggle Cross-Reference Intelligence',
			callback: async () => {
				this.settings.crossRef.enabled = !this.settings.crossRef.enabled;
				await this.saveSettings();
				this.updateEditorExtension();
				new Notice(`Cross-Reference Intelligence ${this.settings.crossRef.enabled ? 'enabled' : 'disabled'}`);
			},
		});

		// Manuscript Navigator Commands
		this.addCommand({
			id: 'open-manuscript-navigator',
			name: 'Open Manuscript Navigator',
			callback: async () => {
				await this.activateManuscriptNavigator();
			},
		});

		this.addCommand({
			id: 'toggle-manuscript-navigator',
			name: 'Toggle Manuscript Navigator',
			callback: async () => {
				const leaves = this.app.workspace.getLeavesOfType(MANUSCRIPT_NAVIGATOR_VIEW_TYPE);
				if (leaves.length > 0) {
					// Close if open
					this.app.workspace.detachLeavesOfType(MANUSCRIPT_NAVIGATOR_VIEW_TYPE);
				} else {
					// Open if closed
					await this.activateManuscriptNavigator();
				}
			},
		});

		this.addCommand({
			id: 'refresh-manuscript-navigator',
			name: 'Refresh Manuscript Navigator',
			callback: async () => {
				const leaves = this.app.workspace.getLeavesOfType(MANUSCRIPT_NAVIGATOR_VIEW_TYPE);
				if (leaves.length > 0) {
					const view = leaves[0].view;
					if (view instanceof ManuscriptNavigator) {
						await view.render();
						new Notice('Manuscript navigator refreshed');
					}
				} else {
					new Notice('Manuscript Navigator is not open');
				}
			},
		});

		// Validation Panel Commands
		this.addCommand({
			id: 'open-validation-panel',
			name: 'Open Pre-publication Checklist',
			callback: async () => {
				await this.activateValidationPanel();
			},
		});

		this.addCommand({
			id: 'run-validation',
			name: 'Run Pre-publication Validation',
			callback: async () => {
				await this.activateValidationPanel();
				const leaves = this.app.workspace.getLeavesOfType(VALIDATION_PANEL_VIEW_TYPE);
				if (leaves.length > 0) {
					const view = leaves[0].view;
					if (view instanceof PrePublicationPanel) {
						await view.runValidation();
					}
				}
			},
		});

		this.addCommand({
			id: 'toggle-validation-panel',
			name: 'Toggle Pre-publication Checklist',
			callback: async () => {
				const leaves = this.app.workspace.getLeavesOfType(VALIDATION_PANEL_VIEW_TYPE);
				if (leaves.length > 0) {
					// Close if open
					this.app.workspace.detachLeavesOfType(VALIDATION_PANEL_VIEW_TYPE);
				} else {
					// Open if closed
					await this.activateValidationPanel();
				}
			},
		});

		// Export Commands
		this.addCommand({
			id: 'export-current-file',
			name: 'Export Current File...',
			checkCallback: (checking: boolean) => {
				const activeFile = this.app.workspace.getActiveFile();
				if (activeFile) {
					if (!checking) {
						const dialog = new ExportDialog(this.app, this, [activeFile], async (profile, files, outputPath) => {
							await this.exportManager.exportFiles(files, profile.id, outputPath);
						});
						dialog.open();
					}
					return true;
				}
				return false;
			},
		});

		this.addCommand({
			id: 'export-manuscript',
			name: 'Export Manuscript...',
			callback: async () => {
				const dialog = new ExportDialog(
					this.app,
					this,
					[], // Will use manuscript structure
					async (profile, files, outputPath) => {
						await this.exportManager.exportManuscript(profile.id);
					},
				);
				dialog.open();
			},
		});

		this.addCommand({
			id: 'quick-export-pdf',
			name: 'Quick Export to PDF',
			checkCallback: (checking: boolean) => {
				const activeFile = this.app.workspace.getActiveFile();
				if (activeFile) {
					if (!checking) {
						this.exportManager.exportFiles([activeFile], 'pdf-academic');
					}
					return true;
				}
				return false;
			},
		});

		this.addCommand({
			id: 'quick-export-docx',
			name: 'Quick Export to DOCX',
			checkCallback: (checking: boolean) => {
				const activeFile = this.app.workspace.getActiveFile();
				if (activeFile) {
					if (!checking) {
						this.exportManager.exportFiles([activeFile], 'docx-standard');
					}
					return true;
				}
				return false;
			},
		});

		this.addCommand({
			id: 'quick-export-html',
			name: 'Quick Export to HTML',
			checkCallback: (checking: boolean) => {
				const activeFile = this.app.workspace.getActiveFile();
				if (activeFile) {
					if (!checking) {
						this.exportManager.exportFiles([activeFile], 'html-web');
					}
					return true;
				}
				return false;
			},
		});

		this.addCommand({
			id: 'quick-export-epub',
			name: 'Quick Export to EPUB',
			checkCallback: (checking: boolean) => {
				const activeFile = this.app.workspace.getActiveFile();
				if (activeFile) {
					if (!checking) {
						this.exportManager.exportFiles([activeFile], 'epub-ebook');
					}
					return true;
				}
				return false;
			},
		});

		// Enhanced Bibliography Commands
		this.addCommand({
			id: 'import-citation',
			name: 'Import Citation from DOI/arXiv/PubMed',
			callback: () => {
				const dialog = new CitationImportDialog(this.app, this, async (result) => {
					if (result.success && result.entry) {
						// Add to bibliography
						this.bibliographyManager.addEntry(result.entry.key, result.entry);

						// Save to bibliography file
						const bibFile = this.settings.citations.bibliographyFile;
						if (bibFile) {
							await this.bibliographyManager.saveToBibFile(bibFile);
						}
					}
				});
				dialog.open();
			},
		});

		this.addCommand({
			id: 'detect-duplicate-citations',
			name: 'Detect Duplicate Citations',
			callback: async () => {
				const allEntries = this.bibliographyManager.getAllCitations();
				const threshold = this.settings.enhancedBib?.duplicateSimilarityThreshold || 0.8;

				const duplicates = this.duplicateDetector.findDuplicates(allEntries, threshold);

				if (duplicates.length === 0) {
					new Notice('✓ No duplicate citations found');
					return;
				}

				const dialog = new DuplicateManagementDialog(this.app, this, duplicates, async (canonical, duplicateKeys) => {
					// Merge duplicates
					const canonicalEntry = allEntries.get(canonical);
					if (!canonicalEntry) return;

					for (const dupKey of duplicateKeys) {
						const dupEntry = allEntries.get(dupKey);
						if (dupEntry) {
							const merged = this.duplicateDetector.mergeDuplicates(canonicalEntry, dupEntry);
							this.bibliographyManager.addEntry(canonical, merged);
							this.bibliographyManager.removeEntry(dupKey);
						}
					}

					// Save changes
					const bibFile = this.settings.citations.bibliographyFile;
					if (bibFile) {
						await this.bibliographyManager.saveToBibFile(bibFile);
					}

					new Notice(`✓ Merged ${duplicateKeys.length} duplicate(s) into ${canonical}`);
				});
				dialog.open();
			},
		});

		// Template & Snippet commands
		this.addCommand({
			id: 'insert-template',
			name: 'Insert Template',
			callback: () => {
				if (!this.settings.templates?.enabled) {
					new Notice('Templates are disabled in settings');
					return;
				}

				const templates = this.templateManager.getAllTemplates();
				const selector = new TemplateSelectorModal(this.app, templates, (template) => {
					// Show variable input dialog
					const variableDialog = new TemplateVariableModal(
						this.app,
						template,
						async (values) => {
							const result = await this.templateManager.insertTemplate({
								template,
								variableValues: values,
								insertAtCursor: true,
							});

							if (!result.success) {
								new Notice(`Failed to insert template: ${result.error}`);
							}
						},
						this,
					);
					variableDialog.open();
				});
				selector.open();
			},
		});

		this.addCommand({
			id: 'insert-snippet',
			name: 'Insert Snippet',
			callback: () => {
				if (!this.settings.templates?.enabled) {
					new Notice('Snippets are disabled in settings');
					return;
				}

				const snippets = this.snippetManager.getAllSnippets();
				const selector = new SnippetSelectorModal(this.app, snippets, (snippet) => {
					// Show variable input dialog
					const variableDialog = new TemplateVariableModal(
						this.app,
						snippet,
						async (values) => {
							const result = await this.snippetManager.insertSnippet({
								snippet,
								variableValues: values,
								insertAtCursor: true,
							});

							if (!result.success) {
								new Notice(`Failed to insert snippet: ${result.error}`);
							}
						},
						this,
					);
					variableDialog.open();
				});
				selector.open();
			},
		});

		this.addCommand({
			id: 'insert-figure',
			name: 'Insert Figure Snippet',
			callback: () => {
				const snippet = this.snippetManager.getSnippet('figure-latex');
				if (!snippet) {
					new Notice('Figure snippet not found');
					return;
				}

				const variableDialog = new TemplateVariableModal(
					this.app,
					snippet,
					async (values) => {
						const result = await this.snippetManager.insertSnippet({
							snippet,
							variableValues: values,
							insertAtCursor: true,
						});

						if (!result.success) {
							new Notice(`Failed to insert figure: ${result.error}`);
						}
					},
					this,
				);
				variableDialog.open();
			},
		});

		this.addCommand({
			id: 'insert-table',
			name: 'Insert Table Snippet',
			callback: () => {
				const snippet = this.snippetManager.getSnippet('table-basic');
				if (!snippet) {
					new Notice('Table snippet not found');
					return;
				}

				const variableDialog = new TemplateVariableModal(
					this.app,
					snippet,
					async (values) => {
						const result = await this.snippetManager.insertSnippet({
							snippet,
							variableValues: values,
							insertAtCursor: true,
						});

						if (!result.success) {
							new Notice(`Failed to insert table: ${result.error}`);
						}
					},
					this,
				);
				variableDialog.open();
			},
		});

		this.addCommand({
			id: 'insert-equation',
			name: 'Insert Equation Snippet',
			callback: () => {
				const snippet = this.snippetManager.getSnippet('equation-display');
				if (!snippet) {
					new Notice('Equation snippet not found');
					return;
				}

				const variableDialog = new TemplateVariableModal(
					this.app,
					snippet,
					async (values) => {
						const result = await this.snippetManager.insertSnippet({
							snippet,
							variableValues: values,
							insertAtCursor: true,
						});

						if (!result.success) {
							new Notice(`Failed to insert equation: ${result.error}`);
						}
					},
					this,
				);
				variableDialog.open();
			},
		});

		// Phase 4A: Pre-Publication Checklist Commands
		this.addCommand({
			id: 'show-publication-checklist',
			name: 'Show Pre-Publication Checklist',
			callback: async () => {
				if (!this.settings.quality?.checklist?.enabled) {
					new Notice('Pre-Publication Checklist is disabled in settings');
					return;
				}

				const activeFile = this.app.workspace.getActiveFile();
				if (!activeFile) {
					new Notice('No active file');
					return;
				}

				// Activate or reveal the checklist panel
				await this.activateChecklistPanel();
			},
		});

		this.addCommand({
			id: 'run-auto-validation',
			name: 'Run Auto-Validation on Checklist',
			callback: async () => {
				if (!this.settings.quality?.checklist?.enabled) {
					new Notice('Pre-Publication Checklist is disabled in settings');
					return;
				}

				const activeFile = this.app.workspace.getActiveFile();
				if (!activeFile) {
					new Notice('No active file');
					return;
				}

				await this.checklistManager.runAutoValidation(activeFile.path);
				new Notice('Auto-validation complete');
			},
		});

		// Phase 4A: Progress Tracking Commands
		this.addCommand({
			id: 'start-writing-session',
			name: 'Start Writing Session',
			callback: async () => {
				if (!this.settings.quality?.progress?.enabled) {
					new Notice('Progress Tracking is disabled in settings');
					return;
				}

				const activeFile = this.app.workspace.getActiveFile();
				if (!activeFile) {
					new Notice('No active file');
					return;
				}

				// Session tracking happens automatically via event handlers
				new Notice('Writing session tracking is automatic (see progress stats)');
			},
		});

		this.addCommand({
			id: 'end-writing-session',
			name: 'End Writing Session',
			callback: async () => {
				if (!this.settings.quality?.progress?.enabled) {
					new Notice('Progress Tracking is disabled in settings');
					return;
				}

				const activeFile = this.app.workspace.getActiveFile();
				if (!activeFile) {
					new Notice('No active file');
					return;
				}

				// Session tracking happens automatically via event handlers
				new Notice('Session data saved automatically (see progress stats)');
			},
		});

		this.addCommand({
			id: 'show-progress-stats',
			name: 'Show Progress Statistics',
			callback: async () => {
				if (!this.settings.quality?.progress?.enabled) {
					new Notice('Progress Tracking is disabled in settings');
					return;
				}

				const streak = this.progressManager.getStreak();
				const velocity = this.progressManager.getVelocity();
				const goals = this.progressManager.getGoals();
				const csv = this.progressManager.exportToCSV();

				new Notice('Progress stats exported to console (UI panel coming soon)');
				console.log('Streak:', streak);
				console.log('Velocity:', velocity);
				console.log('Goals:', goals);
				console.log('CSV Export:', csv);
			},
		});

		// Phase 4A: Research Bible Commands
		this.addCommand({
			id: 'add-research-fact',
			name: 'Add Research Fact',
			callback: async () => {
				if (!this.settings.quality?.researchBible?.enabled) {
					new Notice('Research Bible is disabled in settings');
					return;
				}

				new ResearchFactModal(this.app, this).open();
			},
		});

		this.addCommand({
			id: 'search-research-bible',
			name: 'Search Research Bible',
			callback: async () => {
				if (!this.settings.quality?.researchBible?.enabled) {
					new Notice('Research Bible is disabled in settings');
					return;
				}

				new ResearchSearchModal(this.app, this).open();
			},
		});

		this.addCommand({
			id: 'check-terminology-consistency',
			name: 'Check Terminology Consistency',
			callback: async () => {
				if (!this.settings.quality?.researchBible?.enabled) {
					new Notice('Research Bible is disabled in settings');
					return;
				}

				const activeFile = this.app.workspace.getActiveFile();
				if (!activeFile) {
					new Notice('No active file');
					return;
				}

				await this.app.vault.read(activeFile);
				const issues = await this.researchBible.checkTerminologyConsistency();

				if (issues.length === 0) {
					new Notice('✓ No terminology inconsistencies found');
				} else {
					new Notice(`Found ${issues.length} terminology inconsistencies (check console)`);
					console.log('Terminology Inconsistencies:', issues);
				}
			},
		});

		this.addCommand({
			id: 'export-glossary',
			name: 'Export Glossary',
			callback: async () => {
				if (!this.settings.quality?.researchBible?.enabled) {
					new Notice('Research Bible is disabled in settings');
					return;
				}

				const format = this.settings.quality.researchBible.exportFormat || 'markdown';
				const glossary = this.researchBible.exportGlossary(format);

				new Notice(`Glossary exported to console as ${format}`);
				console.log('Glossary:', glossary);
			},
		});

		// Phase 4A: Readability Analysis Commands
		this.addCommand({
			id: 'analyze-readability',
			name: 'Analyze Document Readability',
			callback: async () => {
				if (!this.settings.quality?.readability?.enabled) {
					new Notice('Readability Analysis is disabled in settings');
					return;
				}

				const activeFile = this.app.workspace.getActiveFile();
				if (!activeFile) {
					new Notice('No active file');
					return;
				}

				const analysis = await this.readabilityAnalyzer.analyzeDocument(activeFile);

				new Notice(`Readability Score: ${analysis.overall.fleschReadingEase.toFixed(1)}`);
				console.log('Readability Analysis:', analysis);
			},
		});

		this.addCommand({
			id: 'analyze-section-readability',
			name: 'Analyze Section Readability',
			callback: async () => {
				if (!this.settings.quality?.readability?.enabled) {
					new Notice('Readability Analysis is disabled in settings');
					return;
				}

				const activeFile = this.app.workspace.getActiveFile();
				if (!activeFile) {
					new Notice('No active file');
					return;
				}

				const content = await this.app.vault.read(activeFile);
				const sections = await this.readabilityAnalyzer.analyzeSections(content);

				new Notice(`Analyzed ${sections.length} sections (check console)`);
				console.log('Section Readability:', sections);
			},
		});

		this.addCommand({
			id: 'export-readability-report',
			name: 'Export Readability Report',
			callback: async () => {
				if (!this.settings.quality?.readability?.enabled) {
					new Notice('Readability Analysis is disabled in settings');
					return;
				}

				const activeFile = this.app.workspace.getActiveFile();
				if (!activeFile) {
					new Notice('No active file');
					return;
				}

				const analysis = await this.readabilityAnalyzer.analyzeDocument(activeFile);

				// Export to markdown (create simple report)
				const report =
					`# Readability Report\n\n` +
					`**Flesch Reading Ease:** ${analysis.overall.fleschReadingEase.toFixed(1)}\n` +
					`**Grade Level:** ${analysis.overall.fleschKincaidGrade.toFixed(1)}\n` +
					`**Gunning Fog:** ${analysis.overall.gunningFogIndex.toFixed(1)}\n\n` +
					`**Target Audience:** ${JSON.stringify(analysis.targetAudience)}\n` +
					`**Status:** ${analysis.comparisonToTarget.status}\n` +
					`**Recommendations:** ${analysis.recommendations.length} suggestions\n`;

				new Notice('Readability report exported to console');
				console.log('Readability Report:', report);
			},
		});
	}

	toggleConcealer() {
		this.settings.enabled = !this.settings.enabled;
		this.saveSettings();
		this.updateEditorExtension();
		new Notice(`Manuscript Pro ${this.settings.enabled ? 'enabled' : 'disabled'}`);
	}

	toggleGroup(groupKey: keyof typeof DEFAULT_SETTINGS.groups, groupName: string) {
		this.settings.groups[groupKey] = !this.settings.groups[groupKey];
		this.saveSettings();
		this.updateEditorExtension();
		new Notice(`${groupName} ${this.settings.groups[groupKey] ? 'enabled' : 'disabled'}`);
	}

	async onload() {
		await this.loadSettings();
		await this.loadStatsData();
		console.log('Loading Manuscript Pro Plugin');

		// Initialize managers
		this.focusModeManager = new FocusModeManager(this);
		this.profileManager = new ProfileManager(this);
		await this.profileManager.initialize();

		this.bibliographyManager = new BibliographyManager(this);
		this.citationFormatter = new CitationFormatter();
		this.citationFormatter.setActiveStyle(this.settings.citations.citationStyle);

		this.crossRefManager = new CrossRefManager(this);

		// Initialize export manager
		this.exportManager = new ExportManager(this);
		if (this.settings.export?.enabled) {
			await this.exportManager.initialize();
		}

		// Initialize enhanced bibliography
		this.citationImporter = new CitationImporter(this);
		this.duplicateDetector = new DuplicateDetector();
		this.citationSuggestionEngine = new CitationSuggestionEngine(this);

		// Initialize template & snippet managers
		this.templateManager = new TemplateManager(this);
		this.snippetManager = new SnippetManager(this);
		if (this.settings.templates?.enabled) {
			await this.templateManager.initialize();
			await this.snippetManager.initialize();
		}

		// Initialize autocomplete systems
		this.templateVariableHelper = new TemplateVariableHelper(this);
		this.snippetSuggest = new SnippetSuggest(this);
		if (this.settings.templates?.enabled && this.settings.templates?.enableTriggers) {
			this.registerEditorSuggest(this.snippetSuggest);
		}

		// Initialize Phase 4A managers
		this.checklistManager = new PublicationChecklistManager(this);
		this.progressManager = new ProgressTrackingManager(this);
		this.researchBible = new ResearchBibleManager(this);
		this.readabilityAnalyzer = new ReadabilityAnalyzer(this);

		if (this.settings.quality?.checklist?.enabled) {
			await this.checklistManager.initialize();
		}
		if (this.settings.quality?.progress?.enabled) {
			await this.progressManager.initialize();
		}
		if (this.settings.quality?.researchBible?.enabled) {
			await this.researchBible.initialize();
		}

		// Register stats panel view
		this.registerView(STATS_VIEW_TYPE, (leaf: WorkspaceLeaf) => new StatsPanel(leaf, this));

		// Register label browser view
		this.registerView(LABEL_BROWSER_VIEW_TYPE, (leaf: WorkspaceLeaf) => new LabelBrowser(leaf, this));

		// Register manuscript navigator view
		this.registerView(MANUSCRIPT_NAVIGATOR_VIEW_TYPE, (leaf: WorkspaceLeaf) => new ManuscriptNavigator(leaf, this));

		// Register validation panel view
		this.registerView(VALIDATION_PANEL_VIEW_TYPE, (leaf: WorkspaceLeaf) => new PrePublicationPanel(leaf, this));

		// Register Checklist Panel View
		this.registerView(CHECKLIST_PANEL_VIEW_TYPE, (leaf: WorkspaceLeaf) => new ChecklistPanelView(leaf, this));

		// Register commands
		this.registerCommands();

		// Setup editor extensions
		this.addEditorExtension();
		this.registerEditorExtension(this.editorExtensions);
		this.addEvents();

		// Setup UI
		this.setupStatusBar();
		this.addSettingTab(new SettingsTab(this.app, this));

		// Defer ribbon icon creation to position it after other plugins
		this.app.workspace.onLayoutReady(() => {
			this.setupRibbon();
		});

		// Load bibliography for active file
		if (this.settings.citations.enabled) {
			await loadBibliographyForActiveFile(this);
		}

		// Index labels on startup if enabled
		if (this.settings.crossRef.enabled && this.settings.crossRef.indexOnStartup) {
			await this.crossRefManager.indexVault();
			if (this.settings.debugMode) {
				const stats = this.crossRefManager.getStats();
				console.log(`Manuscript Pro: Indexed ${stats.totalLabels} labels from ${stats.filesIndexed} files`);
			}
		}

		// Delay sidebar view initialization until workspace is fully loaded
		// This prevents "Cannot read properties of null" errors during startup
		this.app.workspace.onLayoutReady(() => {
			// Open stats panel if enabled
			if (this.settings.statistics.enabled && this.settings.statistics.showInSidebar) {
				this.activateStatsView();
			}

			// Open label browser if enabled
			if (this.settings.crossRef.enabled && this.settings.crossRef.showLabelBrowser) {
				this.activateLabelBrowser();
			}

			// Open manuscript navigator if enabled
			if (this.settings.manuscriptNavigator.enabled && this.settings.manuscriptNavigator.showInSidebar) {
				this.activateManuscriptNavigator();
			}
		});

		// Enable Focus Mode if it was active
		if (this.settings.focusMode.enabled) {
			this.focusModeManager.enable();
		}

		if (this.settings.debugMode) {
			console.log('Manuscript Pro: Debug mode enabled');
			console.log('Settings:', this.settings);
		}
	}

	async activateStatsView() {
		const { workspace } = this.app;

		let leaf: WorkspaceLeaf | null = null;
		const leaves = workspace.getLeavesOfType(STATS_VIEW_TYPE);

		if (leaves.length > 0) {
			// View already exists, reveal it
			leaf = leaves[0];
		} else {
			// Create new view in right sidebar
			try {
				const rightLeaf = workspace.getRightLeaf(false);
				if (rightLeaf) {
					await rightLeaf.setViewState({
						type: STATS_VIEW_TYPE,
						active: true,
					});
					leaf = rightLeaf;
				}
			} catch (error) {
				if (this.settings.debugMode) {
					console.error('Manuscript Pro: Failed to create stats view in sidebar:', error);
				}
				return;
			}
		}

		if (leaf) {
			workspace.revealLeaf(leaf);
		}
	}

	async activateLabelBrowser() {
		const { workspace } = this.app;

		let leaf: WorkspaceLeaf | null = null;
		const leaves = workspace.getLeavesOfType(LABEL_BROWSER_VIEW_TYPE);

		if (leaves.length > 0) {
			// View already exists, reveal it
			leaf = leaves[0];
		} else {
			// Create new view in right sidebar
			try {
				const rightLeaf = workspace.getRightLeaf(false);
				if (rightLeaf) {
					await rightLeaf.setViewState({
						type: LABEL_BROWSER_VIEW_TYPE,
						active: true,
					});
					leaf = rightLeaf;
				}
			} catch (error) {
				if (this.settings.debugMode) {
					console.error('Manuscript Pro: Failed to create label browser in sidebar:', error);
				}
				return;
			}
		}

		if (leaf) {
			workspace.revealLeaf(leaf);
		}
	}

	async activateChecklistPanel() {
		const { workspace } = this.app;

		let leaf: WorkspaceLeaf | null = null;
		const leaves = workspace.getLeavesOfType(CHECKLIST_PANEL_VIEW_TYPE);

		if (leaves.length > 0) {
			// View already exists, reveal it
			leaf = leaves[0];
		} else {
			// Create new view in right sidebar
			try {
				const rightLeaf = workspace.getRightLeaf(false);
				if (rightLeaf) {
					await rightLeaf.setViewState({
						type: CHECKLIST_PANEL_VIEW_TYPE,
						active: true,
					});
					leaf = rightLeaf;
				}
			} catch (error) {
				if (this.settings.debugMode) {
					console.error('Manuscript Pro: Failed to create checklist panel in sidebar:', error);
				}
				return;
			}
		}

		if (leaf) {
			workspace.revealLeaf(leaf);
		}
	}

	async activateManuscriptNavigator() {
		const { workspace } = this.app;

		let leaf: WorkspaceLeaf | null = null;
		const leaves = workspace.getLeavesOfType(MANUSCRIPT_NAVIGATOR_VIEW_TYPE);

		if (leaves.length > 0) {
			// View already exists, reveal it
			leaf = leaves[0];
		} else {
			// Create new view in left sidebar
			try {
				const leftLeaf = workspace.getLeftLeaf(false);
				if (leftLeaf) {
					await leftLeaf.setViewState({
						type: MANUSCRIPT_NAVIGATOR_VIEW_TYPE,
						active: true,
					});
					leaf = leftLeaf;
				}
			} catch (error) {
				if (this.settings.debugMode) {
					console.error('Manuscript Pro: Failed to create manuscript navigator in sidebar:', error);
				}
				return;
			}
		}

		if (leaf) {
			workspace.revealLeaf(leaf);
		}
	}

	async openManuscriptEditor() {
		const loader = new ManuscriptLoader(this.app.vault);

		// Find manifest file
		const manifestFile = await loader.findManifest();

		if (!manifestFile) {
			new Notice('No manuscript project found. Please create book-manifest.json, manuscript.json, or book.json');
			return;
		}

		try {
			// Load manuscript
			const manuscript = await loader.loadManuscript(manifestFile);

			// Validate
			const validation = loader.validate(manuscript);
			if (validation.errors.length > 0) {
				new Notice(`⚠ Manuscript has ${validation.errors.length} errors`);
			}

			// Open editor modal
			const modal = new ManuscriptEditorModal(this.app, this, manifestFile, manuscript);
			modal.open();
		} catch (error) {
			new Notice('Failed to load manuscript project');
			console.error('Manuscript load error:', error);
		}
	}

	async activateValidationPanel() {
		const { workspace } = this.app;

		let leaf: WorkspaceLeaf | null = null;
		const leaves = workspace.getLeavesOfType(VALIDATION_PANEL_VIEW_TYPE);

		if (leaves.length > 0) {
			// View already exists, reveal it
			leaf = leaves[0];
		} else {
			// Create new view in right sidebar
			const rightLeaf = workspace.getRightLeaf(false);
			if (rightLeaf) {
				await rightLeaf.setViewState({
					type: VALIDATION_PANEL_VIEW_TYPE,
					active: true,
				});
				leaf = rightLeaf;
			}
		}

		if (leaf) {
			workspace.revealLeaf(leaf);
		}
	}

	onunload() {
		console.log('Unloading Manuscript Pro Plugin...');

		// Cleanup Focus Mode
		if (this.focusModeManager) {
			this.focusModeManager.cleanup();
		}

		// Detach views
		this.app.workspace.detachLeavesOfType(STATS_VIEW_TYPE);
		this.app.workspace.detachLeavesOfType(LABEL_BROWSER_VIEW_TYPE);
		this.app.workspace.detachLeavesOfType(MANUSCRIPT_NAVIGATOR_VIEW_TYPE);
		this.app.workspace.detachLeavesOfType(VALIDATION_PANEL_VIEW_TYPE);
		this.app.workspace.detachLeavesOfType(CHECKLIST_PANEL_VIEW_TYPE);
	}
}
