import { PatternGroup, Pattern } from '../interfaces/plugin-settings';

/**
 * Pattern Group 2: Pandoc Citations
 * Hide citation syntax clutter while keeping author/date visible when possible
 */

export function createCitationsGroup(): PatternGroup {
	const patterns: Pattern[] = [
		{
			regexString: String.raw`\[@`,
			regex: /\[@/g,
			replacement: '[',
			description: 'Simplify opening citation bracket [@',
		},
		{
			regexString: String.raw`(?<=\[)-@`,
			regex: /(?<=\[)-@/g,
			replacement: '',
			description: 'Hide suppressed author marker -@',
		},
		{
			regexString: String.raw`;\s*@`,
			regex: /;\s*@/g,
			replacement: '; ',
			description: 'Hide @ in multi-citations',
		},
		// Hide only the delimiters of @{...}, leave inner content visible
		{
			regexString: String.raw`@\{(?=[^}]+\})`,
			regex: /@\{(?=[^}]+\})/g,
			replacement: '',
			description: 'Hide opening delimiter of braced citations (@{)',
		},
		{
			regexString: String.raw`(?<=@\{[^}]+)\}`,
			regex: /(?<=@\{[^}]+)\}/g,
			replacement: '',
			description: 'Hide closing delimiter of braced citations (})',
		},
		{
			regexString: String.raw`(?<!\[)@(?=[\w])`,
			regex: /(?<!\[)@(?=[\w])/g,
			replacement: '',
			description: 'Hide standalone @ before citekey',
		},
	];

	return {
		id: 'citations',
		name: 'Citations',
		description: 'Simplify Pandoc citation syntax ([@author], @author, multi-citations)',
		enabled: true,
		patterns,
	};
}
