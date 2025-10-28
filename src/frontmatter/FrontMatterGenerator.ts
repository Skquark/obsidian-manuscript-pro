/**
 * Front Matter Generator
 * Generates professional front matter in multiple formats
 */

import type { FrontMatterData, FrontMatterOutput, FrontMatterPreferences, StyleTemplate } from './FrontMatterInterfaces';
import { getStyleTemplate } from './StyleTemplates';

export class FrontMatterGenerator {
	/**
	 * Generate all front matter outputs based on preferences
	 */
	generate(data: FrontMatterData, preferences: FrontMatterPreferences): FrontMatterOutput {
		const output: FrontMatterOutput = {};
		const style = getStyleTemplate(preferences.style);

		if (preferences.exportFormat === 'markdown' || preferences.exportFormat === 'both') {
			output.markdownFiles = this.generateMarkdownFiles(data, preferences, style);
		}

		if (preferences.exportFormat === 'latex' || preferences.exportFormat === 'both') {
			output.latexPreamble = this.generateLatexPreamble(data, preferences, style);
		}

		// Always generate EPUB metadata
		output.epubMetadata = this.generateEpubMetadata(data);

		return output;
	}

	/**
	 * Generate markdown files for front matter sections
	 */
	private generateMarkdownFiles(
		data: FrontMatterData,
		preferences: FrontMatterPreferences,
		style: StyleTemplate,
	): { [filename: string]: string } {
		const files: { [filename: string]: string } = {};
		const blank = style.markdown.blankLinesBetweenSections;
		const blankLines = '\n'.repeat(blank);

		// Title Page
		if (preferences.includeTitlePage) {
			let titleContent = '';

			if (style.markdown.centerText) {
				titleContent += '<div style="text-align: center">\n\n';
			}

			titleContent += `# ${data.title}\n\n`;

			if (data.subtitle) {
				titleContent += `## ${data.subtitle}\n\n`;
			}

			titleContent += blankLines;
			titleContent += `### ${data.author}\n`;

			if (data.authorCredentials) {
				titleContent += `*${data.authorCredentials}*\n`;
			}

			titleContent += blankLines;

			if (data.publisher) {
				titleContent += `**${data.publisher}**\n`;
				if (data.publisherLocation) {
					titleContent += `${data.publisherLocation}\n`;
				}
			}

			if (style.markdown.centerText) {
				titleContent += '\n</div>';
			}

			files['01-title-page.md'] = titleContent;
		}

		// Copyright Page
		if (preferences.includeCopyrightPage) {
			let copyrightContent = '';

			copyrightContent += `Copyright © ${data.copyright.year} ${data.copyright.holder}\n\n`;

			if (data.copyright.isbn) {
				copyrightContent += `ISBN: ${data.copyright.isbn}\n`;
			}

			if (data.copyright.eisbn) {
				copyrightContent += `eISBN: ${data.copyright.eisbn}\n`;
			}

			copyrightContent += '\n';

			if (data.copyright.edition) {
				copyrightContent += `${data.copyright.edition}\n`;
			}

			if (data.copyright.printingNumber) {
				copyrightContent += `Printing ${data.copyright.printingNumber}\n`;
			}

			copyrightContent += '\n';

			if (data.copyright.additionalNotices && data.copyright.additionalNotices.length > 0) {
				copyrightContent += data.copyright.additionalNotices.join('\n\n') + '\n\n';
			}

			if (data.publisher) {
				copyrightContent += `Published by ${data.publisher}\n`;
				if (data.publication?.websiteUrl) {
					copyrightContent += `${data.publication.websiteUrl}\n`;
				}
			}

			if (data.publication?.printedIn) {
				copyrightContent += `\nPrinted in ${data.publication.printedIn}\n`;
			}

			if (data.copyright.disclaimer) {
				copyrightContent += `\n${data.copyright.disclaimer}\n`;
			}

			files['02-copyright.md'] = copyrightContent;
		}

		// Dedication
		if (preferences.includeDedication && data.dedication) {
			let dedicationContent = '';

			if (style.markdown.centerText) {
				dedicationContent += '<div style="text-align: center">\n\n';
			}

			dedicationContent += blankLines;
			dedicationContent += data.dedication;
			dedicationContent += blankLines;

			if (style.markdown.centerText) {
				dedicationContent += '\n</div>';
			}

			files['03-dedication.md'] = dedicationContent;
		}

		// Epigraph
		if (preferences.includeEpigraph && data.epigraph) {
			let epigraphContent = '';

			if (style.markdown.useHorizontalRules) {
				epigraphContent += '---\n\n';
			}

			epigraphContent += `> ${data.epigraph.text}\n>\n`;
			epigraphContent += `> —${data.epigraph.attribution}`;

			if (data.epigraph.source) {
				epigraphContent += `, *${data.epigraph.source}*`;
			}

			epigraphContent += '\n';

			if (style.markdown.useHorizontalRules) {
				epigraphContent += '\n---\n';
			}

			files['04-epigraph.md'] = epigraphContent;
		}

		// Foreword
		if (preferences.includeForeword && data.foreword) {
			let forewordContent = '# Foreword\n\n';
			forewordContent += data.foreword.text;

			if (data.foreword.author) {
				forewordContent += `\n\n—${data.foreword.author}`;
			}

			files['05-foreword.md'] = forewordContent;
		}

		// Preface
		if (preferences.includePreface && data.preface) {
			let prefaceContent = '# Preface\n\n';
			prefaceContent += data.preface;

			files['06-preface.md'] = prefaceContent;
		}

		// Acknowledgments
		if (preferences.includeAcknowledgments && data.acknowledgments) {
			let ackContent = '# Acknowledgments\n\n';
			ackContent += data.acknowledgments;

			files['07-acknowledgments.md'] = ackContent;
		}

		// About the Author (back matter)
		if (preferences.includeAboutAuthor && data.aboutAuthor) {
			let aboutContent = '# About the Author\n\n';

			if (data.aboutAuthor.photo) {
				aboutContent += `![Author Photo](${data.aboutAuthor.photo})\n\n`;
			}

			aboutContent += data.aboutAuthor.bio + '\n\n';

			if (data.aboutAuthor.website) {
				aboutContent += `Website: ${data.aboutAuthor.website}\n\n`;
			}

			if (data.aboutAuthor.socialMedia) {
				const social = data.aboutAuthor.socialMedia;
				aboutContent += 'Connect with the author:\n\n';

				if (social.twitter) aboutContent += `- Twitter: @${social.twitter}\n`;
				if (social.instagram) aboutContent += `- Instagram: @${social.instagram}\n`;
				if (social.facebook) aboutContent += `- Facebook: ${social.facebook}\n`;
				if (social.linkedin) aboutContent += `- LinkedIn: ${social.linkedin}\n`;
			}

			files['99-about-author.md'] = aboutContent;
		}

		// Also By (back matter)
		if (preferences.includeAlsoBy && data.alsoBy) {
			let alsoByContent = `# ${data.alsoBy.title || 'Also by ' + data.author}\n\n`;

			data.alsoBy.books.forEach((book) => {
				alsoByContent += `- *${book}*\n`;
			});

			files['98-also-by.md'] = alsoByContent;
		}

		return files;
	}

	/**
	 * Generate LaTeX preamble for front matter
	 */
	private generateLatexPreamble(
		data: FrontMatterData,
		preferences: FrontMatterPreferences,
		style: StyleTemplate,
	): string {
		let latex = '';

		// Title Page
		if (preferences.includeTitlePage) {
			let titlePage = style.latex.titlePageTemplate;

			titlePage = titlePage.replace(/{{TITLE}}/g, this.escapeLatex(data.title));
			titlePage = titlePage.replace(
				/{{SUBTITLE}}/g,
				data.subtitle ? `{\\${style.latex.spacing.subtitleSize} \\textit{${this.escapeLatex(data.subtitle)}}\\par}` : '',
			);
			titlePage = titlePage.replace(/{{AUTHOR}}/g, this.escapeLatex(data.author));
			titlePage = titlePage.replace(
				/{{CREDENTIALS}}/g,
				data.authorCredentials ? `{\\small ${this.escapeLatex(data.authorCredentials)}\\par}` : '',
			);
			titlePage = titlePage.replace(/{{PUBLISHER}}/g, data.publisher ? `{\\large ${this.escapeLatex(data.publisher)}\\par}` : '');
			titlePage = titlePage.replace(
				/{{PUBLISHER_LOCATION}}/g,
				data.publisherLocation ? `{\\normalsize ${this.escapeLatex(data.publisherLocation)}\\par}` : '',
			);

			latex += titlePage + '\n';
		}

		// Copyright Page
		if (preferences.includeCopyrightPage) {
			let copyrightPage = style.latex.copyrightPageTemplate;

			copyrightPage = copyrightPage.replace(/{{YEAR}}/g, data.copyright.year.toString());
			copyrightPage = copyrightPage.replace(/{{HOLDER}}/g, this.escapeLatex(data.copyright.holder));
			copyrightPage = copyrightPage.replace(/{{ISBN}}/g, data.copyright.isbn ? `ISBN: ${data.copyright.isbn}` : '');
			copyrightPage = copyrightPage.replace(
				/{{EDITION}}/g,
				data.copyright.edition ? `${this.escapeLatex(data.copyright.edition)}` : '',
			);
			copyrightPage = copyrightPage.replace(
				/{{ADDITIONAL_NOTICES}}/g,
				data.copyright.additionalNotices ? data.copyright.additionalNotices.map((n) => this.escapeLatex(n)).join('\n\n') : '',
			);
			copyrightPage = copyrightPage.replace(/{{PUBLISHER}}/g, data.publisher ? this.escapeLatex(data.publisher) : '');
			copyrightPage = copyrightPage.replace(
				/{{PRINTED_IN}}/g,
				data.publication?.printedIn ? `Printed in ${this.escapeLatex(data.publication.printedIn)}` : '',
			);
			copyrightPage = copyrightPage.replace(
				/{{DISCLAIMER}}/g,
				data.copyright.disclaimer ? `\\small ${this.escapeLatex(data.copyright.disclaimer)}` : '',
			);

			latex += copyrightPage + '\n';
		}

		// Dedication
		if (preferences.includeDedication && data.dedication) {
			latex += `\\clearpage\n`;
			latex += `\\thispagestyle{empty}\n`;
			latex += `\\vspace*{\\fill}\n`;
			latex += `\\begin{center}\n`;
			latex += `\\textit{${this.escapeLatex(data.dedication)}}\n`;
			latex += `\\end{center}\n`;
			latex += `\\vfill\n`;
			latex += `\\clearpage\n\n`;
		}

		// Epigraph
		if (preferences.includeEpigraph && data.epigraph) {
			latex += `\\clearpage\n`;
			latex += `\\thispagestyle{empty}\n`;
			latex += `\\vspace*{3cm}\n`;
			latex += `\\begin{flushright}\n`;
			latex += `\\textit{${this.escapeLatex(data.epigraph.text)}}\\\\[1em]\n`;
			latex += `---${this.escapeLatex(data.epigraph.attribution)}`;
			if (data.epigraph.source) {
				latex += `, \\textit{${this.escapeLatex(data.epigraph.source)}}`;
			}
			latex += `\n\\end{flushright}\n`;
			latex += `\\clearpage\n\n`;
		}

		// Set up page numbering
		if (preferences.useRomanNumeralsForFrontMatter) {
			latex += `\\pagenumbering{roman}\n`;
			latex += `\\setcounter{page}{1}\n\n`;
		}

		return latex;
	}

	/**
	 * Generate EPUB metadata
	 */
	private generateEpubMetadata(data: FrontMatterData): {
		dcTitle: string;
		dcCreator: string;
		dcPublisher?: string;
		dcDate?: string;
		dcRights?: string;
		dcIdentifier?: string;
	} {
		return {
			dcTitle: data.title + (data.subtitle ? ': ' + data.subtitle : ''),
			dcCreator: data.author,
			dcPublisher: data.publisher,
			dcDate: data.publication?.publishDate,
			dcRights: `Copyright © ${data.copyright.year} ${data.copyright.holder}`,
			dcIdentifier: data.copyright.eisbn || data.copyright.isbn,
		};
	}

	/**
	 * Escape LaTeX special characters
	 */
	private escapeLatex(text: string): string {
		return text
			.replace(/\\/g, '\\textbackslash{}')
			.replace(/~/g, '\\textasciitilde{}')
			.replace(/\^/g, '\\textasciicircum{}')
			.replace(/[&%$#_{}]/g, '\\$&');
	}
}
