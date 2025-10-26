import { App, PluginSettingTab, Setting } from 'obsidian';
import LatexPandocConcealerPlugin from './main';
import { getAllPatternGroups } from './patterns';

export class SettingsTab extends PluginSettingTab {
	plugin: LatexPandocConcealerPlugin;

	constructor(app: App, plugin: LatexPandocConcealerPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display() {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl('h2', { text: 'LaTeX-Pandoc Concealer Settings' });

		// General Settings
		containerEl.createEl('h3', { text: 'General' });

		new Setting(containerEl)
			.setName('Enable LaTeX-Pandoc Concealer')
			.setDesc('Master toggle for the concealer plugin')
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.enabled).onChange(async (value) => {
					this.plugin.settings.enabled = value;
					await this.plugin.saveSettings();
					this.plugin.updateEditorExtension();
				}),
			);

		new Setting(containerEl)
			.setName('Enable in Live Preview')
			.setDesc('Conceal syntax in Live Preview mode (recommended)')
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.enableInLivePreview).onChange(async (value) => {
					this.plugin.settings.enableInLivePreview = value;
					await this.plugin.saveSettings();
					this.plugin.updateEditorExtension();
				}),
			);

		new Setting(containerEl)
			.setName('Enable in Reading Mode')
			.setDesc('Conceal syntax in Reading Mode')
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.enableInReadingMode).onChange(async (value) => {
					this.plugin.settings.enableInReadingMode = value;
					await this.plugin.saveSettings();
				}),
			);

		// Pattern Groups
		containerEl.createEl('h3', { text: 'Pattern Groups' });

		const groupsDesc = containerEl.createEl('p', {
			text: 'Toggle specific pattern groups to customize which syntax elements are concealed. Each group can be toggled independently.',
		});
		groupsDesc.style.color = 'var(--text-muted)';
		groupsDesc.style.marginBottom = '1em';

		// Get pattern groups for descriptions
		const allGroups = getAllPatternGroups();

		new Setting(containerEl)
			.setName('Math Delimiters')
			.setDesc(allGroups[0].description + ' (Group 1)')
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.groups.mathDelimiters).onChange(async (value) => {
					this.plugin.settings.groups.mathDelimiters = value;
					await this.plugin.saveSettings();
					this.plugin.updateEditorExtension();
				}),
			);

		new Setting(containerEl)
			.setName('Citations')
			.setDesc(allGroups[1].description + ' (Group 2)')
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.groups.citations).onChange(async (value) => {
					this.plugin.settings.groups.citations = value;
					await this.plugin.saveSettings();
					this.plugin.updateEditorExtension();
				}),
			);

		new Setting(containerEl)
			.setName('LaTeX Commands')
			.setDesc(allGroups[2].description + ' (Group 3)')
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.groups.latexCommands).onChange(async (value) => {
					this.plugin.settings.groups.latexCommands = value;
					await this.plugin.saveSettings();
					this.plugin.updateEditorExtension();
				}),
			);

		new Setting(containerEl)
			.setName('Pandoc Markup')
			.setDesc(allGroups[3].description + ' (Group 4)')
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.groups.pandocMarkup).onChange(async (value) => {
					this.plugin.settings.groups.pandocMarkup = value;
					await this.plugin.saveSettings();
					this.plugin.updateEditorExtension();
				}),
			);

		new Setting(containerEl)
			.setName('Indexing & Metadata')
			.setDesc(allGroups[4].description + ' (Group 5)')
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.groups.indexingMeta).onChange(async (value) => {
					this.plugin.settings.groups.indexingMeta = value;
					await this.plugin.saveSettings();
					this.plugin.updateEditorExtension();
				}),
			);

		// Profile Management
		containerEl.createEl('h3', { text: 'Profile Management' });

		const profileDesc = containerEl.createEl('p', {
			text: 'Save and switch between different concealment configurations. Profiles allow you to quickly toggle between different use cases like math review, citation checking, or clean prose writing.',
		});
		profileDesc.style.color = 'var(--text-muted)';
		profileDesc.style.marginBottom = '1em';

		// Active Profile Display
		const activeProfile = this.plugin.profileManager.getActiveProfile();
		if (activeProfile) {
			const activeProfileSetting = new Setting(containerEl)
				.setName('Active Profile')
				.setDesc(`Currently using: ${activeProfile.name} - ${activeProfile.description}`);
			activeProfileSetting.settingEl.style.backgroundColor = 'var(--background-secondary)';
			activeProfileSetting.settingEl.style.padding = '1em';
			activeProfileSetting.settingEl.style.borderRadius = '5px';
		}

		// Profile List
		const profiles = this.plugin.profileManager.getAllProfiles();

		containerEl.createEl('h4', { text: 'Available Profiles' });

		profiles.forEach((profile) => {
			const isActive = profile.isActive;
			const isDefault = profile.isDefault;

			const profileSetting = new Setting(containerEl)
				.setName(`${profile.icon} ${profile.name}${isActive ? ' (Active)' : ''}${isDefault ? ' [Default]' : ''}`)
				.setDesc(profile.description);

			// Switch button
			profileSetting.addButton((button) => {
				button
					.setButtonText('Switch')
					.setDisabled(isActive)
					.onClick(async () => {
						await this.plugin.profileManager.applyProfile(profile.id);
						this.display(); // Refresh settings UI
					});
			});

			// Duplicate button
			profileSetting.addButton((button) => {
				button
					.setIcon('copy')
					.setTooltip('Duplicate')
					.onClick(async () => {
						const newName = `${profile.name} (Copy)`;
						this.plugin.profileManager.duplicateProfile(profile.id, newName);
						this.display(); // Refresh settings UI
					});
			});

			// Delete button (only for non-default profiles)
			if (!isDefault) {
				profileSetting.addButton((button) => {
					button
						.setIcon('trash')
						.setTooltip('Delete')
						.setWarning()
						.onClick(async () => {
							const confirmed = confirm(
								`Are you sure you want to delete the profile "${profile.name}"? This cannot be undone.`,
							);
							if (confirmed) {
								this.plugin.profileManager.deleteProfile(profile.id);
								this.display(); // Refresh settings UI
							}
						});
				});
			}
		});

		// Profile Actions
		containerEl.createEl('h4', { text: 'Profile Actions' });

		new Setting(containerEl)
			.setName('Save current settings as new profile')
			.setDesc('Create a new profile from your current concealment settings')
			.addButton((button) => {
				button
					.setButtonText('Save as Profile')
					.setCta()
					.onClick(async () => {
						const name = prompt('Enter a name for the new profile:');
						if (name) {
							const description = prompt('Enter a description (optional):') || '';
							const icon = prompt('Enter an icon/emoji (optional):') || '📄';
							this.plugin.profileManager.saveCurrentAsProfile(name, description, icon);
							this.display(); // Refresh settings UI
						}
					});
			});

		new Setting(containerEl)
			.setName('Export profile')
			.setDesc('Export a profile as JSON to share or backup')
			.addDropdown((dropdown) => {
				profiles.forEach((profile) => {
					dropdown.addOption(profile.id, `${profile.icon} ${profile.name}`);
				});
				dropdown.setValue(activeProfile?.id || profiles[0].id);
			})
			.addButton((button) => {
				button.setButtonText('Export').onClick(() => {
					const dropdown = button.buttonEl.parentElement?.querySelector('select') as HTMLSelectElement;
					const profileId = dropdown?.value;
					if (profileId) {
						const json = this.plugin.profileManager.exportProfile(profileId);
						const profile = this.plugin.profileManager.getProfile(profileId);

						// Create download
						const blob = new Blob([json], { type: 'application/json' });
						const url = URL.createObjectURL(blob);
						const a = document.createElement('a');
						a.href = url;
						a.download = `${profile?.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-profile.json`;
						a.click();
						URL.revokeObjectURL(url);
					}
				});
			});

		new Setting(containerEl)
			.setName('Export all profiles')
			.setDesc('Export all your profiles as a single JSON file')
			.addButton((button) => {
				button.setButtonText('Export All').onClick(() => {
					const json = this.plugin.profileManager.exportAllProfiles();

					// Create download
					const blob = new Blob([json], { type: 'application/json' });
					const url = URL.createObjectURL(blob);
					const a = document.createElement('a');
					a.href = url;
					a.download = 'manuscript-pro-profiles.json';
					a.click();
					URL.revokeObjectURL(url);
				});
			});

		new Setting(containerEl)
			.setName('Import profile')
			.setDesc('Import a profile from a JSON file')
			.addButton((button) => {
				button.setButtonText('Import').onClick(() => {
					const input = document.createElement('input');
					input.type = 'file';
					input.accept = '.json';
					input.onchange = async (e: Event) => {
						const file = (e.target as HTMLInputElement).files?.[0];
						if (file) {
							const reader = new FileReader();
							reader.onload = (e) => {
								const json = e.target?.result as string;
								const imported = this.plugin.profileManager.importProfile(json);
								if (imported) {
									this.display(); // Refresh settings UI
									alert(`Successfully imported profile: ${imported.name}`);
								} else {
									alert('Failed to import profile. Please check the JSON format.');
								}
							};
							reader.readAsText(file);
						}
					};
					input.click();
				});
			});

		new Setting(containerEl)
			.setName('Generate share URL')
			.setDesc('Generate a shareable URL for a profile (encoded in URL)')
			.addDropdown((dropdown) => {
				profiles.forEach((profile) => {
					dropdown.addOption(profile.id, `${profile.icon} ${profile.name}`);
				});
				dropdown.setValue(activeProfile?.id || profiles[0].id);
			})
			.addButton((button) => {
				button.setButtonText('Generate URL').onClick(() => {
					const dropdown = button.buttonEl.parentElement?.querySelector('select') as HTMLSelectElement;
					const profileId = dropdown?.value;
					if (profileId) {
						const shareURL = this.plugin.profileManager.generateShareURL(profileId);

						// Copy to clipboard
						navigator.clipboard.writeText(shareURL).then(() => {
							alert('Share URL copied to clipboard!');
						});
					}
				});
			});

		new Setting(containerEl)
			.setName('Import from share URL')
			.setDesc('Import a profile from a share URL')
			.addButton((button) => {
				button.setButtonText('Import from URL').onClick(() => {
					const url = prompt('Paste the share URL:');
					if (url) {
						const imported = this.plugin.profileManager.importFromURL(url);
						if (imported) {
							this.display(); // Refresh settings UI
							alert(`Successfully imported profile: ${imported.name}`);
						} else {
							alert('Failed to import profile. Please check the URL.');
						}
					}
				});
			});

		// Cursor Revealing
		containerEl.createEl('h3', { text: 'Cursor Revealing' });

		const cursorDesc = containerEl.createEl('p', {
			text: 'Control how concealed syntax is revealed when the cursor moves to a line.',
		});
		cursorDesc.style.color = 'var(--text-muted)';
		cursorDesc.style.marginBottom = '1em';

		new Setting(containerEl)
			.setName('Enable cursor revealing')
			.setDesc('Show hidden syntax when cursor is on a line (recommended)')
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.cursorReveal.enabled).onChange(async (value) => {
					this.plugin.settings.cursorReveal.enabled = value;
					await this.plugin.saveSettings();
					this.plugin.updateEditorExtension();
				}),
			);

		new Setting(containerEl)
			.setName('Reveal delay')
			.setDesc('Delay before concealing again after cursor leaves (milliseconds, 0-1000)')
			.addSlider((slider) =>
				slider
					.setLimits(0, 1000, 50)
					.setValue(this.plugin.settings.cursorReveal.delay)
					.setDynamicTooltip()
					.onChange(async (value) => {
						this.plugin.settings.cursorReveal.delay = value;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName('Reveal entire paragraph')
			.setDesc('Reveal the entire paragraph instead of just the current line')
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.cursorReveal.revealParagraph).onChange(async (value) => {
					this.plugin.settings.cursorReveal.revealParagraph = value;
					await this.plugin.saveSettings();
					this.plugin.updateEditorExtension();
				}),
			);

		new Setting(containerEl)
			.setName('Highlight revealed syntax')
			.setDesc('Add background highlight to revealed syntax')
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.cursorReveal.highlightRevealed).onChange(async (value) => {
					this.plugin.settings.cursorReveal.highlightRevealed = value;
					await this.plugin.saveSettings();
					this.plugin.updateEditorExtension();
				}),
			);

		// Focus Mode Settings
		containerEl.createEl('h3', { text: 'Focus Mode' });

		const focusDesc = containerEl.createEl('p', {
			text: 'Distraction-free writing environment with markdown concealment and typewriter dimming.',
		});
		focusDesc.style.color = 'var(--text-muted)';
		focusDesc.style.marginBottom = '1em';

		new Setting(containerEl)
			.setName('Enable Focus Mode')
			.setDesc('Master toggle for Focus Mode features')
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.focusMode.enabled).onChange(async (value) => {
					this.plugin.settings.focusMode.enabled = value;
					await this.plugin.saveSettings();
					if (value) {
						this.plugin.focusModeManager.enable();
					} else {
						this.plugin.focusModeManager.disable();
					}
				}),
			);

		// Markdown Concealment
		containerEl.createEl('h4', { text: 'Markdown Concealment' });

		new Setting(containerEl)
			.setName('Hide markdown syntax')
			.setDesc('Hide heading markers, list markers, and other markdown syntax')
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.focusMode.hideMarkdownSyntax).onChange(async (value) => {
					this.plugin.settings.focusMode.hideMarkdownSyntax = value;
					await this.plugin.saveSettings();
					this.plugin.focusModeManager.updateSettings(this.plugin.settings);
				}),
			);

		new Setting(containerEl)
			.setName('Hide heading markers')
			.setDesc('Hide # symbols from headings')
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.focusMode.hideHeadingMarkers).onChange(async (value) => {
					this.plugin.settings.focusMode.hideHeadingMarkers = value;
					await this.plugin.saveSettings();
					this.plugin.focusModeManager.updateSettings(this.plugin.settings);
				}),
			);

		new Setting(containerEl)
			.setName('Hide list markers')
			.setDesc('Hide - * + and numbered list markers')
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.focusMode.hideListMarkers).onChange(async (value) => {
					this.plugin.settings.focusMode.hideListMarkers = value;
					await this.plugin.saveSettings();
					this.plugin.focusModeManager.updateSettings(this.plugin.settings);
				}),
			);

		new Setting(containerEl)
			.setName('Hide blockquote markers')
			.setDesc('Hide > symbols from blockquotes')
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.focusMode.hideBlockquoteMarkers).onChange(async (value) => {
					this.plugin.settings.focusMode.hideBlockquoteMarkers = value;
					await this.plugin.saveSettings();
					this.plugin.focusModeManager.updateSettings(this.plugin.settings);
				}),
			);

		// Typewriter Mode
		containerEl.createEl('h4', { text: 'Typewriter Mode' });

		new Setting(containerEl)
			.setName('Enable typewriter mode')
			.setDesc('Dim non-active text to focus on current writing area')
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.focusMode.typewriterMode).onChange(async (value) => {
					this.plugin.settings.focusMode.typewriterMode = value;
					await this.plugin.saveSettings();
					this.plugin.updateEditorExtension();
				}),
			);

		new Setting(containerEl)
			.setName('Active zone')
			.setDesc('Define what area stays highlighted while typing')
			.addDropdown((dropdown) =>
				dropdown
					.addOption('sentence', 'Sentence')
					.addOption('paragraph', 'Paragraph')
					.addOption('section', 'Section')
					.setValue(this.plugin.settings.focusMode.activeZone)
					.onChange(async (value: 'sentence' | 'paragraph' | 'section') => {
						this.plugin.settings.focusMode.activeZone = value;
						await this.plugin.saveSettings();
						this.plugin.updateEditorExtension();
					}),
			);

		new Setting(containerEl)
			.setName('Dim opacity')
			.setDesc('How much to dim non-active text (0.1 = very dim, 0.9 = barely dim)')
			.addSlider((slider) =>
				slider
					.setLimits(0.1, 0.9, 0.1)
					.setValue(this.plugin.settings.focusMode.dimOpacity)
					.setDynamicTooltip()
					.onChange(async (value) => {
						this.plugin.settings.focusMode.dimOpacity = value;
						await this.plugin.saveSettings();
						this.plugin.updateEditorExtension();
					}),
			);

		new Setting(containerEl)
			.setName('Highlight active zone')
			.setDesc('Add subtle background highlight to active zone')
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.focusMode.highlightActive).onChange(async (value) => {
					this.plugin.settings.focusMode.highlightActive = value;
					await this.plugin.saveSettings();
					this.plugin.updateEditorExtension();
				}),
			);

		// Reading Width
		containerEl.createEl('h4', { text: 'Reading Width' });

		new Setting(containerEl)
			.setName('Center text')
			.setDesc('Center editor content with comfortable margins')
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.focusMode.centerText).onChange(async (value) => {
					this.plugin.settings.focusMode.centerText = value;
					await this.plugin.saveSettings();
					this.plugin.focusModeManager.updateSettings(this.plugin.settings);
				}),
			);

		new Setting(containerEl)
			.setName('Line width')
			.setDesc('Maximum line width in characters (40-120)')
			.addSlider((slider) =>
				slider
					.setLimits(40, 120, 5)
					.setValue(this.plugin.settings.focusMode.lineWidth)
					.setDynamicTooltip()
					.onChange(async (value) => {
						this.plugin.settings.focusMode.lineWidth = value;
						await this.plugin.saveSettings();
						this.plugin.focusModeManager.updateSettings(this.plugin.settings);
					}),
			);

		// UI Minimization
		containerEl.createEl('h4', { text: 'UI Minimization' });

		new Setting(containerEl)
			.setName('Hide file explorer')
			.setDesc('Automatically hide the file explorer when Focus Mode is enabled')
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.focusMode.hideExplorer).onChange(async (value) => {
					this.plugin.settings.focusMode.hideExplorer = value;
					await this.plugin.saveSettings();
				}),
			);

		new Setting(containerEl)
			.setName('Hide status bar')
			.setDesc('Hide the status bar when Focus Mode is enabled')
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.focusMode.hideStatusBar).onChange(async (value) => {
					this.plugin.settings.focusMode.hideStatusBar = value;
					await this.plugin.saveSettings();
				}),
			);

		new Setting(containerEl)
			.setName('Hide ribbon')
			.setDesc('Hide the left ribbon when Focus Mode is enabled')
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.focusMode.hideRibbon).onChange(async (value) => {
					this.plugin.settings.focusMode.hideRibbon = value;
					await this.plugin.saveSettings();
				}),
			);

		new Setting(containerEl)
			.setName('Enter fullscreen')
			.setDesc('Automatically enter fullscreen mode when Focus Mode is enabled')
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.focusMode.enterFullscreen).onChange(async (value) => {
					this.plugin.settings.focusMode.enterFullscreen = value;
					await this.plugin.saveSettings();
				}),
			);

		// UI Settings
		containerEl.createEl('h3', { text: 'User Interface' });

		new Setting(containerEl)
			.setName('Show status bar indicator')
			.setDesc('Display concealer status in the status bar (requires restart)')
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.showStatusBar).onChange(async (value) => {
					this.plugin.settings.showStatusBar = value;
					await this.plugin.saveSettings();
				}),
			);

		new Setting(containerEl)
			.setName('Show concealed count')
			.setDesc('Display count of concealed items in status bar')
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.showConcealedCount).onChange(async (value) => {
					this.plugin.settings.showConcealedCount = value;
					await this.plugin.saveSettings();
					this.plugin.updateStatusBar();
				}),
			);

		// Statistics Panel Settings
		containerEl.createEl('h3', { text: 'Manuscript Statistics' });

		const statsDesc = containerEl.createEl('p', {
			text: 'Track word count, citations, structure, readability metrics, and writing progress over time.',
		});
		statsDesc.style.color = 'var(--text-muted)';
		statsDesc.style.marginBottom = '1em';

		new Setting(containerEl)
			.setName('Enable statistics panel')
			.setDesc('Show manuscript statistics in the sidebar')
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.statistics.enabled).onChange(async (value) => {
					this.plugin.settings.statistics.enabled = value;
					await this.plugin.saveSettings();

					if (value && this.plugin.settings.statistics.showInSidebar) {
						await this.plugin.activateStatsView();
					} else {
						this.plugin.app.workspace.detachLeavesOfType('manuscript-stats');
					}
				}),
			);

		new Setting(containerEl)
			.setName('Show in sidebar')
			.setDesc('Automatically open statistics panel in sidebar on startup')
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.statistics.showInSidebar).onChange(async (value) => {
					this.plugin.settings.statistics.showInSidebar = value;
					await this.plugin.saveSettings();
				}),
			);

		new Setting(containerEl)
			.setName('Auto-refresh')
			.setDesc('Automatically refresh statistics while editing')
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.statistics.autoRefresh).onChange(async (value) => {
					this.plugin.settings.statistics.autoRefresh = value;
					await this.plugin.saveSettings();
				}),
			);

		new Setting(containerEl)
			.setName('Refresh interval')
			.setDesc('How often to refresh statistics (seconds, 1-60)')
			.addSlider((slider) =>
				slider
					.setLimits(1, 60, 1)
					.setValue(this.plugin.settings.statistics.refreshInterval)
					.setDynamicTooltip()
					.onChange(async (value) => {
						this.plugin.settings.statistics.refreshInterval = value;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName('Track writing history')
			.setDesc('Store daily word count and writing session data')
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.statistics.trackHistory).onChange(async (value) => {
					this.plugin.settings.statistics.trackHistory = value;
					await this.plugin.saveSettings();
				}),
			);

		new Setting(containerEl)
			.setName('Show writing goals')
			.setDesc('Enable goal tracking and progress visualization')
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.statistics.showGoals).onChange(async (value) => {
					this.plugin.settings.statistics.showGoals = value;
					await this.plugin.saveSettings();
				}),
			);

		new Setting(containerEl)
			.setName('Open statistics panel')
			.setDesc('Open the manuscript statistics panel')
			.addButton((button) => {
				button
					.setButtonText('Open Panel')
					.setCta()
					.onClick(async () => {
						await this.plugin.activateStatsView();
					});
			});

		// Citation Preview Settings
		containerEl.createEl('h3', { text: 'Citation Preview' });

		const citationDesc = containerEl.createEl('p', {
			text: 'Show bibliographic information when hovering over citations. Automatically discovers and parses .bib files.',
		});
		citationDesc.style.color = 'var(--text-muted)';
		citationDesc.style.marginBottom = '1em';

		new Setting(containerEl)
			.setName('Enable citation preview')
			.setDesc('Show tooltips with bibliographic information when hovering over citations')
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.citations.enabled).onChange(async (value) => {
					this.plugin.settings.citations.enabled = value;
					await this.plugin.saveSettings();
					this.plugin.updateEditorExtension();
				}),
			);

		new Setting(containerEl)
			.setName('Show hover tooltips')
			.setDesc('Display citation details on hover')
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.citations.showTooltip).onChange(async (value) => {
					this.plugin.settings.citations.showTooltip = value;
					await this.plugin.saveSettings();
					this.plugin.updateEditorExtension();
				}),
			);

		new Setting(containerEl)
			.setName('Citation style')
			.setDesc('Format for displaying citations')
			.addDropdown((dropdown) => {
				const styles = this.plugin.citationFormatter.getAvailableStyles();
				styles.forEach((style) => {
					dropdown.addOption(style, style);
				});
				dropdown.setValue(this.plugin.settings.citations.citationStyle).onChange(async (value) => {
					this.plugin.settings.citations.citationStyle = value;
					this.plugin.citationFormatter.setActiveStyle(value);
					await this.plugin.saveSettings();
				});
			});

		new Setting(containerEl)
			.setName('Show visual indicators')
			.setDesc('Display colored indicators for citation status (valid, invalid, missing fields)')
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.citations.showVisualIndicators).onChange(async (value) => {
					this.plugin.settings.citations.showVisualIndicators = value;
					await this.plugin.saveSettings();
				}),
			);

		new Setting(containerEl)
			.setName('Cache timeout')
			.setDesc('How long to cache bibliography files (minutes, 1-60)')
			.addSlider((slider) =>
				slider
					.setLimits(1, 60, 1)
					.setValue(this.plugin.settings.citations.cacheTimeout)
					.setDynamicTooltip()
					.onChange(async (value) => {
						this.plugin.settings.citations.cacheTimeout = value;
						await this.plugin.saveSettings();
					}),
			);

		// Bibliography paths
		containerEl.createEl('h4', { text: 'Bibliography Paths' });

		const pathsDesc = containerEl.createEl('p', {
			text: 'Additional .bib file paths to search. The plugin automatically searches the current folder and checks YAML frontmatter.',
		});
		pathsDesc.style.color = 'var(--text-muted)';
		pathsDesc.style.fontSize = '0.9em';
		pathsDesc.style.marginBottom = '0.5em';

		this.plugin.settings.citations.bibliographyPaths.forEach((path, index) => {
			const setting = new Setting(containerEl)
				.addText((text) => {
					text
						.setPlaceholder('path/to/bibliography.bib')
						.setValue(path)
						.onChange(async (newPath) => {
							this.plugin.settings.citations.bibliographyPaths[index] = newPath;
							await this.plugin.saveSettings();
							this.plugin.bibliographyManager.invalidateCache();
						});
					text.inputEl.style.width = '100%';
				})
				.addExtraButton((button) => {
					button
						.setIcon('trash')
						.setTooltip('Remove')
						.onClick(async () => {
							this.plugin.settings.citations.bibliographyPaths.splice(index, 1);
							await this.plugin.saveSettings();
							this.plugin.bibliographyManager.invalidateCache();
							this.display();
						});
				});
			setting.infoEl.remove();
		});

		new Setting(containerEl).addButton((button) => {
			button
				.setButtonText('Add bibliography path')
				.setCta()
				.onClick(async () => {
					this.plugin.settings.citations.bibliographyPaths.push('');
					await this.plugin.saveSettings();
					this.display();
				});
		});

		new Setting(containerEl)
			.setName('Reload bibliography')
			.setDesc('Manually reload bibliography files for the active document')
			.addButton((button) => {
				button.setButtonText('Reload').onClick(async () => {
					this.plugin.bibliographyManager.invalidateCache();
					const activeFile = this.plugin.app.workspace.getActiveFile();
					if (activeFile) {
						const bibPaths = await this.plugin.bibliographyManager.discoverBibliography(activeFile);
						await this.plugin.bibliographyManager.loadBibliography(bibPaths);
						const stats = this.plugin.bibliographyManager.getStats();
						alert(`Bibliography reloaded:\n${stats.totalEntries} entries from ${stats.filesLoaded} files`);
					}
				});
			});

		// Enhanced Bibliography
		containerEl.createEl('h3', { text: 'Enhanced Bibliography' });

		const enhancedBibDesc = containerEl.createEl('p', {
			text: 'Advanced citation management: import from DOI/arXiv/PubMed, detect duplicates, and get smart suggestions.',
		});
		enhancedBibDesc.style.color = 'var(--text-muted)';
		enhancedBibDesc.style.marginBottom = '1em';

		new Setting(containerEl)
			.setName('Enable Enhanced Bibliography')
			.setDesc('Enable advanced citation import and management features')
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.enhancedBib?.enabled ?? true).onChange(async (value) => {
					if (!this.plugin.settings.enhancedBib) {
						this.plugin.settings.enhancedBib = {
							enabled: value,
							enableAutoImport: true,
							preferredFormat: 'bibtex',
							apiConfig: { rateLimitDelay: 1000 },
							enableDuplicateDetection: true,
							duplicateSimilarityThreshold: 0.8,
							autoMergeDuplicates: false,
							enableSmartSuggestions: true,
							suggestionContextWindow: 500,
							maxSuggestions: 10,
							trackCitationUsage: true,
							showAnalytics: false,
						};
					} else {
						this.plugin.settings.enhancedBib.enabled = value;
					}
					await this.plugin.saveSettings();
				}),
			);

		// Citation Import
		containerEl.createEl('h4', { text: 'Citation Import', cls: 'setting-item-heading' });

		new Setting(containerEl)
			.setName('Enable Auto-Import')
			.setDesc('Import citations from DOI, arXiv, and PubMed')
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.enhancedBib?.enableAutoImport ?? true).onChange(async (value) => {
					if (this.plugin.settings.enhancedBib) {
						this.plugin.settings.enhancedBib.enableAutoImport = value;
						await this.plugin.saveSettings();
					}
				}),
			);

		new Setting(containerEl)
			.setName('CrossRef Email (Optional)')
			.setDesc('Email for polite API usage (recommended by CrossRef)')
			.addText((text) =>
				text
					.setPlaceholder('your@email.com')
					.setValue(this.plugin.settings.enhancedBib?.apiConfig?.crossrefEmail || '')
					.onChange(async (value) => {
						if (this.plugin.settings.enhancedBib) {
							this.plugin.settings.enhancedBib.apiConfig.crossrefEmail = value || undefined;
							await this.plugin.saveSettings();
						}
					}),
			);

		new Setting(containerEl)
			.setName('Import Citation')
			.setDesc('Import a citation from DOI, arXiv ID, or PubMed ID')
			.addButton((button) => {
				button.setButtonText('Import...').onClick(() => {
					const dialog = new (require('./citations/CitationImportDialog').CitationImportDialog)(
						this.app,
						this.plugin,
						async (result: any) => {
							if (result.success && result.entry) {
								this.plugin.bibliographyManager.addEntry(result.entry.key, result.entry);
								const bibFile = this.plugin.settings.citations.bibliographyFile;
								if (bibFile) {
									await this.plugin.bibliographyManager.saveToBibFile(bibFile);
								}
							}
						},
					);
					dialog.open();
				});
			});

		// Duplicate Detection
		containerEl.createEl('h4', { text: 'Duplicate Detection', cls: 'setting-item-heading' });

		new Setting(containerEl)
			.setName('Enable Duplicate Detection')
			.setDesc('Automatically find duplicate citations in your bibliography')
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.enhancedBib?.enableDuplicateDetection ?? true).onChange(async (value) => {
					if (this.plugin.settings.enhancedBib) {
						this.plugin.settings.enhancedBib.enableDuplicateDetection = value;
						await this.plugin.saveSettings();
					}
				}),
			);

		new Setting(containerEl)
			.setName('Similarity Threshold')
			.setDesc('How similar entries must be to be considered duplicates (0.5-1.0)')
			.addSlider((slider) =>
				slider
					.setLimits(0.5, 1.0, 0.05)
					.setValue(this.plugin.settings.enhancedBib?.duplicateSimilarityThreshold ?? 0.8)
					.setDynamicTooltip()
					.onChange(async (value) => {
						if (this.plugin.settings.enhancedBib) {
							this.plugin.settings.enhancedBib.duplicateSimilarityThreshold = value;
							await this.plugin.saveSettings();
						}
					}),
			);

		new Setting(containerEl)
			.setName('Detect Duplicates')
			.setDesc('Scan your bibliography for duplicate entries')
			.addButton((button) => {
				button.setButtonText('Scan for Duplicates').onClick(async () => {
					const allEntries = this.plugin.bibliographyManager.getAllCitations();
					const threshold = this.plugin.settings.enhancedBib?.duplicateSimilarityThreshold || 0.8;
					const duplicates = this.plugin.duplicateDetector.findDuplicates(allEntries, threshold);

					if (duplicates.length === 0) {
						new (require('obsidian').Notice)('✓ No duplicate citations found');
					} else {
						new (require('obsidian').Notice)(`Found ${duplicates.length} group(s) of duplicates`);
					}
				});
			});

		// Smart Suggestions
		containerEl.createEl('h4', { text: 'Smart Suggestions', cls: 'setting-item-heading' });

		new Setting(containerEl)
			.setName('Enable Smart Suggestions')
			.setDesc('Context-aware citation recommendations while writing')
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.enhancedBib?.enableSmartSuggestions ?? true).onChange(async (value) => {
					if (this.plugin.settings.enhancedBib) {
						this.plugin.settings.enhancedBib.enableSmartSuggestions = value;
						await this.plugin.saveSettings();
					}
				}),
			);

		new Setting(containerEl)
			.setName('Max Suggestions')
			.setDesc('Maximum number of citation suggestions to show')
			.addSlider((slider) =>
				slider
					.setLimits(5, 20, 1)
					.setValue(this.plugin.settings.enhancedBib?.maxSuggestions ?? 10)
					.setDynamicTooltip()
					.onChange(async (value) => {
						if (this.plugin.settings.enhancedBib) {
							this.plugin.settings.enhancedBib.maxSuggestions = value;
							await this.plugin.saveSettings();
						}
					}),
			);

		// Cross-Reference Intelligence Settings
		containerEl.createEl('h3', { text: 'Cross-Reference Intelligence' });

		const crossRefDesc = containerEl.createEl('p', {
			text: 'Manage LaTeX cross-references (\\label{} and \\ref{}) with auto-completion, validation, and browsing.',
		});
		crossRefDesc.style.color = 'var(--text-muted)';
		crossRefDesc.style.marginBottom = '1em';

		new Setting(containerEl)
			.setName('Enable Cross-Reference Intelligence')
			.setDesc('Master toggle for label indexing and reference features')
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.crossRef.enabled).onChange(async (value) => {
					this.plugin.settings.crossRef.enabled = value;
					await this.plugin.saveSettings();
					this.plugin.updateEditorExtension();
				}),
			);

		new Setting(containerEl)
			.setName('Enable Auto-Completion')
			.setDesc('Show auto-complete suggestions when typing \\ref{}, \\eqref{}, etc.')
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.crossRef.autoComplete).onChange(async (value) => {
					this.plugin.settings.crossRef.autoComplete = value;
					await this.plugin.saveSettings();
					this.plugin.updateEditorExtension();
				}),
			);

		new Setting(containerEl)
			.setName('Show Label Browser on Startup')
			.setDesc('Automatically open the Label Browser sidebar panel when Obsidian starts')
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.crossRef.showLabelBrowser).onChange(async (value) => {
					this.plugin.settings.crossRef.showLabelBrowser = value;
					await this.plugin.saveSettings();
				}),
			);

		new Setting(containerEl)
			.setName('Validate References on Save')
			.setDesc('Automatically check for undefined references when saving a file')
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.crossRef.validateOnSave).onChange(async (value) => {
					this.plugin.settings.crossRef.validateOnSave = value;
					await this.plugin.saveSettings();
				}),
			);

		new Setting(containerEl)
			.setName('Index Labels on Startup')
			.setDesc('Automatically index all labels in the vault when Obsidian starts')
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.crossRef.indexOnStartup).onChange(async (value) => {
					this.plugin.settings.crossRef.indexOnStartup = value;
					await this.plugin.saveSettings();
				}),
			);

		new Setting(containerEl)
			.setName('Open Label Browser')
			.setDesc('Browse all labels in your vault, grouped by file and type')
			.addButton((button) => {
				button.setButtonText('Open Browser').onClick(async () => {
					await this.plugin.activateLabelBrowser();
				});
			});

		new Setting(containerEl)
			.setName('Index All Labels')
			.setDesc('Manually scan all markdown files in the vault for \\label{} commands')
			.addButton((button) => {
				button.setButtonText('Index Now').onClick(async () => {
					await this.plugin.crossRefManager.indexVault();
					const stats = this.plugin.crossRefManager.getStats();
					alert(`Indexing complete:\n${stats.totalLabels} labels from ${stats.filesIndexed} files`);
				});
			});

		new Setting(containerEl)
			.setName('Validate All References')
			.setDesc('Check for undefined references, duplicate labels, and orphaned labels')
			.addButton((button) => {
				button.setButtonText('Validate').onClick(async () => {
					const issues = this.plugin.crossRefManager.validateReferences();
					if (issues.length === 0) {
						alert('✓ All references are valid!\n\nNo issues found.');
					} else {
						const errors = issues.filter((i) => i.severity === 'error');
						const warnings = issues.filter((i) => i.severity === 'warning');

						let message = `Found ${errors.length} errors and ${warnings.length} warnings:\n\n`;

						// Show first 5 errors
						if (errors.length > 0) {
							message += 'ERRORS:\n';
							errors.slice(0, 5).forEach((issue) => {
								message += `• ${issue.message}\n`;
							});
							if (errors.length > 5) {
								message += `... and ${errors.length - 5} more errors\n`;
							}
							message += '\n';
						}

						// Show first 5 warnings
						if (warnings.length > 0) {
							message += 'WARNINGS:\n';
							warnings.slice(0, 5).forEach((issue) => {
								message += `• ${issue.message}\n`;
							});
							if (warnings.length > 5) {
								message += `... and ${warnings.length - 5} more warnings\n`;
							}
						}

						message += '\nSee console for full details.';
						console.log('Cross-reference validation issues:', issues);
						alert(message);
					}
				});
			});

		// Manuscript Navigator Settings
		containerEl.createEl('h3', { text: 'Manuscript Navigator' });

		const manuscriptDesc = containerEl.createEl('p', {
			text: 'Manage your book project with a hierarchical view of chapters and parts. Requires a book.json configuration file.',
		});
		manuscriptDesc.style.color = 'var(--text-muted)';
		manuscriptDesc.style.marginBottom = '1em';

		new Setting(containerEl)
			.setName('Enable Manuscript Navigator')
			.setDesc('Master toggle for the manuscript project navigator')
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.manuscriptNavigator.enabled).onChange(async (value) => {
					this.plugin.settings.manuscriptNavigator.enabled = value;
					await this.plugin.saveSettings();
				}),
			);

		new Setting(containerEl)
			.setName('Show Navigator on Startup')
			.setDesc('Automatically open the Manuscript Navigator sidebar when Obsidian starts')
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.manuscriptNavigator.showInSidebar).onChange(async (value) => {
					this.plugin.settings.manuscriptNavigator.showInSidebar = value;
					await this.plugin.saveSettings();
				}),
			);

		new Setting(containerEl)
			.setName('Configuration File Path')
			.setDesc('Path to your book.json file (relative to vault root)')
			.addText((text) =>
				text
					.setPlaceholder('book.json')
					.setValue(this.plugin.settings.manuscriptNavigator.configFile)
					.onChange(async (value) => {
						this.plugin.settings.manuscriptNavigator.configFile = value || 'book.json';
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName('Show Word Counts')
			.setDesc('Display word count next to each chapter in the navigator')
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.manuscriptNavigator.showWordCount).onChange(async (value) => {
					this.plugin.settings.manuscriptNavigator.showWordCount = value;
					await this.plugin.saveSettings();
				}),
			);

		new Setting(containerEl)
			.setName('Show Figure Counts')
			.setDesc('Display figure count next to each chapter')
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.manuscriptNavigator.showFigureCount).onChange(async (value) => {
					this.plugin.settings.manuscriptNavigator.showFigureCount = value;
					await this.plugin.saveSettings();
				}),
			);

		new Setting(containerEl)
			.setName('Show Citation Counts')
			.setDesc('Display citation count next to each chapter')
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.manuscriptNavigator.showCitationCount).onChange(async (value) => {
					this.plugin.settings.manuscriptNavigator.showCitationCount = value;
					await this.plugin.saveSettings();
				}),
			);

		new Setting(containerEl)
			.setName('Auto-Refresh Statistics')
			.setDesc('Automatically recalculate chapter statistics when files are modified')
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.manuscriptNavigator.autoRefreshStats).onChange(async (value) => {
					this.plugin.settings.manuscriptNavigator.autoRefreshStats = value;
					await this.plugin.saveSettings();
				}),
			);

		new Setting(containerEl)
			.setName('Expand Parts on Load')
			.setDesc('Automatically expand all parts when opening the navigator')
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.manuscriptNavigator.expandPartsOnLoad).onChange(async (value) => {
					this.plugin.settings.manuscriptNavigator.expandPartsOnLoad = value;
					await this.plugin.saveSettings();
				}),
			);

		new Setting(containerEl)
			.setName('Default Chapter Word Goal')
			.setDesc('Target word count for each chapter (0 to disable)')
			.addText((text) =>
				text
					.setPlaceholder('5000')
					.setValue(String(this.plugin.settings.manuscriptNavigator.defaultChapterWordGoal))
					.onChange(async (value) => {
						const num = parseInt(value);
						if (!isNaN(num) && num >= 0) {
							this.plugin.settings.manuscriptNavigator.defaultChapterWordGoal = num;
							await this.plugin.saveSettings();
						}
					}),
			);

		new Setting(containerEl)
			.setName('Total Manuscript Word Goal')
			.setDesc('Target word count for the entire manuscript (0 to disable)')
			.addText((text) =>
				text
					.setPlaceholder('80000')
					.setValue(String(this.plugin.settings.manuscriptNavigator.totalWordGoal))
					.onChange(async (value) => {
						const num = parseInt(value);
						if (!isNaN(num) && num >= 0) {
							this.plugin.settings.manuscriptNavigator.totalWordGoal = num;
							await this.plugin.saveSettings();
						}
					}),
			);

		new Setting(containerEl)
			.setName('Open Navigator')
			.setDesc('Open the Manuscript Navigator sidebar')
			.addButton((button) => {
				button.setButtonText('Open Navigator').onClick(async () => {
					await this.plugin.activateManuscriptNavigator();
				});
			});

		// Pre-publication Validation
		containerEl.createEl('h3', { text: 'Pre-publication Validation' });

		const validationDesc = containerEl.createEl('p', {
			text: 'Comprehensive manuscript validation to catch errors before publication. Checks references, citations, figures, tables, equations, and document structure.',
		});
		validationDesc.style.color = 'var(--text-muted)';
		validationDesc.style.marginBottom = '1em';

		new Setting(containerEl)
			.setName('Enable Validation')
			.setDesc('Enable the pre-publication checklist feature')
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.validation.enabled).onChange(async (value) => {
					this.plugin.settings.validation.enabled = value;
					await this.plugin.saveSettings();
				}),
			);

		new Setting(containerEl)
			.setName('Auto-Validate on Save')
			.setDesc('Automatically run validation when saving files')
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.validation.autoValidateOnSave).onChange(async (value) => {
					this.plugin.settings.validation.autoValidateOnSave = value;
					await this.plugin.saveSettings();
				}),
			);

		// Validation Rules
		containerEl.createEl('h4', { text: 'Validation Rules', cls: 'setting-item-heading' });

		new Setting(containerEl)
			.setName('Validate References')
			.setDesc('Check for undefined references and duplicate labels')
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.validation.validateReferences).onChange(async (value) => {
					this.plugin.settings.validation.validateReferences = value;
					await this.plugin.saveSettings();
				}),
			);

		new Setting(containerEl)
			.setName('Validate Citations')
			.setDesc('Check for missing bibliography entries and orphaned citations')
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.validation.validateCitations).onChange(async (value) => {
					this.plugin.settings.validation.validateCitations = value;
					await this.plugin.saveSettings();
				}),
			);

		new Setting(containerEl)
			.setName('Validate Figures')
			.setDesc('Check figure labels, captions, and numbering consistency')
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.validation.validateFigures).onChange(async (value) => {
					this.plugin.settings.validation.validateFigures = value;
					await this.plugin.saveSettings();
				}),
			);

		new Setting(containerEl)
			.setName('Validate Tables')
			.setDesc('Check table labels, captions, and numbering consistency')
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.validation.validateTables).onChange(async (value) => {
					this.plugin.settings.validation.validateTables = value;
					await this.plugin.saveSettings();
				}),
			);

		new Setting(containerEl)
			.setName('Validate Equations')
			.setDesc('Check equation labels and numbering consistency')
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.validation.validateEquations).onChange(async (value) => {
					this.plugin.settings.validation.validateEquations = value;
					await this.plugin.saveSettings();
				}),
			);

		new Setting(containerEl)
			.setName('Validate Structure')
			.setDesc('Check document structure, heading levels, and empty sections')
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.validation.validateStructure).onChange(async (value) => {
					this.plugin.settings.validation.validateStructure = value;
					await this.plugin.saveSettings();
				}),
			);

		// Display Options
		containerEl.createEl('h4', { text: 'Display Options', cls: 'setting-item-heading' });

		new Setting(containerEl)
			.setName('Group by Category')
			.setDesc('Group validation issues by category instead of listing them sequentially')
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.validation.groupByCategory).onChange(async (value) => {
					this.plugin.settings.validation.groupByCategory = value;
					await this.plugin.saveSettings();
				}),
			);

		new Setting(containerEl)
			.setName('Hide Info-Level Issues')
			.setDesc('Hide informational messages (only show warnings and errors)')
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.validation.hideInfoLevel).onChange(async (value) => {
					this.plugin.settings.validation.hideInfoLevel = value;
					await this.plugin.saveSettings();
				}),
			);

		new Setting(containerEl)
			.setName('Show Only Errors')
			.setDesc('Show only critical and error-level issues (hide warnings and info)')
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.validation.showOnlyErrors).onChange(async (value) => {
					this.plugin.settings.validation.showOnlyErrors = value;
					await this.plugin.saveSettings();
				}),
			);

		new Setting(containerEl)
			.setName('Open Validation Panel')
			.setDesc('Open the Pre-publication Checklist sidebar')
			.addButton((button) => {
				button.setButtonText('Open Checklist').onClick(async () => {
					await this.plugin.activateValidationPanel();
				});
			});

		// Export & Publishing
		containerEl.createEl('h3', { text: 'Export & Publishing' });

		const exportDesc = containerEl.createEl('p', {
			text: 'Export your manuscript to PDF, DOCX, HTML, EPUB, and more using Pandoc. Requires Pandoc to be installed.',
		});
		exportDesc.style.color = 'var(--text-muted)';
		exportDesc.style.marginBottom = '1em';

		new Setting(containerEl)
			.setName('Enable Export')
			.setDesc('Enable manuscript export functionality')
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.export?.enabled ?? true).onChange(async (value) => {
					if (!this.plugin.settings.export) {
						this.plugin.settings.export = {
							enabled: value,
							openAfterExport: true,
							maxConcurrentExports: 3,
							keepIntermediateFiles: false,
							verboseLogging: false,
							profiles: [],
						};
					} else {
						this.plugin.settings.export.enabled = value;
					}
					await this.plugin.saveSettings();
				}),
			);

		new Setting(containerEl)
			.setName('Pandoc Path')
			.setDesc('Path to Pandoc executable (leave empty for auto-detection)')
			.addText((text) =>
				text
					.setPlaceholder('/usr/local/bin/pandoc')
					.setValue(this.plugin.settings.export?.pandocPath || '')
					.onChange(async (value) => {
						if (this.plugin.settings.export) {
							this.plugin.settings.export.pandocPath = value || undefined;
							await this.plugin.saveSettings();
						}
					}),
			);

		new Setting(containerEl)
			.setName('Default Output Directory')
			.setDesc('Default directory for exported files (leave empty to use vault root)')
			.addText((text) =>
				text
					.setPlaceholder('/path/to/exports')
					.setValue(this.plugin.settings.export?.defaultOutputDir || '')
					.onChange(async (value) => {
						if (this.plugin.settings.export) {
							this.plugin.settings.export.defaultOutputDir = value || undefined;
							await this.plugin.saveSettings();
						}
					}),
			);

		new Setting(containerEl)
			.setName('Open After Export')
			.setDesc('Automatically open exported files in default application')
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.export?.openAfterExport ?? true).onChange(async (value) => {
					if (this.plugin.settings.export) {
						this.plugin.settings.export.openAfterExport = value;
						await this.plugin.saveSettings();
					}
				}),
			);

		new Setting(containerEl)
			.setName('Verbose Logging')
			.setDesc('Log detailed export information to console (for debugging)')
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.export?.verboseLogging ?? false).onChange(async (value) => {
					if (this.plugin.settings.export) {
						this.plugin.settings.export.verboseLogging = value;
						await this.plugin.saveSettings();
					}
				}),
			);

		// Export profiles
		containerEl.createEl('h4', { text: 'Export Profiles', cls: 'setting-item-heading' });

		const profilesDesc = containerEl.createEl('p', {
			text: 'Choose your default export profile. Use commands to access all profiles.',
		});
		profilesDesc.style.color = 'var(--text-muted)';
		profilesDesc.style.fontSize = '0.9em';
		profilesDesc.style.marginBottom = '0.5em';

		new Setting(containerEl)
			.setName('Default Profile')
			.setDesc('Profile used for quick exports')
			.addDropdown((dropdown) => {
				const profiles = this.plugin.exportManager.getProfiles();
				for (const profile of profiles) {
					dropdown.addOption(profile.id, profile.name);
				}
				dropdown.setValue(this.plugin.settings.export?.defaultProfileId || 'pdf-academic');
				dropdown.onChange(async (value) => {
					if (this.plugin.settings.export) {
						this.plugin.settings.export.defaultProfileId = value;
						await this.plugin.saveSettings();
					}
				});
			});

		// Quick export buttons
		const exportButtons = containerEl.createDiv({ cls: 'export-quick-buttons' });
		exportButtons.style.display = 'flex';
		exportButtons.style.gap = '0.5rem';
		exportButtons.style.marginTop = '1rem';

		const pdfBtn = exportButtons.createEl('button', { text: 'Export to PDF' });
		pdfBtn.addEventListener('click', async () => {
			await this.plugin.exportManager.exportCurrentFile('pdf-academic');
		});

		const docxBtn = exportButtons.createEl('button', { text: 'Export to DOCX' });
		docxBtn.addEventListener('click', async () => {
			await this.plugin.exportManager.exportCurrentFile('docx-standard');
		});

		const htmlBtn = exportButtons.createEl('button', { text: 'Export to HTML' });
		htmlBtn.addEventListener('click', async () => {
			await this.plugin.exportManager.exportCurrentFile('html-web');
		});

		// Template & Snippet System Settings
		containerEl.createEl('h3', { text: 'Templates & Snippets' });

		const templateDesc = containerEl.createEl('p', {
			text: 'Reusable document templates and content snippets for faster writing. Includes built-in templates for academic papers, chapters, figures, tables, equations, and more.',
		});
		templateDesc.style.color = 'var(--text-muted)';
		templateDesc.style.marginBottom = '1em';

		new Setting(containerEl)
			.setName('Enable Templates & Snippets')
			.setDesc('Master toggle for template and snippet system')
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.templates?.enabled ?? true).onChange(async (value) => {
					if (!this.plugin.settings.templates) {
						this.plugin.settings.templates = {
							enabled: value,
							customTemplatesPath: '.templates',
							customSnippetsPath: '.snippets',
							enableTriggers: true,
							showTemplateInserter: true,
							enableVariableHints: true,
						};
					} else {
						this.plugin.settings.templates.enabled = value;
					}
					await this.plugin.saveSettings();

					// Re-initialize managers if enabled
					if (value) {
						await this.plugin.templateManager.initialize();
						await this.plugin.snippetManager.initialize();
					}
				}),
			);

		new Setting(containerEl)
			.setName('Custom Templates Path')
			.setDesc('Vault path for custom template files (default: .templates)')
			.addText((text) =>
				text
					.setPlaceholder('.templates')
					.setValue(this.plugin.settings.templates?.customTemplatesPath ?? '.templates')
					.onChange(async (value) => {
						if (this.plugin.settings.templates) {
							this.plugin.settings.templates.customTemplatesPath = value;
							await this.plugin.saveSettings();
						}
					}),
			);

		new Setting(containerEl)
			.setName('Custom Snippets Path')
			.setDesc('Vault path for custom snippet files (default: .snippets)')
			.addText((text) =>
				text
					.setPlaceholder('.snippets')
					.setValue(this.plugin.settings.templates?.customSnippetsPath ?? '.snippets')
					.onChange(async (value) => {
						if (this.plugin.settings.templates) {
							this.plugin.settings.templates.customSnippetsPath = value;
							await this.plugin.saveSettings();
						}
					}),
			);

		new Setting(containerEl)
			.setName('Enable Text Triggers')
			.setDesc('Allow snippets to be triggered by typing their trigger text (e.g., "fig" expands to figure snippet)')
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.templates?.enableTriggers ?? true).onChange(async (value) => {
					if (this.plugin.settings.templates) {
						this.plugin.settings.templates.enableTriggers = value;
						await this.plugin.saveSettings();
					}
				}),
			);

		new Setting(containerEl)
			.setName('Show Template Inserter')
			.setDesc('Show template/snippet inserter in command palette')
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.templates?.showTemplateInserter ?? true).onChange(async (value) => {
					if (this.plugin.settings.templates) {
						this.plugin.settings.templates.showTemplateInserter = value;
						await this.plugin.saveSettings();
					}
				}),
			);

		new Setting(containerEl)
			.setName('Enable Variable Hints')
			.setDesc('Show helpful hints when filling in template variables')
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.templates?.enableVariableHints ?? true).onChange(async (value) => {
					if (this.plugin.settings.templates) {
						this.plugin.settings.templates.enableVariableHints = value;
						await this.plugin.saveSettings();
					}
				}),
			);

		// Quick template/snippet buttons
		const templateButtons = containerEl.createDiv('template-quick-buttons');
		templateButtons.style.display = 'flex';
		templateButtons.style.gap = '0.5rem';
		templateButtons.style.marginTop = '1rem';
		templateButtons.style.marginBottom = '2rem';

		const templateListBtn = templateButtons.createEl('button', { text: 'Browse Templates' });
		templateListBtn.addEventListener('click', () => {
			const templates = this.plugin.templateManager.getAllTemplates();
			const selector = new (require('./templates/TemplateDialog').TemplateSelectorModal)(
				this.app,
				templates,
				(template: any) => {
					const variableDialog = new (require('./templates/TemplateDialog').TemplateVariableModal)(
						this.app,
						template,
						async (values: any) => {
							await this.plugin.templateManager.insertTemplate({
								template,
								variableValues: values,
								insertAtCursor: true,
							});
						},
					);
					variableDialog.open();
				},
			);
			selector.open();
		});

		const snippetListBtn = templateButtons.createEl('button', { text: 'Browse Snippets' });
		snippetListBtn.addEventListener('click', () => {
			const snippets = this.plugin.snippetManager.getAllSnippets();
			const selector = new (require('./templates/TemplateDialog').SnippetSelectorModal)(
				this.app,
				snippets,
				(snippet: any) => {
					const variableDialog = new (require('./templates/TemplateDialog').TemplateVariableModal)(
						this.app,
						snippet,
						async (values: any) => {
							await this.plugin.snippetManager.insertSnippet({
								snippet,
								variableValues: values,
								insertAtCursor: true,
							});
						},
					);
					variableDialog.open();
				},
			);
			selector.open();
		});

		const figureBtn = templateButtons.createEl('button', { text: 'Insert Figure' });
		figureBtn.addEventListener('click', () => {
			const snippet = this.plugin.snippetManager.getSnippet('figure-latex');
			if (snippet) {
				const variableDialog = new (require('./templates/TemplateDialog').TemplateVariableModal)(
					this.app,
					snippet,
					async (values: any) => {
						await this.plugin.snippetManager.insertSnippet({
							snippet,
							variableValues: values,
							insertAtCursor: true,
						});
					},
				);
				variableDialog.open();
			}
		});

		const tableBtn = templateButtons.createEl('button', { text: 'Insert Table' });
		tableBtn.addEventListener('click', () => {
			const snippet = this.plugin.snippetManager.getSnippet('table-basic');
			if (snippet) {
				const variableDialog = new (require('./templates/TemplateDialog').TemplateVariableModal)(
					this.app,
					snippet,
					async (values: any) => {
						await this.plugin.snippetManager.insertSnippet({
							snippet,
							variableValues: values,
							insertAtCursor: true,
						});
					},
				);
				variableDialog.open();
			}
		});

		const equationBtn = templateButtons.createEl('button', { text: 'Insert Equation' });
		equationBtn.addEventListener('click', () => {
			const snippet = this.plugin.snippetManager.getSnippet('equation-display');
			if (snippet) {
				const variableDialog = new (require('./templates/TemplateDialog').TemplateVariableModal)(
					this.app,
					snippet,
					async (values: any) => {
						await this.plugin.snippetManager.insertSnippet({
							snippet,
							variableValues: values,
							insertAtCursor: true,
						});
					},
				);
				variableDialog.open();
			}
		});

		// Advanced Settings
		containerEl.createEl('h3', { text: 'Advanced' });

		new Setting(containerEl)
			.setName('Debug mode')
			.setDesc('Enable console logging for troubleshooting (check developer console)')
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.debugMode).onChange(async (value) => {
					this.plugin.settings.debugMode = value;
					await this.plugin.saveSettings();
				}),
			);

		new Setting(containerEl)
			.setName('Viewport buffer')
			.setDesc('Number of lines to process beyond visible viewport (higher = smoother scrolling, more memory)')
			.addSlider((slider) =>
				slider
					.setLimits(100, 1000, 100)
					.setValue(this.plugin.settings.performance.viewportBuffer)
					.setDynamicTooltip()
					.onChange(async (value) => {
						this.plugin.settings.performance.viewportBuffer = value;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName('Update debounce delay')
			.setDesc('Delay after typing before applying patterns (milliseconds, 0-500)')
			.addSlider((slider) =>
				slider
					.setLimits(0, 500, 50)
					.setValue(this.plugin.settings.performance.debounceDelay)
					.setDynamicTooltip()
					.onChange(async (value) => {
						this.plugin.settings.performance.debounceDelay = value;
						await this.plugin.saveSettings();
					}),
			);

		// Custom Patterns
		containerEl.createEl('h3', { text: 'Custom Patterns' });

		const customDesc = containerEl.createEl('p', {
			text: 'Add your own regex patterns for additional concealment. Each pattern should be a valid JavaScript regex string.',
		});
		customDesc.style.color = 'var(--text-muted)';
		customDesc.style.marginBottom = '1em';

		this.plugin.settings.customPatterns.forEach((pattern, index) => {
			const setting = new Setting(containerEl)
				.addText((text) => {
					text
						.setPlaceholder('e.g., \\\\todo\\{([^}]+)\\}')
						.setValue(pattern)
						.onChange(async (newPattern) => {
							this.plugin.settings.customPatterns[index] = newPattern;
							await this.plugin.saveSettings();
							this.plugin.updateEditorExtension();
						});
					text.inputEl.style.width = '100%';
				})
				.addExtraButton((button) => {
					button
						.setIcon('trash')
						.setTooltip('Delete')
						.onClick(async () => {
							this.plugin.settings.customPatterns.splice(index, 1);
							await this.plugin.saveSettings();
							this.plugin.updateEditorExtension();
							this.display();
						});
				});
			setting.infoEl.remove();
		});

		new Setting(containerEl).addButton((button) => {
			button
				.setButtonText('Add custom pattern')
				.setCta()
				.onClick(async () => {
					this.plugin.settings.customPatterns.push('');
					await this.plugin.saveSettings();
					this.display();
				});
		});

		// Reset to Defaults
		containerEl.createEl('h3', { text: 'Reset' });

		new Setting(containerEl)
			.setName('Reset to defaults')
			.setDesc('Reset all settings to their default values')
			.addButton((button) => {
				button
					.setButtonText('Reset')
					.setWarning()
					.onClick(async () => {
						// Confirm with user
						const confirmed = confirm(
							'Are you sure you want to reset all settings to defaults? This cannot be undone.',
						);
						if (confirmed) {
							// Reset to defaults by clearing data
							await this.plugin.saveData({});
							await this.plugin.loadSettings();
							this.plugin.updateEditorExtension();
							this.display();
						}
					});
			});

		// Footer with credits
		const footer = containerEl.createEl('div', {
			cls: 'manuscript-pro-footer',
		});
		footer.style.marginTop = '2em';
		footer.style.paddingTop = '1em';
		footer.style.borderTop = '1px solid var(--background-modifier-border)';
		footer.style.color = 'var(--text-muted)';
		footer.style.fontSize = '0.9em';

		footer.createEl('p', {
			text: 'Manuscript Pro is based on Dynamic Text Concealer by Matt Cole Anderson.',
		});

		const links = footer.createEl('p');
		links.innerHTML =
			'For help, see the <a href="https://github.com/yourusername/obsidian-manuscript-pro#readme">README</a> or report issues on <a href="https://github.com/yourusername/obsidian-manuscript-pro/issues">GitHub</a>.';
	}
}
