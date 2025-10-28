/**
 * Front Matter Generator Modal
 * Comprehensive 5-tab interface for creating professional manuscript front matter
 * (title pages, copyright, dedication, etc. - NOT YAML frontmatter metadata)
 */

import { App, Modal, Setting, Notice, TFile } from 'obsidian';
import type ManuscriptProPlugin from '../main';
import type { FrontMatterData, FrontMatterPreferences, FrontMatterStyle } from './FrontMatterInterfaces';
import { FrontMatterGenerator } from './FrontMatterGenerator';
import { getAllStyleTemplates } from './StyleTemplates';

export class FrontMatterGeneratorModal extends Modal {
	private plugin: ManuscriptProPlugin;
	private data: FrontMatterData;
	private preferences: FrontMatterPreferences;
	private currentTab: 'basic' | 'copyright' | 'frontmatter' | 'backmatter' | 'export' = 'basic';

	constructor(app: App, plugin: ManuscriptProPlugin) {
		super(app);
		this.plugin = plugin;

		// Initialize with defaults
		this.data = {
			title: '',
			author: '',
			copyright: {
				year: new Date().getFullYear(),
				holder: '',
			},
		};

		this.preferences = {
			style: 'classic',
			includeTitlePage: true,
			includeCopyrightPage: true,
			includeDedication: false,
			includeEpigraph: false,
			includeForeword: false,
			includePreface: false,
			includeAcknowledgments: false,
			includeAboutAuthor: false,
			includeAlsoBy: false,
			exportAsFiles: true,
			exportFormat: 'markdown',
			useRomanNumeralsForFrontMatter: true,
			startChapterNumberingAfterIntro: true,
		};
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass('frontmatter-generator-modal');

		// Header
		contentEl.createEl('h2', { text: 'Front Matter Generator' });
		contentEl.createEl('p', {
			text: 'Create professional front matter for your manuscript with multiple style templates.',
			cls: 'frontmatter-generator-description',
		});

		// Tab navigation
		const tabNav = contentEl.createDiv({ cls: 'frontmatter-generator-tabs' });
		this.renderTabButtons(tabNav);

		// Tab content
		const tabContent = contentEl.createDiv({ cls: 'frontmatter-generator-tab-content' });
		this.renderCurrentTab(tabContent);

		// Footer with action buttons
		const footer = contentEl.createDiv({ cls: 'frontmatter-generator-footer' });
		this.renderFooter(footer);
	}

	private renderTabButtons(container: HTMLElement) {
		const tabs = [
			{ id: 'basic', label: '📄 Basic Info' },
			{ id: 'copyright', label: '©️ Copyright' },
			{ id: 'frontmatter', label: '📖 Front Matter' },
			{ id: 'backmatter', label: '✍️ Back Matter' },
			{ id: 'export', label: '🎨 Style & Export' },
		];

		tabs.forEach((tab) => {
			const button = container.createEl('button', {
				text: tab.label,
				cls: this.currentTab === tab.id ? 'frontmatter-generator-tab-active' : 'frontmatter-generator-tab',
			});
			button.onclick = () => {
				this.currentTab = tab.id as any;
				this.onOpen(); // Re-render
			};
		});
	}

	private renderCurrentTab(container: HTMLElement) {
		switch (this.currentTab) {
			case 'basic':
				this.renderBasicTab(container);
				break;
			case 'copyright':
				this.renderCopyrightTab(container);
				break;
			case 'frontmatter':
				this.renderFrontMatterTab(container);
				break;
			case 'backmatter':
				this.renderBackMatterTab(container);
				break;
			case 'export':
				this.renderExportTab(container);
				break;
		}
	}

	private renderBasicTab(container: HTMLElement) {
		// Title
		new Setting(container)
			.setName('Title')
			.setDesc('The main title of your work')
			.addText((text) => {
				text.setPlaceholder('The Great Novel')
					.setValue(this.data.title)
					.onChange((value) => {
						this.data.title = value;
					});
				text.inputEl.style.width = '100%';
			});

		// Subtitle
		new Setting(container)
			.setName('Subtitle')
			.setDesc('Optional subtitle')
			.addText((text) => {
				text.setPlaceholder('A Story of Adventure')
					.setValue(this.data.subtitle || '')
					.onChange((value) => {
						this.data.subtitle = value || undefined;
					});
				text.inputEl.style.width = '100%';
			});

		// Author
		new Setting(container)
			.setName('Author')
			.setDesc('Author name')
			.addText((text) => {
				text.setPlaceholder('Jane Doe')
					.setValue(this.data.author)
					.onChange((value) => {
						this.data.author = value;
					});
				text.inputEl.style.width = '100%';
			});

		// Author Credentials
		new Setting(container)
			.setName('Author Credentials')
			.setDesc('Optional credentials (e.g., PhD, MD)')
			.addText((text) => {
				text.setPlaceholder('PhD, MFA')
					.setValue(this.data.authorCredentials || '')
					.onChange((value) => {
						this.data.authorCredentials = value || undefined;
					});
				text.inputEl.style.width = '100%';
			});

		// Publisher
		new Setting(container)
			.setName('Publisher')
			.setDesc('Publishing house name')
			.addText((text) => {
				text.setPlaceholder('Acme Publishing')
					.setValue(this.data.publisher || '')
					.onChange((value) => {
						this.data.publisher = value || undefined;
					});
				text.inputEl.style.width = '100%';
			});

		// Publisher Location
		new Setting(container)
			.setName('Publisher Location')
			.setDesc('City and state/country')
			.addText((text) => {
				text.setPlaceholder('New York, NY')
					.setValue(this.data.publisherLocation || '')
					.onChange((value) => {
						this.data.publisherLocation = value || undefined;
					});
				text.inputEl.style.width = '100%';
			});
	}

	private renderCopyrightTab(container: HTMLElement) {
		// Copyright Year
		new Setting(container)
			.setName('Copyright Year')
			.setDesc('Year of publication')
			.addText((text) => {
				text.setPlaceholder(new Date().getFullYear().toString())
					.setValue(this.data.copyright.year.toString())
					.onChange((value) => {
						const year = parseInt(value);
						if (!isNaN(year)) {
							this.data.copyright.year = year;
						}
					});
				text.inputEl.type = 'number';
			});

		// Copyright Holder
		new Setting(container)
			.setName('Copyright Holder')
			.setDesc('Name of the copyright holder')
			.addText((text) => {
				text.setPlaceholder('Jane Doe')
					.setValue(this.data.copyright.holder)
					.onChange((value) => {
						this.data.copyright.holder = value;
					});
				text.inputEl.style.width = '100%';
			});

		// ISBN
		new Setting(container)
			.setName('ISBN')
			.setDesc('International Standard Book Number (print)')
			.addText((text) => {
				text.setPlaceholder('978-3-16-148410-0')
					.setValue(this.data.copyright.isbn || '')
					.onChange((value) => {
						this.data.copyright.isbn = value || undefined;
					});
				text.inputEl.style.width = '100%';
			});

		// eISBN
		new Setting(container)
			.setName('eISBN')
			.setDesc('Electronic ISBN for ebook version')
			.addText((text) => {
				text.setPlaceholder('978-3-16-148411-7')
					.setValue(this.data.copyright.eisbn || '')
					.onChange((value) => {
						this.data.copyright.eisbn = value || undefined;
					});
				text.inputEl.style.width = '100%';
			});

		// Edition
		new Setting(container)
			.setName('Edition')
			.setDesc('Edition information (e.g., "First Edition")')
			.addText((text) => {
				text.setPlaceholder('First Edition')
					.setValue(this.data.copyright.edition || '')
					.onChange((value) => {
						this.data.copyright.edition = value || undefined;
					});
				text.inputEl.style.width = '100%';
			});

		// Printing Number
		new Setting(container)
			.setName('Printing Number')
			.setDesc('Current printing number')
			.addText((text) => {
				text.setPlaceholder('1')
					.setValue(this.data.copyright.printingNumber?.toString() || '')
					.onChange((value) => {
						const num = parseInt(value);
						this.data.copyright.printingNumber = isNaN(num) ? undefined : num;
					});
				text.inputEl.type = 'number';
			});

		// Additional Notices
		new Setting(container)
			.setName('Additional Notices')
			.setDesc('Additional copyright notices (one per line)')
			.addTextArea((text) => {
				text.setPlaceholder('All rights reserved.\nNo part of this book may be reproduced...')
					.setValue(this.data.copyright.additionalNotices?.join('\n') || '')
					.onChange((value) => {
						this.data.copyright.additionalNotices = value ? value.split('\n').filter((l) => l.trim()) : undefined;
					});
				text.inputEl.rows = 4;
				text.inputEl.style.width = '100%';
			});

		// Disclaimer
		new Setting(container)
			.setName('Disclaimer')
			.setDesc('Legal disclaimer text')
			.addTextArea((text) => {
				text.setPlaceholder('This is a work of fiction. Any resemblance to actual persons...')
					.setValue(this.data.copyright.disclaimer || '')
					.onChange((value) => {
						this.data.copyright.disclaimer = value || undefined;
					});
				text.inputEl.rows = 3;
				text.inputEl.style.width = '100%';
			});
	}

	private renderFrontMatterTab(container: HTMLElement) {
		// Dedication
		new Setting(container)
			.setName('Include Dedication')
			.setDesc('Add a dedication page')
			.addToggle((toggle) => {
				toggle.setValue(this.preferences.includeDedication).onChange((value) => {
					this.preferences.includeDedication = value;
					this.onOpen(); // Re-render to show/hide textarea
				});
			});

		if (this.preferences.includeDedication) {
			new Setting(container).addTextArea((text) => {
				text.setPlaceholder('For my family...')
					.setValue(this.data.dedication || '')
					.onChange((value) => {
						this.data.dedication = value || undefined;
					});
				text.inputEl.rows = 3;
				text.inputEl.style.width = '100%';
			});
		}

		// Epigraph
		new Setting(container)
			.setName('Include Epigraph')
			.setDesc('Add an opening quotation')
			.addToggle((toggle) => {
				toggle.setValue(this.preferences.includeEpigraph).onChange((value) => {
					this.preferences.includeEpigraph = value;
					this.onOpen();
				});
			});

		if (this.preferences.includeEpigraph) {
			if (!this.data.epigraph) {
				this.data.epigraph = { text: '', attribution: '' };
			}

			new Setting(container).setName('Quote Text').addTextArea((text) => {
				text.setPlaceholder('The quote text...')
					.setValue(this.data.epigraph!.text)
					.onChange((value) => {
						this.data.epigraph!.text = value;
					});
				text.inputEl.rows = 3;
				text.inputEl.style.width = '100%';
			});

			new Setting(container).setName('Attribution').addText((text) => {
				text.setPlaceholder('Author Name')
					.setValue(this.data.epigraph!.attribution)
					.onChange((value) => {
						this.data.epigraph!.attribution = value;
					});
				text.inputEl.style.width = '100%';
			});

			new Setting(container).setName('Source (optional)').addText((text) => {
				text.setPlaceholder('Book Title, Year')
					.setValue(this.data.epigraph!.source || '')
					.onChange((value) => {
						this.data.epigraph!.source = value || undefined;
					});
				text.inputEl.style.width = '100%';
			});
		}

		// Foreword
		new Setting(container)
			.setName('Include Foreword')
			.setDesc('Add a foreword (usually written by someone else)')
			.addToggle((toggle) => {
				toggle.setValue(this.preferences.includeForeword).onChange((value) => {
					this.preferences.includeForeword = value;
					this.onOpen();
				});
			});

		if (this.preferences.includeForeword) {
			if (!this.data.foreword) {
				this.data.foreword = { text: '' };
			}

			new Setting(container).setName('Foreword Text').addTextArea((text) => {
				text.setPlaceholder('The foreword content...')
					.setValue(this.data.foreword!.text)
					.onChange((value) => {
						this.data.foreword!.text = value;
					});
				text.inputEl.rows = 5;
				text.inputEl.style.width = '100%';
			});

			new Setting(container).setName('Foreword Author (optional)').addText((text) => {
				text.setPlaceholder('Name of foreword author')
					.setValue(this.data.foreword!.author || '')
					.onChange((value) => {
						this.data.foreword!.author = value || undefined;
					});
				text.inputEl.style.width = '100%';
			});
		}

		// Preface
		new Setting(container)
			.setName('Include Preface')
			.setDesc("Add a preface (author's introduction)")
			.addToggle((toggle) => {
				toggle.setValue(this.preferences.includePreface).onChange((value) => {
					this.preferences.includePreface = value;
					this.onOpen();
				});
			});

		if (this.preferences.includePreface) {
			new Setting(container).addTextArea((text) => {
				text.setPlaceholder('The preface content...')
					.setValue(this.data.preface || '')
					.onChange((value) => {
						this.data.preface = value || undefined;
					});
				text.inputEl.rows = 5;
				text.inputEl.style.width = '100%';
			});
		}

		// Acknowledgments
		new Setting(container)
			.setName('Include Acknowledgments')
			.setDesc('Add acknowledgments section')
			.addToggle((toggle) => {
				toggle.setValue(this.preferences.includeAcknowledgments).onChange((value) => {
					this.preferences.includeAcknowledgments = value;
					this.onOpen();
				});
			});

		if (this.preferences.includeAcknowledgments) {
			new Setting(container).addTextArea((text) => {
				text.setPlaceholder('I would like to thank...')
					.setValue(this.data.acknowledgments || '')
					.onChange((value) => {
						this.data.acknowledgments = value || undefined;
					});
				text.inputEl.rows = 5;
				text.inputEl.style.width = '100%';
			});
		}
	}

	private renderBackMatterTab(container: HTMLElement) {
		// About the Author
		new Setting(container)
			.setName('Include About the Author')
			.setDesc('Add author biography')
			.addToggle((toggle) => {
				toggle.setValue(this.preferences.includeAboutAuthor).onChange((value) => {
					this.preferences.includeAboutAuthor = value;
					this.onOpen(); // Re-render to show/hide fields
				});
			});

		if (this.preferences.includeAboutAuthor) {
			if (!this.data.aboutAuthor) {
				this.data.aboutAuthor = { bio: '' };
			}

			new Setting(container).setName('Biography').addTextArea((text) => {
				text.setPlaceholder('Author bio...')
					.setValue(this.data.aboutAuthor!.bio)
					.onChange((value) => {
						this.data.aboutAuthor!.bio = value;
					});
				text.inputEl.rows = 4;
				text.inputEl.style.width = '100%';
			});

			new Setting(container).setName('Website').addText((text) => {
				text.setPlaceholder('https://authorwebsite.com')
					.setValue(this.data.aboutAuthor!.website || '')
					.onChange((value) => {
						this.data.aboutAuthor!.website = value || undefined;
					});
				text.inputEl.style.width = '100%';
			});

			// Social Media
			container.createEl('h4', { text: 'Social Media (optional)' });

			if (!this.data.aboutAuthor!.socialMedia) {
				this.data.aboutAuthor!.socialMedia = {};
			}

			new Setting(container).setName('Twitter').addText((text) => {
				text.setPlaceholder('@username')
					.setValue(this.data.aboutAuthor!.socialMedia!.twitter || '')
					.onChange((value) => {
						this.data.aboutAuthor!.socialMedia!.twitter = value || undefined;
					});
			});

			new Setting(container).setName('Instagram').addText((text) => {
				text.setPlaceholder('@username')
					.setValue(this.data.aboutAuthor!.socialMedia!.instagram || '')
					.onChange((value) => {
						this.data.aboutAuthor!.socialMedia!.instagram = value || undefined;
					});
			});

			new Setting(container).setName('Facebook').addText((text) => {
				text.setPlaceholder('username')
					.setValue(this.data.aboutAuthor!.socialMedia!.facebook || '')
					.onChange((value) => {
						this.data.aboutAuthor!.socialMedia!.facebook = value || undefined;
					});
			});

			new Setting(container).setName('LinkedIn').addText((text) => {
				text.setPlaceholder('username')
					.setValue(this.data.aboutAuthor!.socialMedia!.linkedin || '')
					.onChange((value) => {
						this.data.aboutAuthor!.socialMedia!.linkedin = value || undefined;
					});
			});
		}

		// Also By
		new Setting(container)
			.setName('Include Also By')
			.setDesc('List other books by the author')
			.addToggle((toggle) => {
				toggle.setValue(this.preferences.includeAlsoBy).onChange((value) => {
					this.preferences.includeAlsoBy = value;
					this.onOpen();
				});
			});

		if (this.preferences.includeAlsoBy) {
			if (!this.data.alsoBy) {
				this.data.alsoBy = { title: 'Also by ' + this.data.author, books: [] };
			}

			new Setting(container).setName('Section Title').addText((text) => {
				text.setPlaceholder('Also by Author Name')
					.setValue(this.data.alsoBy!.title)
					.onChange((value) => {
						this.data.alsoBy!.title = value;
					});
				text.inputEl.style.width = '100%';
			});

			new Setting(container).setName('Book List').setDesc('One book title per line').addTextArea((text) => {
				text.setPlaceholder('Book One\nBook Two\nBook Three')
					.setValue(this.data.alsoBy!.books.join('\n'))
					.onChange((value) => {
						this.data.alsoBy!.books = value.split('\n').filter((l) => l.trim());
					});
				text.inputEl.rows = 5;
				text.inputEl.style.width = '100%';
			});
		}
	}

	private renderExportTab(container: HTMLElement) {
		// Style Template
		const templates = getAllStyleTemplates();
		new Setting(container)
			.setName('Style Template')
			.setDesc('Choose a professional style')
			.addDropdown((dropdown) => {
				templates.forEach((template) => {
					dropdown.addOption(template.id, template.name);
				});
				dropdown.setValue(this.preferences.style).onChange((value) => {
					this.preferences.style = value as FrontMatterStyle;
					this.onOpen(); // Re-render to show description
				});
			});

		// Show template description
		const selectedTemplate = templates.find((t) => t.id === this.preferences.style);
		if (selectedTemplate) {
			container.createEl('p', {
				text: selectedTemplate.description,
				cls: 'frontmatter-generator-template-description',
			});
		}

		// Export Format
		new Setting(container)
			.setName('Export Format')
			.setDesc('Choose output format')
			.addDropdown((dropdown) => {
				dropdown
					.addOption('markdown', 'Markdown Files')
					.addOption('latex', 'LaTeX Preamble')
					.addOption('both', 'Both')
					.setValue(this.preferences.exportFormat)
					.onChange((value) => {
						this.preferences.exportFormat = value as any;
					});
			});

		// Export as Files
		new Setting(container)
			.setName('Export as Separate Files')
			.setDesc('Create individual markdown files for each section')
			.addToggle((toggle) => {
				toggle.setValue(this.preferences.exportAsFiles).onChange((value) => {
					this.preferences.exportAsFiles = value;
				});
			});

		// Roman Numerals
		new Setting(container)
			.setName('Roman Numerals for Front Matter')
			.setDesc('Use roman numerals (i, ii, iii) for front matter page numbers')
			.addToggle((toggle) => {
				toggle.setValue(this.preferences.useRomanNumeralsForFrontMatter).onChange((value) => {
					this.preferences.useRomanNumeralsForFrontMatter = value;
				});
			});
	}

	private renderFooter(container: HTMLElement) {
		const buttonContainer = container.createDiv({ cls: 'frontmatter-generator-button-container' });

		// Cancel
		const cancelBtn = buttonContainer.createEl('button', { text: 'Cancel' });
		cancelBtn.onclick = () => this.close();

		// Generate
		const generateBtn = buttonContainer.createEl('button', { text: 'Generate Front Matter', cls: 'mod-cta' });
		generateBtn.onclick = async () => {
			await this.generateFrontMatter();
		};
	}

	private async generateFrontMatter() {
		// Validation
		if (!this.data.title.trim()) {
			new Notice('Please enter a title');
			return;
		}
		if (!this.data.author.trim()) {
			new Notice('Please enter an author name');
			return;
		}
		if (!this.data.copyright.holder.trim()) {
			new Notice('Please enter a copyright holder');
			return;
		}

		// Generate
		const generator = new FrontMatterGenerator();
		const output = generator.generate(this.data, this.preferences);

		// Save markdown files to vault
		if (output.markdownFiles && this.preferences.exportAsFiles) {
			const folderPath = 'Front Matter';

			// Create folder if it doesn't exist
			const folder = this.app.vault.getAbstractFileByPath(folderPath);
			if (!folder) {
				await this.app.vault.createFolder(folderPath);
			}

			// Write each file
			for (const [filename, content] of Object.entries(output.markdownFiles)) {
				const filePath = `${folderPath}/${filename}`;
				const existingFile = this.app.vault.getAbstractFileByPath(filePath);

				if (existingFile instanceof TFile) {
					await this.app.vault.modify(existingFile, content);
				} else {
					await this.app.vault.create(filePath, content);
				}
			}

			new Notice(`Created ${Object.keys(output.markdownFiles).length} front matter files in "${folderPath}"`);
		}

		// TODO: Save LaTeX preamble for export system integration
		// TODO: Save EPUB metadata

		this.close();
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
