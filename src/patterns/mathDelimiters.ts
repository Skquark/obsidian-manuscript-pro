import { PatternGroup, Pattern } from '../interfaces/plugin-settings';

/**
 * Pattern Group 1: Math Delimiters
 * Hide LaTeX math mode markers while preserving math content visibility
 */

export function createMathDelimitersGroup(): PatternGroup {
	const patterns: Pattern[] = [
		{
			regexString: String.raw`(?<!\\)\$(?=\S)`,
			regex: /(?<!\\)\$(?=\S)/g,
			replacement: '',
			description: 'Opening $ before non-space'
		},
		{
			regexString: String.raw`(?<=\S)\$(?!\\)`,
			regex: /(?<=\S)\$(?!\\)/g,
			replacement: '',
			description: 'Closing $ after non-space'
		},
		{
			regexString: String.raw`\$\$`,
			regex: /\$\$/g,
			replacement: '',
			description: 'Double dollar signs'
		},
		{
			regexString: String.raw`\\\[`,
			regex: /\\\[/g,
			replacement: '',
			description: 'LaTeX display math opener \\['
		},
		{
			regexString: String.raw`\\\]`,
			regex: /\\\]/g,
			replacement: '',
			description: 'LaTeX display math closer \\]'
		},
		{
			regexString: String.raw`\\\(`,
			regex: /\\\(/g,
			replacement: '',
			description: 'LaTeX inline math opener \\('
		},
		{
			regexString: String.raw`\\\)`,
			regex: /\\\)/g,
			replacement: '',
			description: 'LaTeX inline math closer \\)'
		},
		{
			regexString: String.raw`\\begin\{(equation|align|align\*|gather|multline|eqnarray)\}`,
			regex: /\\begin\{(equation|align|align\*|gather|multline|eqnarray)\}/g,
			replacement: '',
			description: 'Math environment openers'
		},
		{
			regexString: String.raw`\\end\{(equation|align|align\*|gather|multline|eqnarray)\}`,
			regex: /\\end\{(equation|align|align\*|gather|multline|eqnarray)\}/g,
			replacement: '',
			description: 'Math environment closers'
		}
	];

	return {
		id: 'mathDelimiters',
		name: 'Math Delimiters',
		description: 'Hide LaTeX math mode delimiters ($, $$, \\[, \\], \\(, \\), equation environments)',
		enabled: true,
		patterns
	};
}
