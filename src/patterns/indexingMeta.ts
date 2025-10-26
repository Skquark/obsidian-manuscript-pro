import { PatternGroup, Pattern } from '../interfaces/plugin-settings';

/**
 * Pattern Group 5: Indexing & Metadata
 * Hide indexing, metadata, and processing directives
 */

export function createIndexingMetaGroup(): PatternGroup {
	const patterns: Pattern[] = [
		{
			regexString: String.raw`\\index\{[^}]*\}`,
			regex: /\\index\{[^}]*\}/g,
			replacement: '📑',
			description: 'Replace \\index{} with index emoji',
		},
		{
			regexString: String.raw`\\gls(pl)?\{`,
			regex: /\\gls(pl)?\{/g,
			replacement: '📖',
			description: 'Replace glossary commands with book emoji',
		},
		{
			regexString: String.raw`\{#[\w:-]+\}`,
			regex: /\{#[\w:-]+\}/g,
			replacement: '🔖',
			description: 'Replace custom IDs with bookmark emoji',
		},
		{
			regexString: String.raw`^---\s*$`,
			regex: /^---\s*$/gm,
			replacement: '',
			description: 'Hide YAML frontmatter delimiters ---',
		},
		{
			regexString: String.raw`<!--.*?-->`,
			regex: /<!--[\s\S]*?-->/g,
			replacement: '',
			description: 'Hide HTML comments',
		},
		{
			regexString: String.raw`\{-\}`,
			regex: /\{-\}/g,
			replacement: '',
			description: 'Hide unnumbered markers {-}',
		},
		{
			regexString: String.raw`\{\.unnumbered\}`,
			regex: /\{\.unnumbered\}/g,
			replacement: '',
			description: 'Hide unnumbered class',
		},
		{
			regexString: String.raw`^bibliography:\s*.+$`,
			regex: /^bibliography:\s*.+$/gm,
			replacement: '',
			description: 'Hide bibliography declarations',
		},
	];

	return {
		id: 'indexingMeta',
		name: 'Indexing & Metadata',
		description: 'Hide indexing (\\index), metadata (YAML, comments), and processing directives',
		enabled: true,
		patterns,
	};
}
