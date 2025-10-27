/**
 * LaTeX Generator
 * Generates LaTeX header-includes from TemplateConfiguration
 *
 * This handles all the advanced formatting that can't be expressed in simple YAML:
 * - Headers and footers (fancyhdr)
 * - Chapter and section styling (titlesec)
 * - Table of contents styling (tocloft)
 * - Advanced typography (microtype, penalties)
 * - Custom title page layouts
 * - And much more...
 */

import type { TemplateConfiguration, HeaderFooterElement, PageHeaderFooter } from './TemplateConfiguration';

export class LaTeXGenerator {
	/**
	 * Generate complete header-includes LaTeX from template configuration
	 */
	generate(config: TemplateConfiguration): string {
		// Check for expert mode LaTeX override
		if (config.expertMode?.latexOverride && config.expertMode?.customLaTeX) {
			return config.expertMode.customLaTeX;
		}

		const sections: string[] = [];

		// Package imports
		sections.push(this.generatePackages(config));

		// Typography settings
		sections.push(this.generateTypographySettings(config));

		// Headers and footers
		if (config.headersFooters.preset !== 'none') {
			sections.push(this.generateHeadersFooters(config));
		}

		// Chapter and section styling
		sections.push(this.generateTitleFormatting(config));

		// Table of contents styling
		if (config.tableOfContents.enabled) {
			sections.push(this.generateTOCStyling(config));
		}

		// List styling
		sections.push(this.generateListStyling(config));

		// Image settings
		sections.push(this.generateImageSettings(config));

		// Code block styling
		sections.push(this.generateCodeBlockStyling(config));

		// Front matter (title page, etc.)
		if (config.frontMatter.titlePage.enabled) {
			sections.push(this.generateTitlePage(config));
		}

		// Custom header-includes override
		if (config.customHeaderIncludes) {
			sections.push('\n% Custom header includes');
			sections.push(config.customHeaderIncludes);
		}

		return sections.filter((s) => s.trim().length > 0).join('\n\n');
	}

	/**
	 * Generate package imports
	 */
	private generatePackages(config: TemplateConfiguration): string {
		const packages: string[] = [];

		// Always needed
		packages.push('\\usepackage{graphicx}');
		packages.push('\\usepackage{array}');

		// Headers/footers
		if (config.headersFooters.preset !== 'none') {
			packages.push('\\usepackage{fancyhdr}');
		}

		// Title formatting
		packages.push('\\usepackage{titlesec}');

		// TOC formatting
		if (config.tableOfContents.enabled) {
			packages.push('\\usepackage{tocloft}');
		}

		// List formatting
		packages.push('\\usepackage{enumitem}');

		// Advanced typography
		if (config.typography.microtype) {
			packages.push('\\usepackage{microtype}');
		}

		// Captions
		packages.push('\\usepackage{caption}');

		// For better spacing
		packages.push('\\usepackage{needspace}');

		return packages.join('\n');
	}

	/**
	 * Generate typography settings
	 */
	private generateTypographySettings(config: TemplateConfiguration): string {
		const lines: string[] = ['% Typography settings'];

		// Paragraph indentation and spacing
		lines.push(`\\setlength{\\parindent}{${config.typography.paragraphIndent}}`);
		lines.push(`\\setlength{\\parskip}{${config.typography.paragraphSpacing}}`);

		// Emergency stretch for better line breaking
		lines.push(`\\setlength{\\emergencystretch}{${config.typography.emergencyStretch}}`);

		// Widow and orphan penalties
		lines.push(`\\widowpenalty=${config.typography.widowPenalty}`);
		lines.push(`\\clubpenalty=${config.typography.clubPenalty}`);

		// Hyphenation
		if (config.typography.hyphenation) {
			lines.push(`\\hyphenpenalty=${config.typography.hyphenPenalty}`);
			lines.push(`\\lefthyphenmin=${config.typography.leftHyphenMin}`);
			lines.push(`\\righthyphenmin=${config.typography.rightHyphenMin}`);
		} else {
			lines.push('\\hyphenpenalty=10000'); // Effectively disable hyphenation
		}

		// Line breaking tolerance
		lines.push(`\\tolerance=${config.typography.tolerance}`);

		// Ragged bottom (don't stretch vertical space)
		if (config.typography.raggedBottom) {
			lines.push('\\raggedbottom');
		} else {
			lines.push('\\flushbottom');
		}

		// First line indent after headings
		if (config.typography.firstLineIndent) {
			lines.push('\\makeatletter');
			lines.push('\\let\\@afterindenttrue\\@afterindentfalse');
			lines.push('\\makeatother');
		}

		return lines.join('\n');
	}

	/**
	 * Generate headers and footers using fancyhdr
	 */
	private generateHeadersFooters(config: TemplateConfiguration): string {
		const lines: string[] = ['% Headers and footers'];

		// Apply preset if not custom
		if (config.headersFooters.preset !== 'custom') {
			return this.generateHeaderFooterPreset(config);
		}

		// Custom headers/footers
		lines.push('\\pagestyle{fancy}');
		lines.push('\\fancyhf{}'); // Clear all

		// Left page (even) headers
		const leftHeader = this.formatHeaderFooter(config.headersFooters.leftPage);
		if (leftHeader.left) lines.push(`\\fancyhead[LE]{${leftHeader.left}}`);
		if (leftHeader.center) lines.push(`\\fancyhead[CE]{${leftHeader.center}}`);
		if (leftHeader.right) lines.push(`\\fancyhead[RE]{${leftHeader.right}}`);

		// Right page (odd) headers
		const rightHeader = this.formatHeaderFooter(config.headersFooters.rightPage);
		if (rightHeader.left) lines.push(`\\fancyhead[LO]{${rightHeader.left}}`);
		if (rightHeader.center) lines.push(`\\fancyhead[CO]{${rightHeader.center}}`);
		if (rightHeader.right) lines.push(`\\fancyhead[RO]{${rightHeader.right}}`);

		// Footers (usually just page numbers)
		lines.push('\\fancyfoot[C]{\\thepage}');

		// Rules
		if (config.headersFooters.headerRule.enabled) {
			lines.push(`\\renewcommand{\\headrulewidth}{${config.headersFooters.headerRule.width}}`);
		} else {
			lines.push('\\renewcommand{\\headrulewidth}{0pt}');
		}

		if (config.headersFooters.footerRule.enabled) {
			lines.push(`\\renewcommand{\\footrulewidth}{${config.headersFooters.footerRule.width}}`);
		} else {
			lines.push('\\renewcommand{\\footrulewidth}{0pt}');
		}

		// Plain style for chapter first pages
		lines.push('\\fancypagestyle{plain}{%');
		lines.push('  \\fancyhf{}%');
		if (config.headersFooters.firstPageStyle === 'empty') {
			lines.push('  % Empty - no headers or footers');
		} else {
			lines.push('  \\fancyfoot[C]{\\thepage}%');
		}
		lines.push('  \\renewcommand{\\headrulewidth}{0pt}%');
		lines.push('}');

		return lines.join('\n');
	}

	/**
	 * Generate preset header/footer styles
	 */
	private generateHeaderFooterPreset(config: TemplateConfiguration): string {
		const lines: string[] = ['% Headers and footers (preset)'];
		lines.push('\\pagestyle{fancy}');
		lines.push('\\fancyhf{}');

		const fontStyle = this.getFontStyle(config.headersFooters.headerFont);

		switch (config.headersFooters.preset) {
			case 'book-lr':
				// Book style: Title on left pages, chapter on right pages
				lines.push(`\\fancyhead[LE]{${fontStyle}\\nouppercase{\\leftmark}}`); // Book title
				lines.push(`\\fancyhead[RO]{${fontStyle}\\nouppercase{\\rightmark}}`); // Chapter
				lines.push('\\fancyfoot[C]{\\thepage}');
				break;

			case 'book-center':
				// Centered style
				lines.push(`\\fancyhead[C]{${fontStyle}\\nouppercase{\\rightmark}}`);
				lines.push('\\fancyfoot[C]{\\thepage}');
				break;

			case 'academic':
				// Academic: Author on left, title on right
				lines.push(`\\fancyhead[L]{${fontStyle}\\@author}`);
				lines.push(`\\fancyhead[R]{${fontStyle}\\@title}`);
				lines.push('\\fancyfoot[C]{\\thepage}');
				break;

			case 'minimal':
				// Just page numbers
				lines.push('\\fancyfoot[C]{\\thepage}');
				break;
		}

		// Header rule
		if (config.headersFooters.headerRule.enabled) {
			lines.push(`\\renewcommand{\\headrulewidth}{${config.headersFooters.headerRule.width}}`);
		} else {
			lines.push('\\renewcommand{\\headrulewidth}{0pt}');
		}

		// Plain style for chapter pages
		lines.push('\\fancypagestyle{plain}{%');
		lines.push('  \\fancyhf{}%');
		lines.push('  \\fancyfoot[C]{\\thepage}%');
		lines.push('  \\renewcommand{\\headrulewidth}{0pt}%');
		lines.push('}');

		return lines.join('\n');
	}

	/**
	 * Format header/footer elements
	 */
	private formatHeaderFooter(header: PageHeaderFooter): { left?: string; center?: string; right?: string } {
		const result: { left?: string; center?: string; right?: string } = {};

		if (header.left.length > 0) {
			result.left = this.formatElements(header.left);
		}
		if (header.center.length > 0) {
			result.center = this.formatElements(header.center);
		}
		if (header.right.length > 0) {
			result.right = this.formatElements(header.right);
		}

		return result;
	}

	/**
	 * Format array of header/footer elements
	 */
	private formatElements(elements: HeaderFooterElement[]): string {
		return elements
			.map((el) => {
				switch (el.type) {
					case 'text':
						return el.content;
					case 'title':
						return '\\@title';
					case 'chapter':
						return '\\leftmark';
					case 'section':
						return '\\rightmark';
					case 'author':
						return '\\@author';
					case 'page':
						return '\\thepage';
					case 'custom':
						return el.latex || '';
					default:
						return '';
				}
			})
			.join(' ');
	}

	/**
	 * Generate chapter and section title formatting using titlesec
	 */
	private generateTitleFormatting(config: TemplateConfiguration): string {
		const lines: string[] = ['% Chapter and section formatting'];

		// Chapter formatting
		const chapterSize = `\\${config.chapters.size}`;
		const chapterWeight = config.chapters.weight === 'bold' ? '\\bfseries' : '';
		const chapterStyle =
			config.chapters.style === 'italic' ? '\\itshape'
			: config.chapters.style === 'smallcaps' ? '\\scshape'
			: '';
		const chapterAlign =
			config.chapters.alignment === 'center' ? '\\centering'
			: config.chapters.alignment === 'right' ? '\\raggedleft'
			: '\\raggedright';

		// Determine format type
		let formatType = 'display';
		if (config.chapters.format === 'inline') formatType = 'hang';
		else if (config.chapters.format === 'block') formatType = 'block';
		else if (config.chapters.format === 'drop') formatType = 'drop';

		// Chapter title format
		lines.push(`\\titleformat{\\chapter}[${formatType}]`);
		lines.push(`  {\\normalfont${chapterSize}${chapterWeight}${chapterStyle}${chapterAlign}}`);
		lines.push(`  {${config.chapters.numbered ? '\\thechapter' : ''}}`);
		lines.push('  {0pt}');
		lines.push('  {}');

		// Chapter spacing
		lines.push(`\\titlespacing*{\\chapter}`);
		lines.push(`  {0pt}`);
		lines.push(`  {${config.chapters.spaceBefore}}`);
		lines.push(`  {${config.chapters.spaceAfter}}`);

		// Section formatting
		const sectionSize = `\\${config.sections.size}`;
		const sectionWeight = config.sections.weight === 'bold' ? '\\bfseries' : '';
		const sectionStyle = config.sections.style === 'italic' ? '\\itshape' : '';
		const sectionAlign =
			config.sections.alignment === 'center' ? '\\centering'
			: config.sections.alignment === 'right' ? '\\raggedleft'
			: '\\raggedright';

		lines.push(`\\titleformat{\\section}`);
		lines.push(`  {\\normalfont${sectionSize}${sectionWeight}${sectionStyle}${sectionAlign}}`);
		lines.push(`  {${config.sections.numbered ? '\\thesection' : ''}}`);
		lines.push('  {0pt}');
		lines.push('  {\\phantomsection}');

		lines.push(`\\titlespacing*{\\section}`);
		lines.push('  {0pt}');
		lines.push(`  {${config.sections.spaceBefore}}`);
		lines.push(`  {${config.sections.spaceAfter}}`);

		// Subsection formatting
		const subsectionSize = `\\${config.subsections.size}`;
		const subsectionWeight = config.subsections.weight === 'bold' ? '\\bfseries' : '';
		const subsectionStyle = config.subsections.style === 'italic' ? '\\itshape' : '';

		lines.push(`\\titleformat{\\subsection}`);
		lines.push(`  {\\normalfont${subsectionSize}${subsectionWeight}${subsectionStyle}}`);
		lines.push(`  {${config.subsections.numbered ? '\\thesubsection' : ''}}`);
		lines.push('  {0pt}');
		lines.push('  {\\phantomsection}');

		lines.push(`\\titlespacing*{\\subsection}`);
		lines.push('  {0pt}');
		lines.push(`  {${config.subsections.spaceBefore}}`);
		lines.push(`  {${config.subsections.spaceAfter}}`);

		// Assign page style to chapters
		lines.push(`\\assignpagestyle{\\chapter}{${config.headersFooters.firstPageStyle}}`);

		// New page behavior
		if (config.chapters.newPage) {
			if (config.chapters.clearPage) {
				lines.push('% Clear to odd page for chapters');
				lines.push('\\let\\originalchapter\\chapter');
				lines.push('\\renewcommand{\\chapter}{\\cleardoublepage\\originalchapter}');
			} else {
				lines.push('% Start chapters on new page');
				lines.push('\\let\\originalchapter\\chapter');
				lines.push('\\renewcommand{\\chapter}{\\clearpage\\originalchapter}');
			}
		}

		return lines.join('\n');
	}

	/**
	 * Generate table of contents styling using tocloft
	 */
	private generateTOCStyling(config: TemplateConfiguration): string {
		const lines: string[] = ['% Table of contents styling'];

		const toc = config.tableOfContents;

		// TOC title
		const titleSize = `\\${toc.titleSize}`;
		const titleAlign =
			toc.titleAlignment === 'center' ? '\\centering'
			: toc.titleAlignment === 'right' ? '\\raggedleft'
			: '\\raggedright';

		lines.push(`\\renewcommand{\\cfttoctitlefont}{${titleSize}\\bfseries${titleAlign}}`);
		lines.push(`\\renewcommand{\\cftbeforetoctitleskip}{${toc.beforeSkip}}`);
		lines.push(`\\renewcommand{\\cftaftertoctitleskip}{${toc.afterSkip}}`);

		// Chapter entries
		if (toc.chapterBold) {
			lines.push('\\renewcommand{\\cftchapfont}{\\bfseries}');
			lines.push('\\renewcommand{\\cftchappagefont}{\\bfseries}');
		}

		// Dot leaders
		if (toc.dotLeaders) {
			lines.push('\\renewcommand{\\cftchapleader}{\\cftdotfill{\\cftdotsep}}');
		} else {
			lines.push('\\renewcommand{\\cftchapleader}{\\hfill}');
		}

		// Entry spacing
		lines.push(`\\renewcommand{\\cftchapafterpnum}{\\vskip${toc.entrySpacing}}`);
		lines.push(`\\setlength{\\cftbeforechapskip}{${toc.entrySpacing}}`);

		// Indentation
		lines.push(`\\setlength{\\cftchapindent}{0pt}`);
		lines.push(`\\setlength{\\cftsecindent}{${toc.indentWidth}}`);
		lines.push(`\\setlength{\\cftsubsecindent}{calc(2 * ${toc.indentWidth})}`);

		return lines.join('\n');
	}

	/**
	 * Generate list styling
	 */
	private generateListStyling(config: TemplateConfiguration): string {
		const lines: string[] = ['% List styling'];

		const list = config.lists;

		if (list.compact) {
			lines.push('\\setlist{noitemsep,topsep=0pt}');
		} else {
			lines.push(`\\setlist{itemsep=${list.itemSep},parsep=${list.parsep},topsep=${list.topsep}}`);
		}

		return lines.join('\n');
	}

	/**
	 * Generate image and figure settings
	 */
	private generateImageSettings(config: TemplateConfiguration): string {
		const lines: string[] = ['% Image and figure settings'];

		const img = config.images;

		// Default image sizing
		lines.push(`\\setkeys{Gin}{width=${img.defaultWidth},keepaspectratio=${img.keepAspectRatio}}`);

		// Caption styling
		const captionSize =
			img.captionFont?.size === 'tiny' ? 'tiny'
			: img.captionFont?.size === 'small' ? 'small'
			: 'normalsize';
		const captionWeight = img.captionFont?.weight === 'bold' ? ',labelfont=bf' : '';

		lines.push(`\\captionsetup{font=${captionSize}${captionWeight},labelformat=empty}`);

		return lines.join('\n');
	}

	/**
	 * Generate code block styling
	 */
	private generateCodeBlockStyling(config: TemplateConfiguration): string {
		const lines: string[] = ['% Code block styling'];

		// This is typically handled by Pandoc's highlighting,
		// but we can add background color
		if (config.codeBlocks.backgroundColor) {
			lines.push('\\usepackage{fancyvrb}');
			lines.push('\\usepackage{xcolor}');
			lines.push(`\\definecolor{codebg}{HTML}{${config.codeBlocks.backgroundColor}}`);
		}

		return lines.join('\n');
	}

	/**
	 * Generate custom title page
	 */
	private generateTitlePage(config: TemplateConfiguration): string {
		const lines: string[] = ['% Custom title page'];

		const title = config.frontMatter.titlePage;

		lines.push('\\renewcommand{\\maketitle}{');
		lines.push('  \\begin{titlepage}');
		lines.push('    \\centering');
		lines.push('    \\vspace*{2in}');
		lines.push(`    {\\fontsize{${title.titleSize}}{${parseFloat(title.titleSize) * 1.1}}\\selectfont\\bfseries`);

		if (title.titleSpacing) {
			lines.push(`\\addfontfeatures{LetterSpace=${title.titleSpacing}}`);
		}

		lines.push('\\@title\\par}');
		lines.push('    \\vspace{0.6cm}');
		lines.push(`    {\\${title.subtitleSize}\\itshape \\@subtitle\\par}`);
		lines.push('    \\vspace{2cm}');
		lines.push(`    {\\${title.authorSize}\\sffamily \\@author\\par}`);
		lines.push('    \\vfill');
		lines.push(`    {\\${title.dateSize} \\@date\\par}`);
		lines.push('    \\vspace{0.5in}');
		lines.push('  \\end{titlepage}');
		lines.push('  \\clearpage');
		lines.push('}');

		return lines.join('\n');
	}

	/**
	 * Get font style command
	 */
	private getFontStyle(font: { size: string; style: string }): string {
		let style = '';

		// Size
		switch (font.size) {
			case 'tiny':
				style += '\\tiny ';
				break;
			case 'small':
				style += '\\small ';
				break;
			case 'large':
				style += '\\large ';
				break;
			default:
				break;
		}

		// Style
		switch (font.style) {
			case 'italic':
				style += '\\itshape ';
				break;
			case 'bold':
				style += '\\bfseries ';
				break;
			case 'bolditalic':
				style += '\\bfseries\\itshape ';
				break;
			default:
				break;
		}

		return style.trim();
	}
}
