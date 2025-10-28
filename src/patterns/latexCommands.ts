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
			regexString: String.raw`\\label\{[^}]*\}`,
			regex: /\\label\{[^}]*\}/g,
			replacement: '🏷️',
			description: 'Replace \\label{} with label tag emoji',
		},
		{
			regexString: String.raw`\\pageref\{[^}]*\}`,
			regex: /\\pageref\{[^}]*\}/g,
			replacement: '📄',
			description: 'Replace \\pageref{} with page emoji',
		},
		{
			regexString: String.raw`\\(ref|eqref|cref)\{[^}]*\}`,
			regex: /\\(ref|eqref|cref)\{[^}]*\}/g,
			replacement: '→',
			description: 'Replace references with arrow →',
		},
		{
			regexString: String.raw`\\(ref|eqref|cref|pageref)\{`,
			regex: /\\(ref|eqref|cref|pageref)\{/g,
			replacement: '→',
			description: 'Replace references with arrow → (fallback for incomplete)',
		},
		{
			regexString: String.raw`§\\ref\{`,
			regex: /§\\ref\{/g,
			replacement: '§',
			description: 'Hide \\ref in §\\ref{...}',
		},
		{
			regexString: String.raw`\\hyperref\[[^\]]*\]\{`,
			regex: /\\hyperref\[[^\]]*\]\{/g,
			replacement: '→',
			description: 'Replace \\hyperref[label]{text} with arrow →',
		},
		{
			regexString: String.raw`\\setchapterimage\{[^}]+\}\{[^}]+\}`,
			regex: /\\setchapterimage\{[^}]+\}\{[^}]+\}/g,
			replacement: '🖼️',
			description: 'Replace \\setchapterimage{image}{width} with image emoji',
		},
		{
			regexString: String.raw`\\markboth\{`,
			regex: /\\markboth\{/g,
			replacement: '📑',
			description: 'Replace \\markboth{ with bookmark tabs emoji',
		},
		{
			regexString: String.raw`\\markboth\{[^}]*\}\{[^}]*\}`,
			regex: /\\markboth\{[^}]*\}\{[^}]*\}/g,
			replacement: '',
			description: 'Hide \\markboth{left}{right} completely',
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
			regexString: String.raw`\\begin\{figure\}(?:\[[^\]]*\])?`,
			regex: /\\begin\{figure\}(?:\[[^\]]*\])?/g,
			replacement: '📊',
			description: 'Replace \\begin{figure}[options] with chart emoji',
		},
		{
			regexString: String.raw`\\end\{figure\}`,
			regex: /\\end\{figure\}/g,
			replacement: '',
			description: 'Hide \\end{figure}',
		},
		{
			regexString: String.raw`\\centering`,
			regex: /\\centering/g,
			replacement: '',
			description: 'Hide \\centering',
		},
		{
			regexString: String.raw`\\includegraphics(?:\[[^\]]*\])?\{[^}]+\}`,
			regex: /\\includegraphics(?:\[[^\]]*\])?\{[^}]+\}/g,
			replacement: '🖼️',
			description: 'Replace \\includegraphics with image emoji',
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
