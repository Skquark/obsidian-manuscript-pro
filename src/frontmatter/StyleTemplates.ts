/**
 * Front Matter Style Templates
 * Pre-defined professional styles for different publishing contexts
 */

import type { StyleTemplate } from './FrontMatterInterfaces';

export const STYLE_TEMPLATES: StyleTemplate[] = [
	{
		name: 'Classic',
		id: 'classic',
		description: 'Traditional centered layout, perfect for literary fiction and classic works',
		latex: {
			titlePageTemplate: `\\begin{titlepage}
\\centering
\\vspace*{2cm}

{\\Huge \\textbf{{{TITLE}}}\\par}
{{SUBTITLE}}
\\vspace{2cm}

{\\Large {{AUTHOR}}\\par}
{{CREDENTIALS}}
\\vfill

{{PUBLISHER}}
{{PUBLISHER_LOCATION}}
\\end{titlepage}`,
			copyrightPageTemplate: `\\thispagestyle{empty}
\\vspace*{\\fill}

\\begin{flushleft}
Copyright \\copyright\\ {{YEAR}} {{HOLDER}}

{{ISBN}}
{{EDITION}}

{{ADDITIONAL_NOTICES}}

{{PUBLISHER}}

{{PRINTED_IN}}

{{DISCLAIMER}}
\\end{flushleft}

\\clearpage`,
			fonts: {
				title: 'serif',
				author: 'serif',
				body: 'serif',
			},
			spacing: {
				titleSize: '\\Huge',
				subtitleSize: '\\large',
				authorSize: '\\Large',
			},
			alignment: 'center',
		},
		markdown: {
			useHorizontalRules: false,
			centerText: true,
			blankLinesBetweenSections: 3,
		},
	},
	{
		name: 'Modern',
		id: 'modern',
		description: 'Bold asymmetric design, ideal for contemporary fiction and creative non-fiction',
		latex: {
			titlePageTemplate: `\\begin{titlepage}
\\raggedright
\\vspace*{1cm}

{\\fontsize{48}{52}\\selectfont \\textbf{{{TITLE}}}\\par}
\\vspace{0.5cm}
{{SUBTITLE}}
\\vspace{2cm}

{\\Large \\textsc{{{AUTHOR}}}\\par}
{{CREDENTIALS}}
\\vfill

{\\large {{PUBLISHER}}\\par}
{{PUBLISHER_LOCATION}}
\\end{titlepage}`,
			copyrightPageTemplate: `\\thispagestyle{empty}
\\vspace*{\\fill}

\\noindent
\\textbf{Copyright} \\copyright\\ {{YEAR}} {{HOLDER}}

\\vspace{1em}
{{ISBN}}

{{EDITION}}

\\vspace{1em}
{{ADDITIONAL_NOTICES}}

\\vspace{1em}
{{PUBLISHER}}

{{DISCLAIMER}}

\\clearpage`,
			fonts: {
				title: 'sans-serif',
				author: 'sans-serif',
				body: 'serif',
			},
			spacing: {
				titleSize: '\\fontsize{48}{52}\\selectfont',
				subtitleSize: '\\large',
				authorSize: '\\Large',
			},
			alignment: 'left',
		},
		markdown: {
			useHorizontalRules: true,
			centerText: false,
			blankLinesBetweenSections: 2,
		},
	},
	{
		name: 'Minimalist',
		id: 'minimalist',
		description: 'Clean and spacious, perfect for poetry, essays, and design-conscious works',
		latex: {
			titlePageTemplate: `\\begin{titlepage}
\\centering
\\vspace*{4cm}

{\\huge {{TITLE}}\\par}
{{SUBTITLE}}
\\vspace{8cm}

{\\normalsize {{AUTHOR}}\\par}
\\vfill

{\\small {{PUBLISHER}}\\par}
\\end{titlepage}`,
			copyrightPageTemplate: `\\thispagestyle{empty}
\\vspace*{\\fill}

\\centering
\\small

Copyright \\copyright\\ {{YEAR}} {{HOLDER}}

{{ISBN}}

{{ADDITIONAL_NOTICES}}

\\vspace{2em}
{{PUBLISHER}}

\\clearpage`,
			fonts: {
				title: 'serif',
				author: 'serif',
				body: 'serif',
			},
			spacing: {
				titleSize: '\\huge',
				subtitleSize: '\\normalsize',
				authorSize: '\\normalsize',
			},
			alignment: 'center',
		},
		markdown: {
			useHorizontalRules: false,
			centerText: true,
			blankLinesBetweenSections: 5,
		},
	},
	{
		name: 'Academic',
		id: 'academic',
		description: 'Formal and structured, designed for theses, dissertations, and academic publications',
		latex: {
			titlePageTemplate: `\\begin{titlepage}
\\centering

\\vspace*{2cm}
{\\Large \\textsc{{{INSTITUTION}}}\\par}
\\vspace{1cm}
{\\large \\textsc{{{DEPARTMENT}}}\\par}

\\vspace{3cm}
{\\LARGE \\textbf{{{TITLE}}}\\par}
\\vspace{0.5cm}
{{SUBTITLE}}

\\vspace{2cm}
{\\large A {{DOCUMENT_TYPE}} presented by\\par}
\\vspace{0.5cm}
{\\Large {{AUTHOR}}\\par}
{{CREDENTIALS}}

\\vspace{2cm}
{\\large In partial fulfillment of the requirements\\par}
{\\large for the degree of {{DEGREE}}\\par}

\\vfill
{{MONTH}} {{YEAR}}
\\end{titlepage}`,
			copyrightPageTemplate: `\\thispagestyle{empty}
\\vspace*{\\fill}

\\noindent
\\copyright\\ Copyright by {{AUTHOR}}, {{YEAR}}

\\vspace{1em}
\\noindent
{{RIGHTS_STATEMENT}}

\\vspace{2em}
\\noindent
{{ISBN}}

\\vspace{1em}
\\noindent
{{CATALOGING_DATA}}

\\clearpage`,
			fonts: {
				title: 'serif',
				author: 'serif',
				body: 'serif',
			},
			spacing: {
				titleSize: '\\LARGE',
				subtitleSize: '\\large',
				authorSize: '\\Large',
			},
			alignment: 'center',
			useGeometry: true,
		},
		markdown: {
			useHorizontalRules: true,
			centerText: true,
			blankLinesBetweenSections: 2,
		},
	},
];

/**
 * Get style template by ID
 */
export function getStyleTemplate(styleId: string): StyleTemplate {
	return STYLE_TEMPLATES.find((t) => t.id === styleId) || STYLE_TEMPLATES[0];
}

/**
 * Get all available style templates
 */
export function getAllStyleTemplates(): StyleTemplate[] {
	return STYLE_TEMPLATES;
}
