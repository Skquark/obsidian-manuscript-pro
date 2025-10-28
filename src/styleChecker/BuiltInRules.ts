import { StyleRule, RuleSet } from './StyleCheckerInterfaces';

/**
 * Built-in style checking rules
 * Each rule uses regex patterns for detection
 */

// ========== PUNCTUATION RULES ==========

export const PUNCTUATION_RULES: StyleRule[] = [
	{
		id: 'double-dash-emdash',
		name: 'Use em-dash instead of double dash',
		description: 'Replaces -- with proper em-dash (—)',
		category: 'punctuation',
		severity: 'suggestion',
		enabled: true,
		pattern: '(?<!-)--(?!-)',  // -- but not ---
		flags: 'g',
		scope: 'document',
		message: 'Use em-dash (—) instead of double dash (--)',
		suggestion: 'Replace with —',
		autoFix: true,
		fixPattern: '—'
	},
	{
		id: 'spaced-ellipsis',
		name: 'Ellipsis spacing',
		description: 'Flags spaced ellipses (. . .) vs proper ellipsis (...)',
		category: 'punctuation',
		severity: 'info',
		enabled: true,
		pattern: '\\.\\s+\\.\\s+\\.',
		flags: 'g',
		scope: 'document',
		message: 'Use unspaced ellipsis (...) instead of spaced (. . .)',
		suggestion: 'Replace with ...',
		autoFix: true,
		fixPattern: '...'
	},
	{
		id: 'straight-quotes',
		name: 'Straight quotes',
		description: 'Flags straight quotes that should be curly',
		category: 'punctuation',
		severity: 'info',
		enabled: false,  // Disabled by default (some prefer straight)
		pattern: '"[^"]*"',
		flags: 'g',
		scope: 'document',
		message: 'Consider using curly quotes (" ") instead of straight quotes',
		suggestion: 'Use smart quotes',
		autoFix: false
	},
	{
		id: 'multiple-exclamation',
		name: 'Multiple exclamation marks',
		description: 'Flags multiple exclamation marks (!!)',
		category: 'punctuation',
		severity: 'warning',
		enabled: true,
		pattern: '!{2,}',
		flags: 'g',
		scope: 'document',
		message: 'Avoid multiple exclamation marks',
		suggestion: 'Use single exclamation mark',
		autoFix: true,
		fixPattern: '!'
	},
	{
		id: 'multiple-question',
		name: 'Multiple question marks',
		description: 'Flags multiple question marks (??)',
		category: 'punctuation',
		severity: 'warning',
		enabled: true,
		pattern: '\\?{2,}',
		flags: 'g',
		scope: 'document',
		message: 'Avoid multiple question marks',
		suggestion: 'Use single question mark',
		autoFix: true,
		fixPattern: '?'
	},
	{
		id: 'space-before-punctuation',
		name: 'Space before punctuation',
		description: 'Detects space before comma, period, etc.',
		category: 'punctuation',
		severity: 'error',
		enabled: true,
		pattern: '\\s+[.,;:!?]',
		flags: 'g',
		scope: 'document',
		message: 'Remove space before punctuation',
		suggestion: 'Remove extra space',
		autoFix: true,
		fixPattern: ''  // Will be handled specially
	}
];

// ========== FORMATTING RULES ==========

export const FORMATTING_RULES: StyleRule[] = [
	{
		id: 'number-spelled-out',
		name: 'Numbers 1-10 should be spelled out',
		description: 'Numbers one through ten should be written as words',
		category: 'formatting',
		severity: 'suggestion',
		enabled: true,
		pattern: '\\b([1-9]|10)\\b(?!\\d)',
		flags: 'g',
		scope: 'document',
		message: 'Consider spelling out numbers 1-10',
		suggestion: 'Spell out number',
		autoFix: false,
		threshold: 1
	},
	{
		id: 'capitalization-after-period',
		name: 'Capitalize after period',
		description: 'Sentence should start with capital letter',
		category: 'formatting',
		severity: 'error',
		enabled: true,
		pattern: '\\.[\\s\\n]+[a-z]',
		flags: 'g',
		scope: 'document',
		message: 'Capitalize first letter after period',
		suggestion: 'Capitalize letter',
		autoFix: true
	},
	{
		id: 'multiple-spaces',
		name: 'Multiple consecutive spaces',
		description: 'Multiple spaces should be single space',
		category: 'formatting',
		severity: 'info',
		enabled: true,
		pattern: ' {2,}',
		flags: 'g',
		scope: 'document',
		message: 'Multiple spaces detected',
		suggestion: 'Replace with single space',
		autoFix: true,
		fixPattern: ' '
	},
	{
		id: 'trailing-whitespace',
		name: 'Trailing whitespace',
		description: 'Lines should not end with spaces',
		category: 'formatting',
		severity: 'info',
		enabled: true,
		pattern: ' +$',
		flags: 'gm',
		scope: 'line',
		message: 'Remove trailing whitespace',
		suggestion: 'Remove spaces at end of line',
		autoFix: true,
		fixPattern: ''
	}
];

// ========== TENSE RULES ==========

export const TENSE_RULES: StyleRule[] = [
	{
		id: 'past-tense-ed',
		name: 'Past tense verb (-ed)',
		description: 'Detects past tense verbs',
		category: 'tense',
		severity: 'info',
		enabled: false,  // Used for analysis, not flagging
		pattern: '\\b\\w+(ed)\\b',
		flags: 'gi',
		scope: 'document',
		message: 'Past tense verb detected'
	},
	{
		id: 'present-tense-s',
		name: 'Present tense verb (-s)',
		description: 'Detects present tense verbs',
		category: 'tense',
		severity: 'info',
		enabled: false,  // Used for analysis
		pattern: '\\b\\w+(s)\\b(?! was| is| has)',
		flags: 'gi',
		scope: 'document',
		message: 'Present tense verb detected'
	},
	{
		id: 'was-is-mixing',
		name: 'Was/Is mixing in same paragraph',
		description: 'Mixing past (was) and present (is) tense',
		category: 'tense',
		severity: 'warning',
		enabled: true,
		pattern: '(was|were).{0,200}\\b(is|are)\\b',
		flags: 'gi',
		scope: 'paragraph',
		message: 'Mixing past and present tense in same paragraph',
		suggestion: 'Use consistent tense',
		autoFix: false
	}
];

// ========== POV RULES ==========

export const POV_RULES: StyleRule[] = [
	{
		id: 'first-person-pov',
		name: 'First person POV',
		description: 'Detects first person pronouns',
		category: 'pov',
		severity: 'info',
		enabled: false,  // Used for analysis
		pattern: '\\b(I|me|my|mine|we|us|our|ours)\\b',
		flags: 'gi',
		scope: 'document',
		message: 'First person pronoun detected'
	},
	{
		id: 'third-person-pov',
		name: 'Third person POV',
		description: 'Detects third person pronouns',
		category: 'pov',
		severity: 'info',
		enabled: false,  // Used for analysis
		pattern: '\\b(he|him|his|she|her|hers|they|them|their|theirs)\\b',
		flags: 'gi',
		scope: 'document',
		message: 'Third person pronoun detected'
	},
	{
		id: 'pov-shift',
		name: 'POV shift in paragraph',
		description: 'Mixing I/me with he/she in same paragraph',
		category: 'pov',
		severity: 'warning',
		enabled: true,
		pattern: '\\b(I|me|my).{0,300}\\b(he|she|they)\\b',
		flags: 'gi',
		scope: 'paragraph',
		message: 'Possible POV shift detected',
		suggestion: 'Check if POV shift is intentional',
		autoFix: false
	}
];

// ========== DIALOGUE RULES ==========

export const DIALOGUE_RULES: StyleRule[] = [
	{
		id: 'said-said',
		name: 'Repeated "said"',
		description: 'Multiple uses of "said" in close proximity',
		category: 'dialogue',
		severity: 'suggestion',
		enabled: true,
		pattern: '\\bsaid\\b.{0,100}\\bsaid\\b',
		flags: 'gi',
		scope: 'paragraph',
		message: 'Repeated "said" in close proximity',
		suggestion: 'Consider varying dialogue tags',
		autoFix: false
	},
	{
		id: 'adverb-dialogue-tag',
		name: 'Adverb in dialogue tag',
		description: 'Dialogue tag with adverb (said softly)',
		category: 'dialogue',
		severity: 'suggestion',
		enabled: true,
		pattern: '\\bsaid\\s+(softly|loudly|quietly|angrily|sadly|happily|nervously|\\w+ly)\\b',
		flags: 'gi',
		scope: 'sentence',
		message: 'Consider showing emotion through action instead of adverb',
		suggestion: 'Show, don\'t tell',
		autoFix: false
	},
	{
		id: 'fancy-dialogue-tag',
		name: 'Overly fancy dialogue tag',
		description: 'Using complex verbs instead of "said"',
		category: 'dialogue',
		severity: 'info',
		enabled: true,
		pattern: '"[^"]*"\\s+(proclaimed|exclaimed|ejaculated|pontificated|opined|queried|interjected)\\b',
		flags: 'gi',
		scope: 'sentence',
		message: 'Consider using simpler dialogue tag',
		suggestion: 'Use "said" or "asked"',
		autoFix: false
	}
];

// ========== REPETITION RULES ==========

export const REPETITION_RULES: StyleRule[] = [
	{
		id: 'same-word-start',
		name: 'Sentences starting with same word',
		description: 'Multiple consecutive sentences starting with same word',
		category: 'repetition',
		severity: 'suggestion',
		enabled: true,
		pattern: '\\b(\\w+)\\s[^.!?]*[.!?]\\s+\\1\\s',
		flags: 'gi',
		scope: 'paragraph',
		message: 'Consecutive sentences start with same word',
		suggestion: 'Vary sentence structure',
		autoFix: false
	},
	{
		id: 'repeated-phrase',
		name: 'Repeated phrase in paragraph',
		description: 'Same phrase appears multiple times',
		category: 'repetition',
		severity: 'warning',
		enabled: true,
		threshold: 2,
		message: 'Phrase repeated in same paragraph',
		suggestion: 'Consider rephrasing for variety',
		autoFix: false
	}
];

// ========== ACADEMIC RULES ==========

export const ACADEMIC_RULES: StyleRule[] = [
	{
		id: 'citation-format',
		name: 'Citation format consistency',
		description: 'Checks for consistent citation style',
		category: 'academic',
		severity: 'warning',
		enabled: true,
		pattern: '\\[@\\w+\\]',
		flags: 'g',
		scope: 'document',
		message: 'Verify citation format',
		autoFix: false
	},
	{
		id: 'figure-numbering',
		name: 'Figure numbering sequence',
		description: 'Ensures figures are numbered sequentially',
		category: 'academic',
		severity: 'error',
		enabled: true,
		pattern: '\\bFigure\\s+(\\d+)',
		flags: 'gi',
		scope: 'document',
		message: 'Check figure numbering sequence',
		autoFix: false
	},
	{
		id: 'table-numbering',
		name: 'Table numbering sequence',
		description: 'Ensures tables are numbered sequentially',
		category: 'academic',
		severity: 'error',
		enabled: true,
		pattern: '\\bTable\\s+(\\d+)',
		flags: 'gi',
		scope: 'document',
		message: 'Check table numbering sequence',
		autoFix: false
	}
];

// ========== LATEX RULES ==========

export const LATEX_RULES: StyleRule[] = [
	{
		id: 'latex-dollar-math',
		name: 'LaTeX inline math consistency',
		description: 'Check $ vs $$ usage',
		category: 'latex',
		severity: 'info',
		enabled: true,
		pattern: '\\$\\$[^$]+\\$\\$',
		flags: 'g',
		scope: 'document',
		message: 'Display math mode detected',
		autoFix: false
	},
	{
		id: 'latex-textbf-consistency',
		name: 'LaTeX bold command consistency',
		description: 'Ensure \\textbf vs \\mathbf used correctly',
		category: 'latex',
		severity: 'suggestion',
		enabled: true,
		pattern: '\\\\textbf\\{[^}]+\\}',
		flags: 'g',
		scope: 'document',
		message: 'Verify \\textbf usage',
		autoFix: false
	}
];

// ========== READABILITY RULES ==========

export const READABILITY_RULES: StyleRule[] = [
	{
		id: 'very-long-sentence',
		name: 'Very long sentence',
		description: 'Sentence exceeds 40 words',
		category: 'readability',
		severity: 'suggestion',
		enabled: true,
		pattern: '[A-Z][^.!?]{200,}[.!?]',  // Approximation
		flags: 'g',
		scope: 'sentence',
		message: 'Sentence is very long (40+ words)',
		suggestion: 'Consider breaking into shorter sentences',
		autoFix: false,
		threshold: 40
	},
	{
		id: 'very-long-paragraph',
		name: 'Very long paragraph',
		description: 'Paragraph exceeds 150 words',
		category: 'readability',
		severity: 'info',
		enabled: true,
		message: 'Paragraph is very long (150+ words)',
		suggestion: 'Consider breaking into smaller paragraphs',
		autoFix: false,
		threshold: 150
	},
	{
		id: 'passive-voice',
		name: 'Passive voice',
		description: 'Detects passive voice constructions',
		category: 'readability',
		severity: 'suggestion',
		enabled: true,
		pattern: '\\b(was|were|been|being)\\s+(\\w+ed|\\w+en)\\b',
		flags: 'gi',
		scope: 'sentence',
		message: 'Passive voice detected',
		suggestion: 'Consider using active voice',
		autoFix: false
	}
];

// ========== RULE SETS ==========

export const BUILT_IN_RULE_SETS: RuleSet[] = [
	{
		id: 'punctuation',
		name: 'Punctuation Style',
		description: 'Checks for consistent punctuation usage',
		category: 'punctuation',
		rules: PUNCTUATION_RULES
	},
	{
		id: 'formatting',
		name: 'Formatting Standards',
		description: 'Checks for proper formatting',
		category: 'formatting',
		rules: FORMATTING_RULES
	},
	{
		id: 'tense',
		name: 'Tense Consistency',
		description: 'Detects tense shifts and inconsistencies',
		category: 'tense',
		rules: TENSE_RULES
	},
	{
		id: 'pov',
		name: 'Point of View',
		description: 'Checks for POV consistency',
		category: 'pov',
		rules: POV_RULES
	},
	{
		id: 'dialogue',
		name: 'Dialogue Tags',
		description: 'Analyzes dialogue tag usage',
		category: 'dialogue',
		rules: DIALOGUE_RULES
	},
	{
		id: 'repetition',
		name: 'Repetition Detection',
		description: 'Finds repeated words and phrases',
		category: 'repetition',
		rules: REPETITION_RULES
	},
	{
		id: 'academic',
		name: 'Academic Style',
		description: 'Checks citations, figures, and academic formatting',
		category: 'academic',
		rules: ACADEMIC_RULES
	},
	{
		id: 'latex',
		name: 'LaTeX Consistency',
		description: 'Validates LaTeX command usage',
		category: 'latex',
		rules: LATEX_RULES
	},
	{
		id: 'readability',
		name: 'Readability',
		description: 'Checks sentence/paragraph length and complexity',
		category: 'readability',
		rules: READABILITY_RULES
	}
];

/**
 * Get all built-in rules flattened
 */
export function getAllBuiltInRules(): StyleRule[] {
	return BUILT_IN_RULE_SETS.flatMap(set => set.rules);
}

/**
 * Get rules by category
 */
export function getRulesByCategory(category: string): StyleRule[] {
	const ruleSet = BUILT_IN_RULE_SETS.find(set => set.category === category);
	return ruleSet ? ruleSet.rules : [];
}

/**
 * Get rule by ID
 */
export function getRuleById(id: string): StyleRule | undefined {
	return getAllBuiltInRules().find(rule => rule.id === id);
}
