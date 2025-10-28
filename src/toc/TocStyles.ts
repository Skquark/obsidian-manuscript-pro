/**
 * Table of Contents Style Templates
 * Pre-configured professional ToC styles for different publishing contexts
 */

import type { TocStyleTemplate, TocStyle } from './TocInterfaces';

export const TOC_STYLE_TEMPLATES: TocStyleTemplate[] = [
	{
		id: 'print-book',
		name: 'Print Book',
		description: 'Traditional print book ToC with page numbers and leader dots',
		config: {
			includeDepth: 2,
			includeFrontMatter: true,
			includeBackMatter: true,
			includePartDividers: true,
			style: 'print-book',
			showPageNumbers: true,
			useLeaderDots: true,
			indentSublevels: true,
			numberChapters: true,
			numberSections: false,
			chapterPrefix: 'Chapter',
			useRomanNumerals: true,
			createHyperlinks: false,
		},
		markdownTemplate: `# Table of Contents

{{FRONT_MATTER}}

{{PARTS}}

{{BACK_MATTER}}`,
	},
	{
		id: 'digital-book',
		name: 'Digital Book (EPUB/Kindle)',
		description: 'Hyperlinked ToC for ebooks without page numbers',
		config: {
			includeDepth: 3,
			includeFrontMatter: true,
			includeBackMatter: true,
			includePartDividers: true,
			style: 'digital-book',
			showPageNumbers: false,
			useLeaderDots: false,
			indentSublevels: true,
			numberChapters: true,
			numberSections: false,
			chapterPrefix: 'Chapter',
			useRomanNumerals: false,
			createHyperlinks: true,
		},
		markdownTemplate: `# Contents

{{FRONT_MATTER}}

{{PARTS}}

{{BACK_MATTER}}`,
	},
	{
		id: 'academic',
		name: 'Academic Thesis',
		description: 'Detailed hierarchical ToC with section numbering',
		config: {
			includeDepth: 4,
			includeFrontMatter: true,
			includeBackMatter: true,
			includePartDividers: false,
			style: 'academic',
			showPageNumbers: true,
			useLeaderDots: true,
			indentSublevels: true,
			numberChapters: true,
			numberSections: true,
			chapterPrefix: 'Chapter',
			useRomanNumerals: true,
			createHyperlinks: false,
		},
		markdownTemplate: `# Table of Contents

{{FRONT_MATTER}}

{{PARTS}}

{{BACK_MATTER}}`,
	},
	{
		id: 'simple',
		name: 'Simple',
		description: 'Minimal flat list of chapters only',
		config: {
			includeDepth: 1,
			includeFrontMatter: false,
			includeBackMatter: false,
			includePartDividers: false,
			style: 'simple',
			showPageNumbers: false,
			useLeaderDots: false,
			indentSublevels: false,
			numberChapters: false,
			numberSections: false,
			chapterPrefix: '',
			useRomanNumerals: false,
			createHyperlinks: true,
		},
		markdownTemplate: `# Contents

{{PARTS}}`,
	},
	{
		id: 'detailed',
		name: 'Detailed',
		description: 'Comprehensive ToC with all sections and subsections',
		config: {
			includeDepth: 4,
			includeFrontMatter: true,
			includeBackMatter: true,
			includePartDividers: true,
			style: 'detailed',
			showPageNumbers: true,
			useLeaderDots: true,
			indentSublevels: true,
			numberChapters: true,
			numberSections: true,
			chapterPrefix: '',
			useRomanNumerals: true,
			createHyperlinks: true,
		},
		markdownTemplate: `# Table of Contents

{{FRONT_MATTER}}

{{PARTS}}

{{BACK_MATTER}}`,
	},
];

/**
 * Get style template by ID
 */
export function getTocStyleTemplate(styleId: TocStyle): TocStyleTemplate {
	return TOC_STYLE_TEMPLATES.find((t) => t.id === styleId) || TOC_STYLE_TEMPLATES[0];
}

/**
 * Get all available style templates
 */
export function getAllTocStyleTemplates(): TocStyleTemplate[] {
	return TOC_STYLE_TEMPLATES;
}
