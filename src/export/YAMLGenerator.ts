/**
 * YAML Generator
 * Converts TemplateConfiguration to Pandoc YAML frontmatter
 */

import type { TemplateConfiguration } from './TemplateConfiguration';

export class YAMLGenerator {
	/**
	 * Generate complete Pandoc YAML from template configuration
	 */
	generate(config: TemplateConfiguration, metadata?: Record<string, any>): string {
		// Check for expert mode YAML override
		if (config.expertMode?.yamlOverride && config.expertMode?.customYAML) {
			return config.expertMode.customYAML;
		}

		const yaml: Record<string, any> = {};

		// Document metadata (from manuscript project)
		if (metadata) {
			if (metadata.title) yaml.title = metadata.title;
			if (metadata.subtitle) yaml.subtitle = metadata.subtitle;
			if (metadata.author) yaml.author = metadata.author;
			if (metadata.date) yaml.date = metadata.date;
			if (metadata.keywords) yaml.keywords = metadata.keywords;
			if (metadata.description) yaml.description = metadata.description;
			if (metadata.isbn) yaml.isbn = metadata.isbn;
		}

		// Document class and options
		yaml.documentclass = config.document.documentClass;
		if (config.document.classOptions.length > 0) {
			yaml.classoption = config.document.classOptions.join(',');
		}

		// Geometry (page layout)
		if (config.geometry) {
			const geom: string[] = [];
			if (config.geometry.paperWidth) {
				geom.push(`paperwidth=${config.geometry.paperWidth}`);
			}
			if (config.geometry.paperHeight) {
				geom.push(`paperheight=${config.geometry.paperHeight}`);
			}
			geom.push(`top=${config.geometry.topMargin}`);
			geom.push(`bottom=${config.geometry.bottomMargin}`);
			geom.push(`inner=${config.geometry.innerMargin}`);
			geom.push(`outer=${config.geometry.outerMargin}`);

			if (config.geometry.headerHeight) {
				geom.push(`headheight=${config.geometry.headerHeight}`);
			}
			if (config.geometry.footerHeight) {
				geom.push(`footskip=${config.geometry.footerHeight}`);
			}

			yaml.geometry = geom;
		}

		// Typography
		yaml.fontsize = config.typography.fontSize;
		yaml.linestretch = config.typography.lineSpacing;
		yaml.mainfont = config.typography.bodyFont;
		yaml.sansfont = config.typography.sansFont;
		yaml.monofont = config.typography.monoFont;

		// Paragraph settings
		yaml.indent = config.typography.firstLineIndent;

		// Language
		yaml.lang = config.typography.language;

		// Table of Contents
		if (config.tableOfContents.enabled) {
			yaml.toc = true;
			yaml['toc-depth'] = config.tableOfContents.depth;
			yaml['toc-title'] = config.tableOfContents.title;
		}

		// Section numbering
		yaml.numbersections = config.chapters.numbered || config.sections.numbered;
		if (config.chapters.numbered) {
			yaml.secnumdepth = 0; // Only number chapters
		} else if (config.sections.numbered) {
			yaml.secnumdepth = 1; // Number chapters and sections
		} else if (config.subsections.numbered) {
			yaml.secnumdepth = 2; // Number up to subsections
		} else {
			yaml.secnumdepth = 0;
		}

		// Code block settings
		if (config.codeBlocks.syntaxHighlighting) {
			yaml['highlight-style'] = config.codeBlocks.highlightTheme;
		}

		// Front matter
		if (config.frontMatter.abstract.enabled) {
			yaml['abstract-title'] = config.frontMatter.abstract.title;
		}

		// Custom YAML override
		if (config.customYAML) {
			try {
				// Parse and merge custom YAML
				const customObj = this.parseYAML(config.customYAML);
				Object.assign(yaml, customObj);
			} catch (error) {
				console.error('Failed to parse custom YAML:', error);
			}
		}

		// Convert to YAML string
		return this.stringify(yaml);
	}

	/**
	 * Convert JavaScript object to YAML string
	 */
	private stringify(obj: Record<string, any>, indent = 0): string {
		const lines: string[] = ['---'];

		for (const [key, value] of Object.entries(obj)) {
			lines.push(this.stringifyValue(key, value, indent));
		}

		lines.push('---');
		return lines.join('\n');
	}

	/**
	 * Stringify a single key-value pair
	 */
	private stringifyValue(key: string, value: any, indent = 0): string {
		const prefix = '  '.repeat(indent);

		if (value === null || value === undefined) {
			return `${prefix}${key}:`;
		}

		if (typeof value === 'boolean') {
			return `${prefix}${key}: ${value}`;
		}

		if (typeof value === 'number') {
			return `${prefix}${key}: ${value}`;
		}

		if (typeof value === 'string') {
			// Check if string needs quoting
			if (value.includes(':') || value.includes('#') || value.includes('\n')) {
				return `${prefix}${key}: "${value.replace(/"/g, '\\"')}"`;
			}
			return `${prefix}${key}: ${value}`;
		}

		if (Array.isArray(value)) {
			if (value.length === 0) {
				return `${prefix}${key}: []`;
			}

			// Check if simple array
			const allSimple = value.every((v) => typeof v === 'string' || typeof v === 'number');
			if (allSimple) {
				const lines = [`${prefix}${key}:`];
				for (const item of value) {
					lines.push(`${prefix}  - ${item}`);
				}
				return lines.join('\n');
			}

			// Complex array
			const lines = [`${prefix}${key}:`];
			for (const item of value) {
				if (typeof item === 'object') {
					lines.push(`${prefix}  -`);
					for (const [k, v] of Object.entries(item)) {
						lines.push(this.stringifyValue(k, v, indent + 2));
					}
				} else {
					lines.push(`${prefix}  - ${item}`);
				}
			}
			return lines.join('\n');
		}

		if (typeof value === 'object') {
			const lines = [`${prefix}${key}:`];
			for (const [k, v] of Object.entries(value)) {
				lines.push(this.stringifyValue(k, v, indent + 1));
			}
			return lines.join('\n');
		}

		return `${prefix}${key}: ${String(value)}`;
	}

	/**
	 * Simple YAML parser (for custom YAML merging)
	 */
	private parseYAML(yaml: string): Record<string, any> {
		// This is a simplified parser for basic YAML
		// In production, consider using a proper YAML library
		const result: Record<string, any> = {};
		const lines = yaml.split('\n').filter((line) => {
			const trimmed = line.trim();
			return trimmed && !trimmed.startsWith('#') && trimmed !== '---';
		});

		for (const line of lines) {
			const match = line.match(/^([a-zA-Z0-9_-]+):\s*(.*)$/);
			if (match) {
				const key = match[1];
				let value: any = match[2].trim();

				// Parse value types
				if (value === 'true') value = true;
				else if (value === 'false') value = false;
				else if (value === 'null' || value === '') value = null;
				else if (!isNaN(Number(value))) value = Number(value);
				else if (value.startsWith('"') && value.endsWith('"')) {
					value = value.slice(1, -1);
				}

				result[key] = value;
			}
		}

		return result;
	}

	/**
	 * Generate YAML for a specific section (useful for debugging)
	 */
	generateSection(config: TemplateConfiguration, section: string): string {
		const yaml: Record<string, any> = {};

		switch (section) {
			case 'typography':
				yaml.fontsize = config.typography.fontSize;
				yaml.linestretch = config.typography.lineSpacing;
				yaml.mainfont = config.typography.bodyFont;
				yaml.sansfont = config.typography.sansFont;
				yaml.monofont = config.typography.monoFont;
				yaml.lang = config.typography.language;
				break;

			case 'geometry':
				if (config.geometry) {
					const geom: string[] = [];
					geom.push(`top=${config.geometry.topMargin}`);
					geom.push(`bottom=${config.geometry.bottomMargin}`);
					geom.push(`inner=${config.geometry.innerMargin}`);
					geom.push(`outer=${config.geometry.outerMargin}`);
					yaml.geometry = geom;
				}
				break;

			case 'toc':
				yaml.toc = config.tableOfContents.enabled;
				yaml['toc-depth'] = config.tableOfContents.depth;
				yaml['toc-title'] = config.tableOfContents.title;
				break;
		}

		return this.stringify(yaml);
	}
}
