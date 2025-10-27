/**
 * Template Configuration System
 * Comprehensive interface for professional book formatting and layout
 *
 * This provides a structured, type-safe way to configure all aspects of document
 * formatting without requiring LaTeX knowledge. The configuration is converted to
 * Pandoc YAML and LaTeX header-includes by the YAMLGenerator and LaTeXGenerator.
 */

// ============================================
// DOCUMENT SETTINGS
// ============================================

export type DocumentClass = 'book' | 'article' | 'report' | 'memoir' | 'scrbook';

export interface DocumentSettings {
	documentClass: DocumentClass;
	classOptions: string[]; // e.g., ['openany', 'twoside', 'draft']
	paperSize?: 'letter' | 'a4' | 'custom'; // If custom, use geometry
	pageNumbering: boolean;
	pageNumberStyle: 'arabic' | 'roman' | 'Roman' | 'alph' | 'Alph';
	pageNumberPosition: 'header' | 'footer' | 'both';
}

// ============================================
// TYPOGRAPHY
// ============================================

export interface TypographySettings {
	// Fonts
	bodyFont: string; // e.g., "DejaVu Serif", "Times New Roman"
	sansFont: string; // For headings and UI elements
	monoFont: string; // For code blocks

	// Font properties
	fontSize: string; // e.g., "10pt", "11pt", "12pt"
	lineSpacing: number; // Line stretch factor (1.0 = single, 1.5 = 1.5x, 2.0 = double)

	// Font features (advanced)
	fontFeatures?: {
		smallCaps?: boolean;
		oldStyleNumerals?: boolean;
		ligatures?: boolean;
		letterSpacing?: number; // In points
	};

	// Paragraph formatting
	paragraphIndent: string; // e.g., "0.18in", "1.5em", "0pt"
	paragraphSpacing: string; // e.g., "0pt", "6pt", "0.5em"
	firstLineIndent: boolean; // Indent first paragraph of chapters

	// Advanced typography
	microtype: boolean; // Enable micro-typographic adjustments
	widowPenalty: number; // 0-10000, higher = avoid widows more
	clubPenalty: number; // 0-10000, higher = avoid orphans more
	hyphenPenalty: number; // 0-10000, higher = discourage hyphens
	tolerance: number; // 0-10000, line breaking tolerance
	emergencyStretch: string; // e.g., "3em" - extra stretch for bad lines
	raggedBottom: boolean; // Don't stretch vertical space to fill page

	// Hyphenation
	hyphenation: boolean;
	leftHyphenMin: number; // Min chars before hyphen (default 3)
	rightHyphenMin: number; // Min chars after hyphen (default 3)
	language: string; // e.g., "en-US", "en-GB", "es", "fr"
}

// ============================================
// PAGE GEOMETRY
// ============================================

export interface PageGeometry {
	// Paper size
	paperSize?: string; // e.g., "letterpaper", "a4paper", "6x9", "custom"
	paperWidth?: string; // e.g., "7in", "210mm" (for custom)
	paperHeight?: string; // e.g., "10in", "297mm" (for custom)

	// Margins (simple property names for UI)
	top?: string; // e.g., "1in", "2.5cm"
	bottom?: string;
	inner?: string; // Binding side
	outer?: string; // Outside edge

	// Legacy property names (for compatibility)
	topMargin?: string;
	bottomMargin?: string;
	innerMargin?: string;
	outerMargin?: string;

	// Advanced
	headerHeight?: string; // Space for header
	footerHeight?: string; // Space for footer
	marginParWidth?: string; // Width of margin notes
	marginParSep?: string; // Space between text and margin notes
}

// ============================================
// HEADERS & FOOTERS
// ============================================

export type HeaderFooterElement =
	| { type: 'text'; content: string }
	| { type: 'title' } // Book title
	| { type: 'chapter' } // Current chapter name
	| { type: 'section' } // Current section name
	| { type: 'author' } // Author name
	| { type: 'page' } // Page number
	| { type: 'custom'; latex: string }; // Custom LaTeX

export interface PageHeaderFooter {
	left: HeaderFooterElement[];
	center: HeaderFooterElement[];
	right: HeaderFooterElement[];
}

export interface HeaderFooterSettings {
	preset: 'none' | 'book-lr' | 'book-center' | 'academic' | 'minimal' | 'custom';

	// Custom configuration (used when preset = 'custom')
	leftPage: PageHeaderFooter; // Even page numbers
	rightPage: PageHeaderFooter; // Odd page numbers

	// Styling
	headerRule: {
		enabled: boolean;
		width: string; // e.g., "0pt", "0.4pt", "1pt"
		style: 'solid' | 'dotted' | 'dashed';
	};
	footerRule: {
		enabled: boolean;
		width: string;
		style: 'solid' | 'dotted' | 'dashed';
	};

	// Text styling
	headerFont: {
		family?: string; // Defaults to body font
		size: 'tiny' | 'small' | 'normal' | 'large';
		style: 'normal' | 'italic' | 'bold' | 'bolditalic';
	};
	footerFont: {
		family?: string;
		size: 'tiny' | 'small' | 'normal' | 'large';
		style: 'normal' | 'italic' | 'bold' | 'bolditalic';
	};

	// First page of chapters
	firstPageStyle: 'plain' | 'empty' | 'fancy'; // 'plain' = page number only, 'empty' = nothing
}

// ============================================
// CHAPTER & SECTION STYLING
// ============================================

export type ChapterFormat = 'display' | 'inline' | 'centered' | 'drop' | 'block';

export interface ChapterStyling {
	// Display and formatting
	display?: 'default' | 'hang' | 'display' | 'block' | 'custom'; // How chapter titles appear
	fontSize?: string; // e.g., "huge", "LARGE", "Large", "large", "normalsize"
	bold?: boolean; // Display chapter titles in bold
	uppercase?: boolean; // Convert chapter titles to uppercase
	align?: 'left' | 'center' | 'right'; // Title alignment

	// Spacing
	spaceBefore?: string; // e.g., "50pt", "2cm"
	spaceAfter?: string; // e.g., "40pt", "1.5cm"

	// Chapter numbering
	numbered?: boolean;
	numberFormat?: 'arabic' | 'roman' | 'Roman' | 'alpha' | 'Alpha' | 'none'; // Numbering style
	prefix?: string; // e.g., "Chapter ", "Part "

	// Page breaks
	newPage?: boolean; // Start each chapter on new page
	rightPage?: boolean; // Start on right-hand (odd) pages only

	// Legacy/Advanced properties (for compatibility)
	format?: ChapterFormat;
	size?: 'Huge' | 'huge' | 'LARGE' | 'Large' | 'large' | 'normalsize';
	weight?: 'normal' | 'bold';
	style?: 'upright' | 'italic' | 'smallcaps';
	alignment?: 'left' | 'center' | 'right';
	numberStyle?: 'arabic' | 'roman' | 'Roman' | 'words' | 'none';
	numberPosition?: 'before' | 'above' | 'none';
	numberSeparator?: string;
	clearPage?: boolean;
	runningHeader?: boolean;
	titleCase?: boolean;
	dropCaps?: {
		enabled: boolean;
		lines: number;
		font?: string;
	};
}

export interface SectionStyling {
	size: 'LARGE' | 'Large' | 'large' | 'normalsize';
	weight: 'normal' | 'bold';
	style: 'upright' | 'italic' | 'smallcaps';
	alignment: 'left' | 'center' | 'right';
	spaceBefore: string;
	spaceAfter: string;
	numbered: boolean;
	runningHeader: boolean;
}

export interface SubsectionStyling {
	size: 'Large' | 'large' | 'normalsize';
	weight: 'normal' | 'bold';
	style: 'upright' | 'italic' | 'smallcaps';
	alignment: 'left' | 'center' | 'right';
	spaceBefore: string;
	spaceAfter: string;
	numbered: boolean;
}

// ============================================
// TABLE OF CONTENTS
// ============================================

export interface TableOfContentsSettings {
	enabled: boolean;
	depth: number; // 1 = chapters only, 2 = chapters + sections, 3 = + subsections
	title: string; // e.g., "Contents", "Table of Contents"

	// Styling
	titleSize: 'Huge' | 'huge' | 'LARGE' | 'Large';
	titleAlignment: 'left' | 'center' | 'right';

	// Entries
	dotLeaders: boolean; // Dotted lines between entry and page number
	chapterBold: boolean; // Bold chapter entries
	indentWidth: string; // e.g., "1.5em" - indent per level

	// Spacing
	beforeSkip: string; // Space before TOC title
	afterSkip: string; // Space after TOC title
	entrySpacing: string; // Space between entries

	// Advanced
	showPageNumbers: boolean;
	addToToc?: boolean; // Add "Table of Contents" to table of contents
	hyperlinks: boolean; // Make TOC entries clickable (PDF only)
}

// ============================================
// LISTS & ENUMERATIONS
// ============================================

export interface ListSettings {
	// Simple UI properties
	bulletStyle?: string; // Bullet symbol for unordered lists (e.g., "•", "◦", "▪")
	itemSpacing?: 'compact' | 'normal' | 'relaxed'; // Spacing between list items
	indent?: boolean; // Indent list items from margin

	// Advanced spacing
	itemSep?: string; // Vertical space between items
	parsep?: string; // Vertical space between paragraphs within items
	topsep?: string; // Vertical space before/after list

	// Indentation details
	leftMargin?: string; // Left margin for list
	labelWidth?: string; // Width of label (bullet/number)
	labelSep?: string; // Space between label and text

	// Bullets (unordered lists)
	bulletLevel1?: 'bullet' | 'dash' | 'asterisk' | 'custom';
	bulletLevel2?: 'bullet' | 'dash' | 'asterisk' | 'custom';
	bulletLevel3?: 'bullet' | 'dash' | 'asterisk' | 'custom';
	customBullets?: string[]; // Custom symbols

	// Numbering (ordered lists)
	numberLevel1?: 'arabic' | 'roman' | 'Roman' | 'alph' | 'Alph';
	numberLevel2?: 'arabic' | 'roman' | 'Roman' | 'alph' | 'Alph';
	numberLevel3?: 'arabic' | 'roman' | 'Roman' | 'alph' | 'Alph';

	// Compact mode
	compact?: boolean; // Tight spacing for lists
}

// ============================================
// IMAGES & FIGURES
// ============================================

export interface ImageSettings {
	// Simple UI properties
	defaultWidth?: string; // e.g., "0.8\\textwidth", "5in"
	align?: 'left' | 'center' | 'right'; // Image alignment
	captionPosition?: 'above' | 'below'; // Caption location
	keepInPlace?: boolean; // Prevent LaTeX from floating images

	// Advanced sizing
	maxWidth?: string; // Maximum width
	maxHeight?: string; // Maximum height
	keepAspectRatio?: boolean;

	// Placement
	defaultPlacement?: string; // LaTeX placement specifiers: 'htbp', 'H', etc.
	centerImages?: boolean; // Legacy property

	// Captions
	captionFont?: {
		size: 'tiny' | 'small' | 'normalsize';
		weight: 'normal' | 'bold';
		style: 'normal' | 'italic';
	};
	captionAlignment?: 'left' | 'center' | 'right' | 'justify';
	captionSeparator?: string; // Between label and caption text

	// Labels
	figurePrefix?: string; // e.g., "Figure", "Fig.", "Illustration"
	showFigureNumber?: boolean;

	// Advanced
	floatBarrier?: boolean; // Prevent figures from floating past sections
	separatorLine?: boolean; // Line above/below figures
}

// ============================================
// TABLES
// ============================================

export interface TableSettings {
	// Simple UI properties
	style?: 'default' | 'booktabs' | 'grid' | 'minimal'; // Visual style
	headerStyle?: 'bold' | 'normal' | 'italic'; // Header row formatting
	zebraStriping?: boolean; // Alternate row background colors

	// Default styling
	defaultAlignment?: 'left' | 'center' | 'right';
	headerBackground?: boolean; // Shade header row
	alternateRowColors?: boolean; // Legacy name for zebraStriping

	// Borders
	borders?: 'none' | 'all' | 'horizontal' | 'vertical' | 'outer';
	borderWidth?: string; // e.g., "0.4pt", "1pt"

	// Spacing
	cellPadding?: string; // Padding inside cells
	rowHeight?: string; // Minimum row height
	columnSep?: string; // Space between columns

	// Captions
	captionPosition?: 'above' | 'below';
	captionFont?: {
		size: 'tiny' | 'small' | 'normalsize';
		weight: 'normal' | 'bold';
		style: 'normal' | 'italic';
	};

	// Advanced
	longTable?: boolean; // Allow tables to break across pages
	tablePrefix?: string; // e.g., "Table", "Tab."
}

// ============================================
// CODE BLOCKS
// ============================================

export interface CodeBlockSettings {
	// Simple UI properties
	highlighting?: boolean; // Enable syntax highlighting (alias for syntaxHighlighting)
	lineNumbers?: boolean; // Show line numbers
	fontSize?: string; // e.g., "footnotesize", "small", "normalsize", "large"
	background?: boolean; // Add background shading

	// Styling
	backgroundColor?: string; // e.g., "gray!10", "#f5f5f5"
	borderColor?: string;
	borderWidth?: string;
	borderRadius?: string;

	// Font
	font?: string; // Monospace font

	// Layout
	padding?: string;
	lineNumberSep?: string; // Space between numbers and code

	// Breaking
	breakLines?: boolean; // Break long lines
	breakIndent?: string; // Indentation for broken lines

	// Syntax highlighting
	syntaxHighlighting?: boolean; // Legacy name for highlighting
	highlightTheme?: string; // e.g., "tango", "kate", "monochrome"
}

// ============================================
// BIBLIOGRAPHY
// ============================================

export interface BibliographySettings {
	// Style
	style: string; // CSL file path or built-in style

	// Behavior
	linkCitations: boolean; // Make citations clickable
	suppressBibliography: boolean; // Don't print bibliography section
	natbib: boolean; // Use natbib package
	biblatex: boolean; // Use biblatex package

	// Formatting
	title: string; // e.g., "Bibliography", "References", "Works Cited"
	titleSize: 'LARGE' | 'Large' | 'large';

	// Spacing
	itemSep: string; // Space between entries
	indent: string; // Hanging indent

	// Advanced
	sorting: 'none' | 'nty' | 'nyt' | 'nyvt'; // name-title-year, etc.
	maxNames: number; // Max authors before "et al."
	minNames: number; // Min authors to show when truncating
}

// ============================================
// FRONT MATTER
// ============================================

export interface FrontMatterSettings {
	// Title page
	titlePage: {
		enabled: boolean;
		titleSize: string; // Font size for title
		titleSpacing: string; // Letter spacing
		titleFont?: string; // Different font for title
		subtitleSize: string;
		authorSize: string;
		dateSize: string;
		layout: 'centered' | 'traditional' | 'modern' | 'custom';
		customLayout?: string; // Custom LaTeX
	};

	// Copyright page
	copyrightPage: {
		enabled: boolean;
		text?: string; // Copyright notice
		isbn?: string;
		publisher?: string;
		edition?: string;
		customContent?: string;
	};

	// Dedication
	dedication: {
		enabled: boolean;
		text?: string;
		style: 'centered' | 'right' | 'italic';
	};

	// Epigraph (quote before content)
	epigraph: {
		enabled: boolean;
		quote?: string;
		attribution?: string;
		style: 'centered' | 'right' | 'block';
	};

	// Abstract (for academic)
	abstract: {
		enabled: boolean;
		title: string;
		alignment: 'left' | 'center' | 'justify';
	};
}

// ============================================
// MAIN CONFIGURATION INTERFACE
// ============================================

export interface TemplateConfiguration {
	// Metadata
	id: string;
	name: string;
	description?: string;
	category?: 'fiction' | 'non-fiction' | 'academic' | 'technical' | 'special' | 'custom';

	// Core settings
	document: DocumentSettings;
	typography: TypographySettings;
	geometry?: PageGeometry; // Optional, can use trimSize instead
	headersFooters: HeaderFooterSettings;

	// Content styling
	chapters: ChapterStyling;
	sections: SectionStyling;
	subsections: SubsectionStyling;

	// Additional elements
	tableOfContents: TableOfContentsSettings;
	lists: ListSettings;
	images: ImageSettings;
	tables: TableSettings;
	codeBlocks: CodeBlockSettings;
	bibliography: BibliographySettings;
	frontMatter: FrontMatterSettings;

	// Expert overrides
	customYAML?: string; // Additional YAML to merge
	customHeaderIncludes?: string; // Additional LaTeX to append

	// Expert mode
	expertMode?: {
		yamlOverride?: boolean; // Is YAML manually edited?
		latexOverride?: boolean; // Is LaTeX manually edited?
		customYAML?: string; // User's YAML (when overridden)
		customLaTeX?: string; // User's LaTeX (when overridden)
		lastSyncDirection?: 'ui' | 'yaml' | 'latex';
	};

	// Metadata
	createdAt: number;
	modifiedAt: number;
	isBuiltIn: boolean;
	author?: string;
}

// ============================================
// DEFAULT CONFIGURATIONS
// ============================================

export const DEFAULT_TYPOGRAPHY: TypographySettings = {
	bodyFont: 'DejaVu Serif',
	sansFont: 'DejaVu Sans',
	monoFont: 'DejaVu Sans Mono',
	fontSize: '11pt',
	lineSpacing: 1.15,
	paragraphIndent: '0.25in',
	paragraphSpacing: '0pt',
	firstLineIndent: true,
	microtype: true,
	widowPenalty: 10000,
	clubPenalty: 10000,
	hyphenPenalty: 500,
	tolerance: 2000,
	emergencyStretch: '3em',
	raggedBottom: true,
	hyphenation: true,
	leftHyphenMin: 3,
	rightHyphenMin: 3,
	language: 'en-US',
};

export const DEFAULT_DOCUMENT: DocumentSettings = {
	documentClass: 'book',
	classOptions: ['openany'],
	pageNumbering: true,
	pageNumberStyle: 'arabic',
	pageNumberPosition: 'footer',
};

export const DEFAULT_CHAPTER: ChapterStyling = {
	format: 'display',
	size: 'Huge',
	weight: 'bold',
	style: 'upright',
	alignment: 'center',
	spaceBefore: '50pt',
	spaceAfter: '40pt',
	numbered: false,
	numberStyle: 'arabic',
	numberPosition: 'before',
	numberSeparator: '. ',
	newPage: true,
	clearPage: false,
	runningHeader: true,
	titleCase: false,
};

export const DEFAULT_HEADERS_FOOTERS: HeaderFooterSettings = {
	preset: 'book-lr',
	leftPage: {
		left: [{ type: 'title' }],
		center: [],
		right: [],
	},
	rightPage: {
		left: [],
		center: [],
		right: [{ type: 'chapter' }],
	},
	headerRule: {
		enabled: true,
		width: '0.4pt',
		style: 'solid',
	},
	footerRule: {
		enabled: false,
		width: '0pt',
		style: 'solid',
	},
	headerFont: {
		size: 'small',
		style: 'italic',
	},
	footerFont: {
		size: 'normal',
		style: 'normal',
	},
	firstPageStyle: 'plain',
};

/**
 * Create a default template configuration
 */
export function createDefaultTemplate(): TemplateConfiguration {
	return {
		id: `template-${Date.now()}`,
		name: 'Untitled Template',
		category: 'custom',
		document: { ...DEFAULT_DOCUMENT },
		typography: { ...DEFAULT_TYPOGRAPHY },
		headersFooters: JSON.parse(JSON.stringify(DEFAULT_HEADERS_FOOTERS)),
		chapters: { ...DEFAULT_CHAPTER },
		sections: {
			size: 'Large',
			weight: 'bold',
			style: 'upright',
			alignment: 'left',
			spaceBefore: '12pt',
			spaceAfter: '6pt',
			numbered: false,
			runningHeader: false,
		},
		subsections: {
			size: 'large',
			weight: 'bold',
			style: 'upright',
			alignment: 'left',
			spaceBefore: '10pt',
			spaceAfter: '4pt',
			numbered: false,
		},
		tableOfContents: {
			enabled: true,
			depth: 1,
			title: 'Table of Contents',
			titleSize: 'LARGE',
			titleAlignment: 'center',
			dotLeaders: true,
			chapterBold: true,
			indentWidth: '1.5em',
			beforeSkip: '10pt',
			afterSkip: '20pt',
			entrySpacing: '5pt',
			showPageNumbers: true,
			hyperlinks: true,
		},
		lists: {
			itemSep: '0pt',
			parsep: '0pt',
			topsep: '0pt',
			leftMargin: '2em',
			labelWidth: '1.5em',
			labelSep: '0.5em',
			bulletLevel1: 'bullet',
			bulletLevel2: 'dash',
			bulletLevel3: 'asterisk',
			numberLevel1: 'arabic',
			numberLevel2: 'alph',
			numberLevel3: 'roman',
			compact: true,
		},
		images: {
			defaultWidth: '0.9\\textwidth',
			maxWidth: '\\textwidth',
			maxHeight: '0.9\\textheight',
			keepAspectRatio: true,
			defaultPlacement: 'htbp',
			centerImages: true,
			captionPosition: 'below',
			captionFont: {
				size: 'small',
				weight: 'bold',
				style: 'normal',
			},
			captionAlignment: 'center',
			captionSeparator: ': ',
			figurePrefix: 'Figure',
			showFigureNumber: false,
			floatBarrier: false,
			separatorLine: false,
		},
		tables: {
			defaultAlignment: 'left',
			headerBackground: false,
			alternateRowColors: false,
			borders: 'horizontal',
			borderWidth: '0.4pt',
			cellPadding: '4pt',
			rowHeight: 'auto',
			columnSep: '6pt',
			captionPosition: 'above',
			captionFont: {
				size: 'small',
				weight: 'bold',
				style: 'normal',
			},
			longTable: true,
			tablePrefix: 'Table',
		},
		codeBlocks: {
			backgroundColor: 'gray!10',
			font: 'DejaVu Sans Mono',
			fontSize: '\\small',
			padding: '6pt',
			lineNumbers: false,
			lineNumberSep: '6pt',
			breakLines: true,
			breakIndent: '1em',
			syntaxHighlighting: true,
			highlightTheme: 'tango',
		},
		bibliography: {
			style: 'chicago-author-date',
			linkCitations: true,
			suppressBibliography: false,
			natbib: false,
			biblatex: false,
			title: 'Bibliography',
			titleSize: 'LARGE',
			itemSep: '0.5em',
			indent: '1.5em',
			sorting: 'nty',
			maxNames: 10,
			minNames: 1,
		},
		frontMatter: {
			titlePage: {
				enabled: true,
				titleSize: '60pt',
				titleSpacing: '5.0',
				subtitleSize: 'Large',
				authorSize: 'Large',
				dateSize: 'large',
				layout: 'centered',
			},
			copyrightPage: {
				enabled: false,
			},
			dedication: {
				enabled: false,
				style: 'centered',
			},
			epigraph: {
				enabled: false,
				style: 'right',
			},
			abstract: {
				enabled: false,
				title: 'Abstract',
				alignment: 'justify',
			},
		},
		createdAt: Date.now(),
		modifiedAt: Date.now(),
		isBuiltIn: false,
	};
}
