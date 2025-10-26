import { PatternGroup, Pattern } from '../interfaces/plugin-settings';

/**
 * Pattern Group 3: LaTeX Commands
 * Hide LaTeX command syntax while keeping formatted content
 */

export function createLatexCommandsGroup(): PatternGroup {
	const patterns: Pattern[] = [
		{
			regexString: String.raw`\\textbf\{`,
			regex: /\\textbf\{/g,
			replacement: '**',
			description: 'Convert \\textbf{ to markdown bold **',
		},
		{
			regexString: String.raw`\\emph\{`,
			regex: /\\emph\{/g,
			replacement: '*',
			description: 'Convert \\emph{ to markdown italic *',
		},
		{
			regexString: String.raw`\\textit\{`,
			regex: /\\textit\{/g,
			replacement: '*',
			description: 'Convert \\textit{ to markdown italic *',
		},
		{
			regexString: String.raw`\\(section|subsection|subsubsection|chapter|paragraph|subparagraph)\{`,
			regex: /\\(section|subsection|subsubsection|chapter|paragraph|subparagraph)\{/g,
			replacement: '',
			description: 'Hide section commands',
		},
		{
			regexString: String.raw`\\label\{[^\}]*\}`,
			regex: /\\label\{[^\}]*\}/g,
			replacement: '',
			description: 'Hide \\label{} completely',
		},
		{
			regexString: String.raw`\\(ref|eqref|cref|pageref)\{`,
			regex: /\\(ref|eqref|cref|pageref)\{/g,
			replacement: '→',
			description: 'Replace references with arrow →',
		},
		{
			regexString: String.raw`\\footnote\{`,
			regex: /\\footnote\{/g,
			replacement: '[^',
			description: 'Convert \\footnote{ to markdown style [^',
		},
		{
			regexString: String.raw`\\(textsc|underline|enquote)\{`,
			regex: /\\(textsc|underline|enquote)\{/g,
			replacement: '',
			description: 'Hide text styling commands',
		},
		{
			regexString: String.raw`\\\\`,
			regex: /\\\\/g,
			replacement: '',
			description: 'Hide LaTeX line breaks \\\\',
		},
		{
			regexString: '\\\\([&%${}])',
			regex: /\\([&%${}])/g,
			replacement: '$1',
			description: 'Unescape special characters',
		},
	];

	return {
		id: 'latexCommands',
		name: 'LaTeX Commands',
		description: 'Hide LaTeX command syntax (\\textbf, \\section, \\label, \\ref, etc.)',
		enabled: true,
		patterns,
	};
}
