import { PatternGroup, Pattern } from '../interfaces/plugin-settings';

/**
 * Pattern Group 4: Pandoc Markup
 * Hide Pandoc-specific markdown extensions
 */

export function createPandocMarkupGroup(): PatternGroup {
	const patterns: Pattern[] = [
		{
			regexString: String.raw`^:::\s*\{[^\}]*\}`,
			regex: /^:::\s*\{[^\}]*\}/gm,
			replacement: '',
			description: 'Hide div openers with attributes :::{.class}',
		},
		{
			regexString: String.raw`^:::$`,
			regex: /^:::$/gm,
			replacement: '',
			description: 'Hide div closers :::',
		},
		{
			regexString: String.raw`\{\.[\w-]+(?:\s+#[\w-]+)?(?:\s+[\w-]+=(?:"[^"]*"|[\w-]+))*\}`,
			regex: /\{\.[\w-]+(?:\s+#[\w-]+)?(?:\s+[\w-]+=(?:"[^"]*"|[\w-]+))*\}/g,
			replacement: '',
			description: 'Hide attribute blocks {.class #id key=value}',
		},
		{
			regexString: String.raw`\[\^([\w-]+)\]`,
			regex: /\[\^([\w-]+)\]/g,
			replacement: '[$1]',
			description: 'Simplify footnote refs [^1] to [1]',
		},
		{
			regexString: String.raw`^\|\s+`,
			regex: /^\|\s+/gm,
			replacement: '',
			description: 'Hide line block markers |',
		},
		{
			regexString: String.raw`^\(@[\w-]+\)\s+`,
			regex: /^\(@[\w-]+\)\s+/gm,
			replacement: '',
			description: 'Hide example list markers (@)',
		},
		{
			regexString: String.raw`\{(?:width|height)=[^\}]+\}`,
			regex: /\{(?:width|height)=[^\}]+\}/g,
			replacement: '',
			description: 'Hide image sizing attributes',
		},
		{
			regexString: '^```\\{=latex\\}$',
			regex: /^```\{=latex\}$/gm,
			replacement: '📄',
			description: 'Replace Pandoc raw LaTeX block opener with document emoji',
		},
		{
			regexString: '^```$',
			regex: /^```$/gm,
			replacement: '',
			description: 'Hide code fence closers',
		},
	];

	return {
		id: 'pandocMarkup',
		name: 'Pandoc Markup',
		description: 'Hide Pandoc-specific syntax (divs, attributes, line blocks, fancy lists)',
		enabled: true,
		patterns,
	};
}
