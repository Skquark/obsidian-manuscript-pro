/**
 * Template Editor Modal
 * Professional visual interface for comprehensive book formatting
 *
 * This provides a multi-tabbed, intuitive UI for configuring every aspect
 * of document formatting without requiring LaTeX knowledge.
 */

import { App, Modal, Setting, Notice } from 'obsidian';
import type LatexPandocConcealerPlugin from '../main';
import { TemplateConfiguration, createDefaultTemplate, DocumentClass } from './TemplateConfiguration';
import { YAMLGenerator } from './YAMLGenerator';
import { LaTeXGenerator } from './LaTeXGenerator';
import { PresetGalleryModal } from './PresetGalleryModal';
import { CodeEditorComponent } from './CodeEditorComponent';

type EditorTab = 'document' | 'typography' | 'headers' | 'chapters' | 'content' | 'advanced' | 'expert' | 'preview';

export class TemplateEditorModal extends Modal {
	private plugin: LatexPandocConcealerPlugin;
	private config: TemplateConfiguration;
	private currentTab: EditorTab = 'document';
	private onSave: (config: TemplateConfiguration) => void;

	// UI Elements
	private tabContainer: HTMLElement;
	private contentContainer: HTMLElement;
	private previewPanel: HTMLElement;

	constructor(
		app: App,
		plugin: LatexPandocConcealerPlugin,
		config?: TemplateConfiguration,
		onSave?: (config: TemplateConfiguration) => void,
	) {
		super(app);
		this.plugin = plugin;
		this.config = config || createDefaultTemplate();
		this.onSave = onSave || (() => {});
	}

	/**
	 * Ensure geometry object exists with proper defaults
	 */
	private ensureGeometry() {
		if (!this.config.geometry) {
			this.config.geometry = {
				paperSize: 'letterpaper',
				top: '1in',
				bottom: '1in',
				inner: '1in',
				outer: '0.75in',
			};
		}
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass('template-editor-modal');

		// Add class to outer modal for width override
		this.modalEl.addClass('template-editor-modal-container');

		// Header
		this.renderHeader();

		// Main content area with tabs and editor
		const mainContent = contentEl.createDiv({ cls: 'template-editor-main' });

		// Tab navigation
		this.tabContainer = mainContent.createDiv({ cls: 'template-editor-tabs' });
		this.renderTabs();

		// Editor content
		this.contentContainer = mainContent.createDiv({ cls: 'template-editor-content' });

		// Preview panel (collapsible, starts collapsed for better space)
		this.previewPanel = mainContent.createDiv({ cls: 'template-editor-preview collapsed' });
		this.renderPreviewPanel();

		// Render initial tab
		this.renderCurrentTab();

		// Footer with action buttons
		this.renderFooter();
	}

	/**
	 * Render modal header with title and template info
	 */
	private renderHeader() {
		const header = this.contentEl.createDiv({ cls: 'template-editor-header' });

		const titleSection = header.createDiv({ cls: 'template-editor-title-section' });

		const titleInput = titleSection.createEl('input', {
			cls: 'template-editor-title-input',
			attr: {
				type: 'text',
				placeholder: 'Template Name',
			},
		});
		titleInput.value = this.config.name;
		titleInput.addEventListener('input', () => {
			this.config.name = titleInput.value;
			this.updatePreview();
		});

		// Browse Templates button
		const browseBtn = titleSection.createEl('button', {
			cls: 'template-browse-presets-btn',
			text: '📚 Browse Templates',
		});
		browseBtn.addEventListener('click', () => {
			this.openPresetGallery();
		});

		const descSection = header.createDiv({ cls: 'template-editor-desc-section' });
		const descInput = descSection.createEl('input', {
			cls: 'template-editor-desc-input',
			attr: {
				type: 'text',
				placeholder: 'Description (optional)',
			},
		});
		if (this.config.description) {
			descInput.value = this.config.description;
		}
		descInput.addEventListener('input', () => {
			this.config.description = descInput.value;
		});
	}

	/**
	 * Open the preset gallery to load a template
	 */
	private openPresetGallery() {
		const gallery = new PresetGalleryModal(this.app, this.plugin, (selectedConfig) => {
			// Load the selected preset into current config
			this.loadPresetConfig(selectedConfig);
		});
		gallery.open();
	}

	/**
	 * Load a preset configuration into the current template
	 */
	private loadPresetConfig(presetConfig: TemplateConfiguration) {
		// Deep copy to avoid reference issues
		const newConfig = JSON.parse(JSON.stringify(presetConfig));

		// Preserve current template name and description if they exist
		if (this.config.name && this.config.name !== 'Untitled Template') {
			newConfig.name = this.config.name;
		}
		if (this.config.description) {
			newConfig.description = this.config.description;
		}

		// Update modification timestamp
		newConfig.modifiedAt = Date.now();

		// Replace config
		this.config = newConfig;

		// Re-render the entire modal to show new values
		this.onOpen();
	}

	/**
	 * Render tab navigation
	 */
	private renderTabs() {
		this.tabContainer.empty();

		const tabs: Array<{ id: EditorTab; label: string; icon: string }> = [
			{ id: 'document', label: 'Document', icon: '📄' },
			{ id: 'typography', label: 'Typography', icon: '✍️' },
			{ id: 'headers', label: 'Headers/Footers', icon: '📑' },
			{ id: 'chapters', label: 'Chapters', icon: '📖' },
			{ id: 'content', label: 'Content', icon: '📝' },
			{ id: 'advanced', label: 'Advanced', icon: '⚙️' },
			{ id: 'expert', label: 'Expert', icon: '⚡' },
			{ id: 'preview', label: 'Preview', icon: '👁️' },
		];

		for (const tab of tabs) {
			const tabEl = this.tabContainer.createDiv({
				cls: `template-editor-tab ${this.currentTab === tab.id ? 'active' : ''}`,
			});

			tabEl.createSpan({ cls: 'template-editor-tab-icon', text: tab.icon });
			tabEl.createSpan({ cls: 'template-editor-tab-label', text: tab.label });

			tabEl.addEventListener('click', () => {
				this.currentTab = tab.id;
				this.renderTabs();
				this.renderCurrentTab();
			});
		}
	}

	/**
	 * Render the current tab's content
	 */
	private renderCurrentTab() {
		this.contentContainer.empty();

		switch (this.currentTab) {
			case 'document':
				this.renderDocumentTab();
				break;
			case 'typography':
				this.renderTypographyTab();
				break;
			case 'headers':
				this.renderHeadersTab();
				break;
			case 'chapters':
				this.renderChaptersTab();
				break;
			case 'content':
				this.renderContentTab();
				break;
			case 'advanced':
				this.renderAdvancedTab();
				break;
			case 'expert':
				this.renderExpertTab();
				break;
			case 'preview':
				this.renderPreviewTab();
				break;
		}
	}

	/**
	 * Document Settings Tab
	 */
	private renderDocumentTab() {
		const container = this.contentContainer;

		// Section: Basic Settings
		container.createEl('h3', { text: 'Basic Settings', cls: 'template-section-title' });

		new Setting(container)
			.setName('Document Class')
			.setDesc('The LaTeX document class determines the overall structure')
			.addDropdown((dropdown) => {
				dropdown.addOption('book', 'Book (chapters, front/back matter)');
				dropdown.addOption('article', 'Article (sections, no chapters)');
				dropdown.addOption('report', 'Report (chapters, simpler than book)');
				dropdown.addOption('memoir', 'Memoir (enhanced book class)');
				dropdown.addOption('scrbook', 'KOMA-Script Book (European style)');
				dropdown.setValue(this.config.document.documentClass);
				dropdown.onChange((value) => {
					this.config.document.documentClass = value as DocumentClass;
					this.config.modifiedAt = Date.now();
					this.updatePreview();
				});
			});

		new Setting(container)
			.setName('Class Options')
			.setDesc('Additional document class options (comma-separated)')
			.addText((text) => {
				text.setPlaceholder('e.g., openany, twoside, draft');
				text.setValue(this.config.document.classOptions.join(', '));
				text.onChange((value) => {
					this.config.document.classOptions = value
						.split(',')
						.map((s) => s.trim())
						.filter((s) => s);
					this.config.modifiedAt = Date.now();
					this.updatePreview();
				});
			});

		// Section: Page Numbering
		container.createEl('h3', { text: 'Page Numbering', cls: 'template-section-title' });

		new Setting(container)
			.setName('Enable Page Numbers')
			.setDesc('Show page numbers on pages')
			.addToggle((toggle) => {
				toggle.setValue(this.config.document.pageNumbering);
				toggle.onChange((value) => {
					this.config.document.pageNumbering = value;
					this.config.modifiedAt = Date.now();
					this.updatePreview();
				});
			});

		new Setting(container)
			.setName('Number Style')
			.setDesc('Style for page numbers')
			.addDropdown((dropdown) => {
				dropdown.addOption('arabic', 'Arabic (1, 2, 3)');
				dropdown.addOption('roman', 'Roman lowercase (i, ii, iii)');
				dropdown.addOption('Roman', 'Roman uppercase (I, II, III)');
				dropdown.addOption('alph', 'Alphabetic lowercase (a, b, c)');
				dropdown.addOption('Alph', 'Alphabetic uppercase (A, B, C)');
				dropdown.setValue(this.config.document.pageNumberStyle);
				dropdown.onChange((value) => {
					this.config.document.pageNumberStyle = value as 'arabic' | 'roman' | 'Roman' | 'alph' | 'Alph';
					this.config.modifiedAt = Date.now();
					this.updatePreview();
				});
			});

		new Setting(container)
			.setName('Number Position')
			.setDesc('Where to place page numbers')
			.addDropdown((dropdown) => {
				dropdown.addOption('footer', 'Footer (bottom of page)');
				dropdown.addOption('header', 'Header (top of page)');
				dropdown.addOption('both', 'Both header and footer');
				dropdown.setValue(this.config.document.pageNumberPosition);
				dropdown.onChange((value) => {
					this.config.document.pageNumberPosition = value as 'header' | 'footer' | 'both';
					this.config.modifiedAt = Date.now();
					this.updatePreview();
				});
			});

		// Info box
		const infoBox = container.createDiv({ cls: 'template-info-box' });
		infoBox.innerHTML = `
			<strong>💡 Tip:</strong> The <em>book</em> class is recommended for most manuscripts.
			It provides chapters, automatic front/back matter, and professional page layouts.
		`;
	}

	/**
	 * Typography Tab
	 */
	private renderTypographyTab() {
		const container = this.contentContainer;

		// Section: Fonts
		container.createEl('h3', { text: 'Fonts', cls: 'template-section-title' });

		new Setting(container)
			.setName('Body Font')
			.setDesc('Main font for body text')
			.addText((text) => {
				text.setPlaceholder('e.g., DejaVu Serif, Times New Roman');
				text.setValue(this.config.typography.bodyFont);
				text.inputEl.style.width = '100%';
				text.onChange((value) => {
					this.config.typography.bodyFont = value;
					this.config.modifiedAt = Date.now();
					this.updatePreview();
				});
			});

		// Font suggestions
		const fontSuggestions = container.createDiv({ cls: 'template-font-suggestions' });
		const fonts = ['DejaVu Serif', 'Times New Roman', 'Palatino', 'Georgia', 'Garamond', 'Baskerville'];
		for (const font of fonts) {
			const btn = fontSuggestions.createEl('button', {
				cls: 'template-font-suggestion-btn',
				text: font,
			});
			btn.addEventListener('click', () => {
				this.config.typography.bodyFont = font;
				this.config.modifiedAt = Date.now();
				this.renderCurrentTab();
				this.updatePreview();
			});
		}

		new Setting(container)
			.setName('Sans-Serif Font')
			.setDesc('Font for headings and UI elements')
			.addText((text) => {
				text.setPlaceholder('e.g., DejaVu Sans, Arial');
				text.setValue(this.config.typography.sansFont);
				text.inputEl.style.width = '100%';
				text.onChange((value) => {
					this.config.typography.sansFont = value;
					this.config.modifiedAt = Date.now();
					this.updatePreview();
				});
			});

		new Setting(container)
			.setName('Monospace Font')
			.setDesc('Font for code blocks')
			.addText((text) => {
				text.setPlaceholder('e.g., DejaVu Sans Mono, Courier');
				text.setValue(this.config.typography.monoFont);
				text.inputEl.style.width = '100%';
				text.onChange((value) => {
					this.config.typography.monoFont = value;
					this.config.modifiedAt = Date.now();
					this.updatePreview();
				});
			});

		// Section: Font Size and Spacing
		container.createEl('h3', { text: 'Font Size & Spacing', cls: 'template-section-title' });

		new Setting(container)
			.setName('Font Size')
			.setDesc('Base font size for body text')
			.addDropdown((dropdown) => {
				const sizes = ['9pt', '10pt', '10.5pt', '11pt', '11.5pt', '12pt', '13pt', '14pt'];
				for (const size of sizes) {
					dropdown.addOption(size, size);
				}
				dropdown.setValue(this.config.typography.fontSize);
				dropdown.onChange((value) => {
					this.config.typography.fontSize = value;
					this.config.modifiedAt = Date.now();
					this.updatePreview();
				});
			});

		new Setting(container)
			.setName('Line Spacing')
			.setDesc('Space between lines of text (1.0 = single, 2.0 = double)')
			.addSlider((slider) => {
				slider.setLimits(1.0, 2.0, 0.05);
				slider.setValue(this.config.typography.lineSpacing);
				slider.setDynamicTooltip();
				slider.onChange((value) => {
					this.config.typography.lineSpacing = value;
					this.config.modifiedAt = Date.now();
					this.updatePreview();
				});
			})
			.addExtraButton((btn) => {
				btn.setIcon('reset');
				btn.setTooltip('Reset to 1.15');
				btn.onClick(() => {
					this.config.typography.lineSpacing = 1.15;
					this.config.modifiedAt = Date.now();
					this.renderCurrentTab();
					this.updatePreview();
				});
			});

		// Section: Paragraphs
		container.createEl('h3', { text: 'Paragraph Formatting', cls: 'template-section-title' });

		new Setting(container)
			.setName('Paragraph Indent')
			.setDesc('Indentation for first line of paragraphs')
			.addText((text) => {
				text.setPlaceholder('e.g., 0.25in, 1.5em, 18pt');
				text.setValue(this.config.typography.paragraphIndent);
				text.onChange((value) => {
					this.config.typography.paragraphIndent = value;
					this.config.modifiedAt = Date.now();
					this.updatePreview();
				});
			});

		new Setting(container)
			.setName('Paragraph Spacing')
			.setDesc('Vertical space between paragraphs (0pt = none)')
			.addText((text) => {
				text.setPlaceholder('e.g., 0pt, 6pt, 0.5em');
				text.setValue(this.config.typography.paragraphSpacing);
				text.onChange((value) => {
					this.config.typography.paragraphSpacing = value;
					this.config.modifiedAt = Date.now();
					this.updatePreview();
				});
			});

		new Setting(container)
			.setName('Indent First Paragraph')
			.setDesc('Indent the first paragraph after chapter headings')
			.addToggle((toggle) => {
				toggle.setValue(this.config.typography.firstLineIndent);
				toggle.onChange((value) => {
					this.config.typography.firstLineIndent = value;
					this.config.modifiedAt = Date.now();
					this.updatePreview();
				});
			});

		// Section: Advanced Typography
		container.createEl('h3', { text: 'Advanced Typography', cls: 'template-section-title' });

		new Setting(container)
			.setName('Microtype')
			.setDesc('Enable micro-typographic enhancements for better spacing and readability')
			.addToggle((toggle) => {
				toggle.setValue(this.config.typography.microtype);
				toggle.onChange((value) => {
					this.config.typography.microtype = value;
					this.config.modifiedAt = Date.now();
					this.updatePreview();
				});
			});

		new Setting(container)
			.setName('Hyphenation')
			.setDesc('Allow word hyphenation at line breaks')
			.addToggle((toggle) => {
				toggle.setValue(this.config.typography.hyphenation);
				toggle.onChange((value) => {
					this.config.typography.hyphenation = value;
					this.config.modifiedAt = Date.now();
					this.updatePreview();
				});
			});

		new Setting(container)
			.setName('Ragged Bottom')
			.setDesc("Don't stretch vertical space to fill pages (recommended for books)")
			.addToggle((toggle) => {
				toggle.setValue(this.config.typography.raggedBottom);
				toggle.onChange((value) => {
					this.config.typography.raggedBottom = value;
					this.config.modifiedAt = Date.now();
					this.updatePreview();
				});
			});

		// Info box
		const infoBox = container.createDiv({ cls: 'template-info-box' });
		infoBox.innerHTML = `
			<strong>📚 Publishing Standard:</strong> Most printed books use 10.5pt to 12pt font size,
			1.15-1.3 line spacing, and 0.18in-0.25in paragraph indent.
		`;
	}

	/**
	 * Headers/Footers Tab
	 */
	private renderHeadersTab() {
		const container = this.contentContainer;

		container.createEl('h3', { text: 'Header & Footer Style', cls: 'template-section-title' });

		new Setting(container)
			.setName('Preset Style')
			.setDesc('Choose a common header/footer layout')
			.addDropdown((dropdown) => {
				dropdown.addOption('none', 'None (no headers/footers)');
				dropdown.addOption('book-lr', 'Book - Left/Right (title on left, chapter on right)');
				dropdown.addOption('book-center', 'Book - Centered (chapter name centered)');
				dropdown.addOption('academic', 'Academic (author and title)');
				dropdown.addOption('minimal', 'Minimal (page numbers only)');
				dropdown.addOption('custom', 'Custom (advanced)');
				dropdown.setValue(this.config.headersFooters.preset);
				dropdown.onChange((value) => {
					this.config.headersFooters.preset = value as
						| 'none'
						| 'book-lr'
						| 'book-center'
						| 'academic'
						| 'minimal'
						| 'custom';
					this.config.modifiedAt = Date.now();
					this.updatePreview();
				});
			});

		// Preview of current style
		const previewBox = container.createDiv({ cls: 'template-header-preview' });
		this.renderHeaderPreview(previewBox);

		// Header Rule
		container.createEl('h3', { text: 'Header Rule', cls: 'template-section-title' });

		new Setting(container)
			.setName('Show Header Rule')
			.setDesc('Display a horizontal line below headers')
			.addToggle((toggle) => {
				toggle.setValue(this.config.headersFooters.headerRule.enabled);
				toggle.onChange((value) => {
					this.config.headersFooters.headerRule.enabled = value;
					this.config.modifiedAt = Date.now();
					this.updatePreview();
				});
			});

		if (this.config.headersFooters.headerRule.enabled) {
			new Setting(container)
				.setName('Rule Width')
				.setDesc('Thickness of the header rule')
				.addDropdown((dropdown) => {
					dropdown.addOption('0.2pt', 'Thin (0.2pt)');
					dropdown.addOption('0.4pt', 'Medium (0.4pt)');
					dropdown.addOption('0.8pt', 'Thick (0.8pt)');
					dropdown.addOption('1pt', 'Very Thick (1pt)');
					dropdown.setValue(this.config.headersFooters.headerRule.width);
					dropdown.onChange((value) => {
						this.config.headersFooters.headerRule.width = value;
						this.config.modifiedAt = Date.now();
						this.updatePreview();
					});
				});
		}

		// Chapter First Page
		container.createEl('h3', { text: 'Chapter First Pages', cls: 'template-section-title' });

		new Setting(container)
			.setName('First Page Style')
			.setDesc('Style for the first page of each chapter')
			.addDropdown((dropdown) => {
				dropdown.addOption('plain', 'Plain (page number only)');
				dropdown.addOption('empty', 'Empty (no header/footer)');
				dropdown.addOption('fancy', 'Fancy (same as other pages)');
				dropdown.setValue(this.config.headersFooters.firstPageStyle);
				dropdown.onChange((value) => {
					this.config.headersFooters.firstPageStyle = value as 'plain' | 'empty' | 'fancy';
					this.config.modifiedAt = Date.now();
					this.updatePreview();
				});
			});
	}

	/**
	 * Render header/footer preview
	 */
	private renderHeaderPreview(container: HTMLElement) {
		container.empty();
		container.addClass('header-footer-preview-box');

		const preset = this.config.headersFooters.preset;

		if (preset === 'none') {
			container.createDiv({ text: 'No headers or footers', cls: 'preview-empty' });
			return;
		}

		// Left page preview
		const leftPage = container.createDiv({ cls: 'page-preview left-page' });
		leftPage.createDiv({ cls: 'page-label', text: 'Left Page (Even)' });
		const leftHeader = leftPage.createDiv({ cls: 'page-header' });
		const leftFooter = leftPage.createDiv({ cls: 'page-footer' });

		// Right page preview
		const rightPage = container.createDiv({ cls: 'page-preview right-page' });
		rightPage.createDiv({ cls: 'page-label', text: 'Right Page (Odd)' });
		const rightHeader = rightPage.createDiv({ cls: 'page-header' });
		const rightFooter = rightPage.createDiv({ cls: 'page-footer' });

		// Fill based on preset
		switch (preset) {
			case 'book-lr':
				leftHeader.innerHTML = '<span class="header-left">Book Title</span><span class="header-right"></span>';
				rightHeader.innerHTML = '<span class="header-left"></span><span class="header-right">Chapter Name</span>';
				leftFooter.innerHTML = '<span class="footer-center">42</span>';
				rightFooter.innerHTML = '<span class="footer-center">43</span>';
				break;
			case 'book-center':
				leftHeader.innerHTML = '<span class="header-center">Chapter Name</span>';
				rightHeader.innerHTML = '<span class="header-center">Chapter Name</span>';
				leftFooter.innerHTML = '<span class="footer-center">42</span>';
				rightFooter.innerHTML = '<span class="footer-center">43</span>';
				break;
			case 'academic':
				leftHeader.innerHTML =
					'<span class="header-left">Author Name</span><span class="header-right">Document Title</span>';
				rightHeader.innerHTML =
					'<span class="header-left">Author Name</span><span class="header-right">Document Title</span>';
				leftFooter.innerHTML = '<span class="footer-center">42</span>';
				rightFooter.innerHTML = '<span class="footer-center">43</span>';
				break;
			case 'minimal':
				leftFooter.innerHTML = '<span class="footer-center">42</span>';
				rightFooter.innerHTML = '<span class="footer-center">43</span>';
				break;
		}

		// Add rule if enabled
		if (this.config.headersFooters.headerRule.enabled) {
			leftHeader.style.borderBottom = `${this.config.headersFooters.headerRule.width} solid var(--text-muted)`;
			rightHeader.style.borderBottom = `${this.config.headersFooters.headerRule.width} solid var(--text-muted)`;
		}
	}

	/**
	 * Chapters Tab
	 */
	private renderChaptersTab() {
		const container = this.contentContainer;

		container.createEl('h3', { text: 'Chapter Formatting', cls: 'template-section-title' });

		// Chapter Display Style
		new Setting(container)
			.setName('Chapter Display')
			.setDesc('How chapter titles should appear')
			.addDropdown((dropdown) => {
				dropdown.addOption('default', 'Default (LaTeX standard)');
				dropdown.addOption('hang', 'Hang (number beside title)');
				dropdown.addOption('display', 'Display (number above title)');
				dropdown.addOption('block', 'Block (number and title together)');
				dropdown.addOption('custom', 'Custom (advanced)');
				dropdown.setValue(this.config.chapters.display || 'default');
				dropdown.onChange((value) => {
					this.config.chapters.display = value as any;
					this.config.modifiedAt = Date.now();
					this.updatePreview();
				});
			});

		// Chapter Number Format
		new Setting(container)
			.setName('Number Format')
			.setDesc('Style for chapter numbering')
			.addDropdown((dropdown) => {
				dropdown.addOption('arabic', 'Arabic (1, 2, 3...)');
				dropdown.addOption('roman', 'Roman (I, II, III...)');
				dropdown.addOption('Roman', 'Roman Uppercase (I, II, III...)');
				dropdown.addOption('alpha', 'Alphabetic (a, b, c...)');
				dropdown.addOption('Alpha', 'Alphabetic Uppercase (A, B, C...)');
				dropdown.addOption('none', 'None (unnumbered)');
				dropdown.setValue(this.config.chapters.numberFormat || 'arabic');
				dropdown.onChange((value) => {
					this.config.chapters.numberFormat = value as any;
					this.config.modifiedAt = Date.now();
					this.updatePreview();
				});
			});

		// Chapter Prefix
		new Setting(container)
			.setName('Chapter Prefix')
			.setDesc('Text before chapter number (e.g., "Chapter", "Part")')
			.addText((text) => {
				text.setPlaceholder('Chapter');
				text.setValue(this.config.chapters.prefix || 'Chapter');
				text.onChange((value) => {
					this.config.chapters.prefix = value;
					this.config.modifiedAt = Date.now();
					this.updatePreview();
				});
			});

		// Font Size
		new Setting(container)
			.setName('Title Font Size')
			.setDesc('Chapter title font size')
			.addDropdown((dropdown) => {
				dropdown.addOption('huge', 'Huge (largest)');
				dropdown.addOption('LARGE', 'Large');
				dropdown.addOption('Large', 'Medium Large');
				dropdown.addOption('large', 'Medium');
				dropdown.addOption('normalsize', 'Normal');
				dropdown.setValue(this.config.chapters.fontSize || 'huge');
				dropdown.onChange((value) => {
					this.config.chapters.fontSize = value;
					this.config.modifiedAt = Date.now();
					this.updatePreview();
				});
			});

		// Spacing Section
		container.createEl('h3', { text: 'Chapter Spacing', cls: 'template-section-title' });

		new Setting(container)
			.setName('Space Before Chapter')
			.setDesc('Vertical space above chapter title (in points)')
			.addText((text) => {
				text.setPlaceholder('50');
				text.setValue(this.config.chapters.spaceBefore || '50');
				text.inputEl.type = 'number';
				text.onChange((value) => {
					this.config.chapters.spaceBefore = value;
					this.config.modifiedAt = Date.now();
					this.updatePreview();
				});
			});

		new Setting(container)
			.setName('Space After Chapter')
			.setDesc('Vertical space below chapter title (in points)')
			.addText((text) => {
				text.setPlaceholder('40');
				text.setValue(this.config.chapters.spaceAfter || '40');
				text.inputEl.type = 'number';
				text.onChange((value) => {
					this.config.chapters.spaceAfter = value;
					this.config.modifiedAt = Date.now();
					this.updatePreview();
				});
			});

		// Chapter Breaks
		container.createEl('h3', { text: 'Chapter Breaks', cls: 'template-section-title' });

		new Setting(container)
			.setName('Start on New Page')
			.setDesc('Always begin chapters on a new page')
			.addToggle((toggle) => {
				toggle.setValue(this.config.chapters.newPage !== false); // Default true
				toggle.onChange((value) => {
					this.config.chapters.newPage = value;
					this.config.modifiedAt = Date.now();
					this.updatePreview();
				});
			});

		new Setting(container)
			.setName('Start on Right Page')
			.setDesc('Begin chapters on right-hand pages only (for printed books)')
			.addToggle((toggle) => {
				toggle.setValue(this.config.chapters.rightPage || false);
				toggle.onChange((value) => {
					this.config.chapters.rightPage = value;
					this.config.modifiedAt = Date.now();
					this.updatePreview();
				});
			});

		// Alignment
		container.createEl('h3', { text: 'Chapter Title Alignment', cls: 'template-section-title' });

		new Setting(container)
			.setName('Title Alignment')
			.setDesc('Horizontal alignment of chapter titles')
			.addDropdown((dropdown) => {
				dropdown.addOption('left', 'Left');
				dropdown.addOption('center', 'Center');
				dropdown.addOption('right', 'Right');
				dropdown.setValue(this.config.chapters.align || 'left');
				dropdown.onChange((value) => {
					this.config.chapters.align = value as any;
					this.config.modifiedAt = Date.now();
					this.updatePreview();
				});
			});

		// Styling Options
		container.createEl('h3', { text: 'Chapter Styling', cls: 'template-section-title' });

		new Setting(container)
			.setName('Bold Titles')
			.setDesc('Display chapter titles in bold')
			.addToggle((toggle) => {
				toggle.setValue(this.config.chapters.bold !== false); // Default true
				toggle.onChange((value) => {
					this.config.chapters.bold = value;
					this.config.modifiedAt = Date.now();
					this.updatePreview();
				});
			});

		new Setting(container)
			.setName('Uppercase Titles')
			.setDesc('Convert chapter titles to uppercase')
			.addToggle((toggle) => {
				toggle.setValue(this.config.chapters.uppercase || false);
				toggle.onChange((value) => {
					this.config.chapters.uppercase = value;
					this.config.modifiedAt = Date.now();
					this.updatePreview();
				});
			});

		// Info box
		const infoBox = container.createDiv({ cls: 'template-info-box' });
		infoBox.innerHTML = `
			<strong>📖 Chapter Formatting Tips:</strong>
			<ul>
				<li><strong>New Page:</strong> Standard for most books</li>
				<li><strong>Right Page:</strong> Traditional for print editions (adds blank page if needed)</li>
				<li><strong>Spacing:</strong> 40-60pt before, 30-40pt after is typical</li>
				<li><strong>Alignment:</strong> Left or center are most common</li>
			</ul>
		`;
	}

	/**
	 * Content Tab (TOC, Lists, Images)
	 */
	private renderContentTab() {
		const container = this.contentContainer;

		// Table of Contents
		container.createEl('h3', { text: 'Table of Contents', cls: 'template-section-title' });

		new Setting(container)
			.setName('Include Table of Contents')
			.setDesc('Generate a table of contents at the beginning')
			.addToggle((toggle) => {
				toggle.setValue(this.config.tableOfContents.enabled);
				toggle.onChange((value) => {
					this.config.tableOfContents.enabled = value;
					this.config.modifiedAt = Date.now();
					this.renderCurrentTab(); // Re-render to show/hide options
					this.updatePreview();
				});
			});

		if (this.config.tableOfContents.enabled) {
			new Setting(container)
				.setName('TOC Depth')
				.setDesc('How many heading levels to include')
				.addDropdown((dropdown) => {
					dropdown.addOption('1', 'Chapters only');
					dropdown.addOption('2', 'Chapters + Sections');
					dropdown.addOption('3', 'Chapters + Sections + Subsections');
					dropdown.setValue(this.config.tableOfContents.depth.toString());
					dropdown.onChange((value) => {
						this.config.tableOfContents.depth = parseInt(value);
						this.config.modifiedAt = Date.now();
						this.updatePreview();
					});
				});

			new Setting(container)
				.setName('TOC Title')
				.setDesc('Title for the table of contents section')
				.addText((text) => {
					text.setValue(this.config.tableOfContents.title);
					text.onChange((value) => {
						this.config.tableOfContents.title = value;
						this.config.modifiedAt = Date.now();
						this.updatePreview();
					});
				});

			new Setting(container)
				.setName('Dot Leaders')
				.setDesc('Show dotted lines between entries and page numbers')
				.addToggle((toggle) => {
					toggle.setValue(this.config.tableOfContents.dotLeaders);
					toggle.onChange((value) => {
						this.config.tableOfContents.dotLeaders = value;
						this.config.modifiedAt = Date.now();
						this.updatePreview();
					});
				});

			new Setting(container)
				.setName('Bold Chapter Entries')
				.setDesc('Display chapter entries in bold text')
				.addToggle((toggle) => {
					toggle.setValue(this.config.tableOfContents.chapterBold);
					toggle.onChange((value) => {
						this.config.tableOfContents.chapterBold = value;
						this.config.modifiedAt = Date.now();
						this.updatePreview();
					});
				});
		}
	}

	/**
	 * Advanced Tab
	 */
	private renderAdvancedTab() {
		const container = this.contentContainer;

		// Page Geometry
		container.createEl('h3', { text: 'Page Geometry', cls: 'template-section-title' });

		new Setting(container)
			.setName('Page Size')
			.setDesc('Standard book trim sizes')
			.addDropdown((dropdown) => {
				dropdown.addOption('letterpaper', 'Letter (8.5" × 11")');
				dropdown.addOption('a4paper', 'A4 (210mm × 297mm)');
				dropdown.addOption('5x8', 'Digest (5" × 8")');
				dropdown.addOption('5.5x8.5', 'Trade (5.5" × 8.5")');
				dropdown.addOption('6x9', 'Trade (6" × 9")');
				dropdown.addOption('7x10', 'Crown Quarto (7" × 10")');
				dropdown.addOption('8.5x11', 'Letter (8.5" × 11")');
				dropdown.addOption('custom', 'Custom');
				dropdown.setValue(this.config.geometry?.paperSize || 'letterpaper');
				dropdown.onChange((value) => {
					this.ensureGeometry();
					this.config.geometry!.paperSize = value;
					this.config.modifiedAt = Date.now();
					this.updatePreview();
				});
			});

		new Setting(container)
			.setName('Top Margin')
			.setDesc('Top page margin (e.g., "1in", "2.5cm")')
			.addText((text) => {
				text.setPlaceholder('1in');
				text.setValue(this.config.geometry?.top || '1in');
				text.onChange((value) => {
					if (!this.config.geometry) this.config.geometry = {};
					this.config.geometry.top = value;
					this.config.modifiedAt = Date.now();
					this.updatePreview();
				});
			});

		new Setting(container)
			.setName('Bottom Margin')
			.setDesc('Bottom page margin')
			.addText((text) => {
				text.setPlaceholder('1in');
				text.setValue(this.config.geometry?.bottom || '1in');
				text.onChange((value) => {
					if (!this.config.geometry) this.config.geometry = {};
					this.config.geometry.bottom = value;
					this.config.modifiedAt = Date.now();
					this.updatePreview();
				});
			});

		new Setting(container)
			.setName('Inner Margin')
			.setDesc('Inside margin (binding side)')
			.addText((text) => {
				text.setPlaceholder('1in');
				text.setValue(this.config.geometry?.inner || '1in');
				text.onChange((value) => {
					if (!this.config.geometry) this.config.geometry = {};
					this.config.geometry.inner = value;
					this.config.modifiedAt = Date.now();
					this.updatePreview();
				});
			});

		new Setting(container)
			.setName('Outer Margin')
			.setDesc('Outside margin (away from binding)')
			.addText((text) => {
				text.setPlaceholder('0.75in');
				text.setValue(this.config.geometry?.outer || '0.75in');
				text.onChange((value) => {
					if (!this.config.geometry) this.config.geometry = {};
					this.config.geometry.outer = value;
					this.config.modifiedAt = Date.now();
					this.updatePreview();
				});
			});

		// List Styling
		container.createEl('h3', { text: 'List Styling', cls: 'template-section-title' });

		new Setting(container)
			.setName('Bullet Style')
			.setDesc('Symbol for unordered lists')
			.addDropdown((dropdown) => {
				dropdown.addOption('•', '• Bullet (default)');
				dropdown.addOption('◦', '◦ Circle');
				dropdown.addOption('▪', '▪ Square');
				dropdown.addOption('–', '– Dash');
				dropdown.addOption('→', '→ Arrow');
				dropdown.setValue(this.config.lists.bulletStyle || '•');
				dropdown.onChange((value) => {
					this.config.lists.bulletStyle = value;
					this.config.modifiedAt = Date.now();
					this.updatePreview();
				});
			});

		new Setting(container)
			.setName('List Spacing')
			.setDesc('Spacing between list items')
			.addDropdown((dropdown) => {
				dropdown.addOption('compact', 'Compact (minimal)');
				dropdown.addOption('normal', 'Normal (standard)');
				dropdown.addOption('relaxed', 'Relaxed (generous)');
				dropdown.setValue(this.config.lists.itemSpacing || 'normal');
				dropdown.onChange((value) => {
					this.config.lists.itemSpacing = value as any;
					this.config.modifiedAt = Date.now();
					this.updatePreview();
				});
			});

		new Setting(container)
			.setName('Indent Lists')
			.setDesc('Indent list items from margin')
			.addToggle((toggle) => {
				toggle.setValue(this.config.lists.indent !== false);
				toggle.onChange((value) => {
					this.config.lists.indent = value;
					this.config.modifiedAt = Date.now();
					this.updatePreview();
				});
			});

		// Image Settings
		container.createEl('h3', { text: 'Image Settings', cls: 'template-section-title' });

		new Setting(container)
			.setName('Default Image Width')
			.setDesc('Default width for images (e.g., "0.8\\textwidth")')
			.addText((text) => {
				text.setPlaceholder('0.8\\textwidth');
				text.setValue(this.config.images.defaultWidth || '0.8\\textwidth');
				text.onChange((value) => {
					this.config.images.defaultWidth = value;
					this.config.modifiedAt = Date.now();
					this.updatePreview();
				});
			});

		new Setting(container)
			.setName('Image Alignment')
			.setDesc('Default alignment for images')
			.addDropdown((dropdown) => {
				dropdown.addOption('left', 'Left');
				dropdown.addOption('center', 'Center');
				dropdown.addOption('right', 'Right');
				dropdown.setValue(this.config.images.align || 'center');
				dropdown.onChange((value) => {
					this.config.images.align = value as any;
					this.config.modifiedAt = Date.now();
					this.updatePreview();
				});
			});

		new Setting(container)
			.setName('Caption Position')
			.setDesc('Where to place image captions')
			.addDropdown((dropdown) => {
				dropdown.addOption('below', 'Below Image');
				dropdown.addOption('above', 'Above Image');
				dropdown.setValue(this.config.images.captionPosition || 'below');
				dropdown.onChange((value) => {
					this.config.images.captionPosition = value as any;
					this.config.modifiedAt = Date.now();
					this.updatePreview();
				});
			});

		new Setting(container)
			.setName('Keep Images in Place')
			.setDesc('Prevent LaTeX from floating images to other pages')
			.addToggle((toggle) => {
				toggle.setValue(this.config.images.keepInPlace || false);
				toggle.onChange((value) => {
					this.config.images.keepInPlace = value;
					this.config.modifiedAt = Date.now();
					this.updatePreview();
				});
			});

		// Table Settings
		container.createEl('h3', { text: 'Table Settings', cls: 'template-section-title' });

		new Setting(container)
			.setName('Table Style')
			.setDesc('Visual style for tables')
			.addDropdown((dropdown) => {
				dropdown.addOption('default', 'Default (simple lines)');
				dropdown.addOption('booktabs', 'Booktabs (professional)');
				dropdown.addOption('grid', 'Grid (all borders)');
				dropdown.addOption('minimal', 'Minimal (no borders)');
				dropdown.setValue(this.config.tables.style || 'booktabs');
				dropdown.onChange((value) => {
					this.config.tables.style = value as any;
					this.config.modifiedAt = Date.now();
					this.updatePreview();
				});
			});

		new Setting(container)
			.setName('Header Row Style')
			.setDesc('Styling for table header rows')
			.addDropdown((dropdown) => {
				dropdown.addOption('bold', 'Bold');
				dropdown.addOption('normal', 'Normal');
				dropdown.addOption('italic', 'Italic');
				dropdown.setValue(this.config.tables.headerStyle || 'bold');
				dropdown.onChange((value) => {
					this.config.tables.headerStyle = value as any;
					this.config.modifiedAt = Date.now();
					this.updatePreview();
				});
			});

		new Setting(container)
			.setName('Zebra Striping')
			.setDesc('Alternate row background colors')
			.addToggle((toggle) => {
				toggle.setValue(this.config.tables.zebraStriping || false);
				toggle.onChange((value) => {
					this.config.tables.zebraStriping = value;
					this.config.modifiedAt = Date.now();
					this.updatePreview();
				});
			});

		// Code Block Settings
		container.createEl('h3', { text: 'Code Block Settings', cls: 'template-section-title' });

		new Setting(container)
			.setName('Syntax Highlighting')
			.setDesc('Enable syntax highlighting for code blocks')
			.addToggle((toggle) => {
				toggle.setValue(this.config.codeBlocks.highlighting !== false);
				toggle.onChange((value) => {
					this.config.codeBlocks.highlighting = value;
					this.config.modifiedAt = Date.now();
					this.updatePreview();
				});
			});

		new Setting(container)
			.setName('Line Numbers')
			.setDesc('Show line numbers in code blocks')
			.addToggle((toggle) => {
				toggle.setValue(this.config.codeBlocks.lineNumbers || false);
				toggle.onChange((value) => {
					this.config.codeBlocks.lineNumbers = value;
					this.config.modifiedAt = Date.now();
					this.updatePreview();
				});
			});

		new Setting(container)
			.setName('Code Font Size')
			.setDesc('Font size for code blocks')
			.addDropdown((dropdown) => {
				dropdown.addOption('footnotesize', 'Footnote (small)');
				dropdown.addOption('small', 'Small');
				dropdown.addOption('normalsize', 'Normal');
				dropdown.addOption('large', 'Large');
				dropdown.setValue(this.config.codeBlocks.fontSize || 'footnotesize');
				dropdown.onChange((value) => {
					this.config.codeBlocks.fontSize = value;
					this.config.modifiedAt = Date.now();
					this.updatePreview();
				});
			});

		new Setting(container)
			.setName('Code Background')
			.setDesc('Add background shading to code blocks')
			.addToggle((toggle) => {
				toggle.setValue(this.config.codeBlocks.background !== false);
				toggle.onChange((value) => {
					this.config.codeBlocks.background = value;
					this.config.modifiedAt = Date.now();
					this.updatePreview();
				});
			});

		// Info box
		const infoBox = container.createDiv({ cls: 'template-info-box' });
		infoBox.innerHTML = `
			<strong>⚙️ Advanced Settings Tips:</strong>
			<ul>
				<li><strong>Margins:</strong> Standard book: 0.75"-1" outer, 1"-1.25" inner</li>
				<li><strong>Booktabs:</strong> Professional table style, widely used in academic publishing</li>
				<li><strong>Image Float:</strong> "Keep in Place" prevents LaTeX from moving images</li>
				<li><strong>Code Highlighting:</strong> Requires listings or minted LaTeX package</li>
			</ul>
		`;
	}

	/**
	 * Expert Tab
	 */
	private renderExpertTab() {
		const container = this.contentContainer;

		container.createEl('h3', { text: 'Expert Mode', cls: 'template-section-title' });

		// Info box
		const infoBox = container.createDiv({ cls: 'template-info-box' });
		infoBox.innerHTML = `
			<strong>⚡ Expert Mode:</strong> Direct access to YAML and LaTeX code.
			UI changes update code automatically. Use "Apply to UI" for YAML edits.
			Enable "Override" for custom LaTeX.
		`;

		// YAML Editor Section
		this.renderYAMLEditorSection(container);

		// LaTeX Editor Section
		this.renderLaTeXEditorSection(container);

		// Import/Export Section
		this.renderImportExportSection(container);
	}

	/**
	 * Render YAML editor section
	 */
	private renderYAMLEditorSection(container: HTMLElement) {
		const section = container.createDiv({ cls: 'expert-section' });

		const header = section.createDiv({ cls: 'expert-section-header' });
		header.createEl('h4', { text: '📝 Pandoc YAML Configuration' });

		const editorContainer = section.createDiv({ cls: 'expert-editor-container' });

		// Generate YAML
		const yamlGen = new YAMLGenerator();
		const yamlValue =
			this.config.expertMode?.yamlOverride && this.config.expertMode?.customYAML ?
				this.config.expertMode.customYAML
			:	yamlGen.generate(this.config);

		// Create editor
		new CodeEditorComponent(editorContainer, {
			language: 'yaml',
			mode: this.config.expertMode?.yamlOverride ? 'edit' : 'view',
			initialValue: yamlValue,
			minHeight: '300px',
			maxHeight: '500px',
			onChange: () => {
				// Track changes
			},
			onApply: (value) => {
				this.applyYAMLToUI(value);
			},
			onModeChange: (mode) => {
				if (mode === 'edit') {
					if (!this.config.expertMode) this.config.expertMode = {};
					this.config.expertMode.yamlOverride = true;
				} else {
					if (this.config.expertMode) {
						this.config.expertMode.yamlOverride = false;
					}
				}
			},
		});
	}

	/**
	 * Render LaTeX editor section
	 */
	private renderLaTeXEditorSection(container: HTMLElement) {
		const section = container.createDiv({ cls: 'expert-section' });

		const header = section.createDiv({ cls: 'expert-section-header' });
		header.createEl('h4', { text: '🔧 LaTeX Header-Includes' });

		const editorContainer = section.createDiv({ cls: 'expert-editor-container' });

		// Generate LaTeX
		const latexGen = new LaTeXGenerator();
		const latexValue =
			this.config.expertMode?.latexOverride && this.config.expertMode?.customLaTeX ?
				this.config.expertMode.customLaTeX
			:	latexGen.generate(this.config);

		// Create editor
		const editor = new CodeEditorComponent(editorContainer, {
			language: 'latex',
			mode: this.config.expertMode?.latexOverride ? 'override' : 'view',
			initialValue: latexValue,
			minHeight: '300px',
			maxHeight: '500px',
			onChange: (value) => {
				// Store custom LaTeX when override is enabled
				if (this.config.expertMode?.latexOverride) {
					if (!this.config.expertMode) this.config.expertMode = {};
					this.config.expertMode.customLaTeX = value;
					this.config.modifiedAt = Date.now();
				}
			},
			onModeChange: (mode) => {
				if (mode === 'override') {
					if (!this.config.expertMode) this.config.expertMode = {};
					this.config.expertMode.latexOverride = true;
					this.config.expertMode.customLaTeX = editor.getValue();
				} else {
					if (this.config.expertMode) {
						this.config.expertMode.latexOverride = false;
						this.config.expertMode.customLaTeX = undefined;
					}
				}
				this.config.modifiedAt = Date.now();
			},
		});
	}

	/**
	 * Render import/export section
	 */
	private renderImportExportSection(container: HTMLElement) {
		const section = container.createDiv({ cls: 'expert-section' });

		section.createEl('h4', { text: '💾 Template Management' });

		section.createEl('p', {
			text: 'Export your template as JSON to share or backup. Import templates from others.',
			cls: 'expert-section-description',
		});

		const buttonGroup = section.createDiv({ cls: 'expert-button-group' });

		// Import button
		const importBtn = buttonGroup.createEl('button', {
			text: '📥 Import from JSON',
			cls: 'expert-action-btn',
		});

		importBtn.addEventListener('click', () => this.importTemplate());

		// Export button
		const exportBtn = buttonGroup.createEl('button', {
			text: '📤 Export as JSON',
			cls: 'expert-action-btn mod-cta',
		});

		exportBtn.addEventListener('click', () => this.exportTemplate());
	}

	/**
	 * Apply YAML changes to UI
	 */
	private applyYAMLToUI(yamlString: string): void {
		try {
			// For now, just store the custom YAML
			// Full parsing would require js-yaml library
			if (!this.config.expertMode) {
				this.config.expertMode = {};
			}
			this.config.expertMode.yamlOverride = true;
			this.config.expertMode.customYAML = yamlString;
			this.config.expertMode.lastSyncDirection = 'yaml';
			this.config.modifiedAt = Date.now();

			// Show success message
			new Notice('YAML saved. Note: UI tabs show original settings. YAML will be used for export.');
		} catch (error) {
			new Notice('Error saving YAML: ' + error.message);
		}
	}

	/**
	 * Import template from JSON file
	 */
	private async importTemplate(): Promise<void> {
		// Create file input
		const input = document.createElement('input');
		input.type = 'file';
		input.accept = '.json';

		input.addEventListener('change', async (e) => {
			const file = (e.target as HTMLInputElement).files?.[0];
			if (!file) return;

			try {
				const text = await file.text();
				const imported = JSON.parse(text);

				// Validate structure
				if (!imported.configuration) {
					throw new Error('Invalid template file format');
				}

				// Load configuration
				this.config = imported.configuration;
				this.config.modifiedAt = Date.now();

				// Re-render entire modal
				this.onOpen();

				// Show success message
				new Notice('Template imported successfully');
			} catch (error) {
				new Notice(`Import failed: ${error.message}`);
			}
		});

		input.click();
	}

	/**
	 * Export template as JSON file
	 */
	private exportTemplate(): void {
		// Create export object
		const exportData = {
			version: '1.0',
			metadata: {
				name: this.config.name,
				description: this.config.description,
				author: this.config.author || 'Unknown',
				created: this.config.createdAt || Date.now(),
				modified: this.config.modifiedAt,
			},
			configuration: this.config,
		};

		// Convert to JSON
		const json = JSON.stringify(exportData, null, 2);

		// Create blob and download
		const blob = new Blob([json], { type: 'application/json' });
		const url = URL.createObjectURL(blob);

		const a = document.createElement('a');
		a.href = url;
		a.download = `${this.config.name.replace(/\s+/g, '-')}-${Date.now()}.json`;
		a.click();

		URL.revokeObjectURL(url);

		new Notice('Template exported successfully');
	}

	/**
	 * Preview Tab
	 */
	private renderPreviewTab() {
		const container = this.contentContainer;

		container.createEl('h3', { text: 'Generated Output', cls: 'template-section-title' });

		// YAML Preview
		const yamlSection = container.createDiv({ cls: 'template-preview-section' });
		yamlSection.createEl('h4', { text: 'Pandoc YAML' });
		const yamlGen = new YAMLGenerator();
		const yaml = yamlGen.generate(this.config);
		const yamlPre = yamlSection.createEl('pre', { cls: 'template-preview-code' });
		yamlPre.createEl('code', { text: yaml });

		// Copy button
		const yamlCopyBtn = yamlSection.createEl('button', {
			cls: 'template-copy-btn',
			text: '📋 Copy YAML',
		});
		yamlCopyBtn.addEventListener('click', () => {
			navigator.clipboard.writeText(yaml);
			yamlCopyBtn.textContent = '✓ Copied!';
			setTimeout(() => {
				yamlCopyBtn.textContent = '📋 Copy YAML';
			}, 2000);
		});

		// LaTeX Preview
		const latexSection = container.createDiv({ cls: 'template-preview-section' });
		latexSection.createEl('h4', { text: 'LaTeX Header-Includes' });
		const latexGen = new LaTeXGenerator();
		const latex = latexGen.generate(this.config);
		const latexPre = latexSection.createEl('pre', { cls: 'template-preview-code' });
		latexPre.createEl('code', { text: latex });

		// Copy button
		const latexCopyBtn = latexSection.createEl('button', {
			cls: 'template-copy-btn',
			text: '📋 Copy LaTeX',
		});
		latexCopyBtn.addEventListener('click', () => {
			navigator.clipboard.writeText(latex);
			latexCopyBtn.textContent = '✓ Copied!';
			setTimeout(() => {
				latexCopyBtn.textContent = '📋 Copy LaTeX';
			}, 2000);
		});
	}

	/**
	 * Render preview panel (side panel with live info)
	 */
	private renderPreviewPanel() {
		this.previewPanel.empty();

		// Collapse toggle button (starts as expanded icon since panel starts collapsed)
		const isInitiallyCollapsed = this.previewPanel.classList.contains('collapsed');
		const toggleBtn = this.previewPanel.createEl('button', {
			cls: 'template-preview-toggle',
			text: isInitiallyCollapsed ? '»' : '«',
			attr: {
				title: isInitiallyCollapsed ? 'Show preview panel' : 'Hide preview panel'
			}
		});
		toggleBtn.addEventListener('click', () => {
			const isCollapsed = this.previewPanel.classList.contains('collapsed');
			if (isCollapsed) {
				this.previewPanel.classList.remove('collapsed');
				toggleBtn.setText('«');
				toggleBtn.setAttribute('title', 'Hide preview panel');
			} else {
				this.previewPanel.classList.add('collapsed');
				toggleBtn.setText('»');
				toggleBtn.setAttribute('title', 'Show preview panel');
			}
		});

		const header = this.previewPanel.createDiv({ cls: 'preview-panel-header' });
		header.createEl('h4', { text: '👁️ Live Preview' });

		const content = this.previewPanel.createDiv({ cls: 'preview-panel-content' });

		// Configuration summary
		const summary = content.createDiv({ cls: 'preview-summary' });
		summary.innerHTML = `
			<div class="preview-item">
				<strong>Document:</strong> ${this.config.document.documentClass}
			</div>
			<div class="preview-item">
				<strong>Font:</strong> ${this.config.typography.bodyFont} ${this.config.typography.fontSize}
			</div>
			<div class="preview-item">
				<strong>Line Spacing:</strong> ${this.config.typography.lineSpacing.toFixed(2)}x
			</div>
			<div class="preview-item">
				<strong>Headers:</strong> ${this.config.headersFooters.preset}
			</div>
			<div class="preview-item">
				<strong>TOC:</strong> ${this.config.tableOfContents.enabled ? 'Yes' : 'No'}
			</div>
		`;

		// Quick stats
		const stats = content.createDiv({ cls: 'preview-stats' });
		stats.createEl('div', {
			cls: 'preview-stat',
			text: `Modified: ${new Date(this.config.modifiedAt).toLocaleTimeString()}`,
		});
	}

	/**
	 * Update preview panel
	 */
	private updatePreview() {
		this.renderPreviewPanel();
	}

	/**
	 * Render footer with action buttons
	 */
	private renderFooter() {
		const footer = this.contentEl.createDiv({ cls: 'template-editor-footer' });

		const buttonContainer = footer.createDiv({ cls: 'template-editor-buttons' });

		// Reset button
		const resetBtn = buttonContainer.createEl('button', {
			cls: 'template-editor-btn-reset',
			text: '↺ Reset to Default',
		});
		resetBtn.addEventListener('click', () => {
			if (confirm('Reset all settings to default values?')) {
				this.config = createDefaultTemplate();
				this.config.name = 'Untitled Template';
				this.config.modifiedAt = Date.now();
				this.onOpen(); // Re-render entire modal
			}
		});

		// Cancel button
		const cancelBtn = buttonContainer.createEl('button', {
			cls: 'template-editor-btn-cancel',
			text: 'Cancel',
		});
		cancelBtn.addEventListener('click', () => {
			this.close();
		});

		// Save button
		const saveBtn = buttonContainer.createEl('button', {
			cls: 'template-editor-btn-save mod-cta',
			text: '💾 Save Template',
		});
		saveBtn.addEventListener('click', () => {
			this.onSave(this.config);
			this.close();
		});
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
