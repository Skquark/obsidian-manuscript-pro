/**
 * Template & Snippet System Interfaces
 * Reusable content blocks and document templates
 */

/**
 * Variable placeholder in templates
 */
export interface TemplateVariable {
	name: string; // Variable name (e.g., "title", "author")
	label: string; // Display label for user
	defaultValue?: string; // Default value if not provided
	placeholder?: string; // Placeholder text in input
	required?: boolean; // Whether this variable is required
	type?: 'text' | 'number' | 'date' | 'select'; // Input type
	options?: string[]; // Options for select type
}

/**
 * Template category
 */
export type TemplateCategory =
	| 'document' // Full document templates
	| 'section' // Section templates (intro, methods, etc.)
	| 'figure' // Figure blocks
	| 'table' // Table blocks
	| 'equation' // Math equations
	| 'theorem' // Theorem/proof environments
	| 'list' // List structures
	| 'code' // Code blocks
	| 'citation' // Citation formats
	| 'custom'; // User-defined

/**
 * Template definition
 */
export interface Template {
	id: string; // Unique identifier
	name: string; // Display name
	description: string; // Brief description
	category: TemplateCategory; // Category
	content: string; // Template content with {{variable}} placeholders
	variables: TemplateVariable[]; // Variables used in template
	tags: string[]; // Search tags
	isBuiltIn: boolean; // Whether this is a built-in template
	createdAt: number; // Timestamp
	modifiedAt: number; // Timestamp
}

/**
 * Snippet (small reusable block)
 */
export interface Snippet {
	id: string; // Unique identifier
	name: string; // Display name
	description: string; // Brief description
	category: TemplateCategory; // Category
	trigger?: string; // Optional text trigger (e.g., "fig" -> figure snippet)
	content: string; // Snippet content with {{variable}} placeholders
	variables: TemplateVariable[]; // Variables used in snippet
	tags: string[]; // Search tags
	cursorPosition?: number; // Where to place cursor after insertion (offset from start)
	isBuiltIn: boolean; // Whether this is a built-in snippet
	createdAt: number; // Timestamp
	modifiedAt: number; // Timestamp
}

/**
 * Template/snippet insertion request
 */
export interface InsertionRequest {
	template?: Template; // Template to insert
	snippet?: Snippet; // Snippet to insert
	variableValues: Record<string, string>; // Variable values
	insertAtCursor: boolean; // Insert at cursor or replace selection
}

/**
 * Template/snippet insertion result
 */
export interface InsertionResult {
	success: boolean;
	insertedText?: string;
	cursorPosition?: number; // Final cursor position
	error?: string;
}

/**
 * Template library settings
 */
export interface TemplateLibrarySettings {
	enabled: boolean;
	customTemplatesPath: string; // Path to custom templates directory
	customSnippetsPath: string; // Path to custom snippets directory
	enableTriggers: boolean; // Enable text triggers for snippets
	showTemplateInserter: boolean; // Show template inserter command
	enableVariableHints: boolean; // Show hints for variables
}

/**
 * Built-in template definitions
 */
export const BUILTIN_TEMPLATES: Partial<Template>[] = [
	{
		id: 'academic-paper',
		name: 'Academic Paper',
		description: 'Full academic paper structure with abstract, sections, and bibliography',
		category: 'document',
		tags: ['paper', 'academic', 'research'],
		content: `---
title: "{{title}}"
author: "{{author}}"
date: {{date}}
abstract: |
  {{abstract}}
bibliography: references.bib
---

# Introduction

{{introduction}}

# Literature Review

{{literature}}

# Methodology

{{methodology}}

# Results

{{results}}

# Discussion

{{discussion}}

# Conclusion

{{conclusion}}

# References
`,
		variables: [
			{ name: 'title', label: 'Paper Title', required: true, type: 'text', placeholder: 'Enter paper title' },
			{ name: 'author', label: 'Author Name', required: true, type: 'text', placeholder: 'Enter author name' },
			{
				name: 'date',
				label: 'Date',
				defaultValue: new Date().toISOString().split('T')[0],
				type: 'date',
			},
			{
				name: 'abstract',
				label: 'Abstract',
				required: true,
				type: 'text',
				placeholder: 'Enter abstract',
			},
			{
				name: 'introduction',
				label: 'Introduction',
				defaultValue: 'Write your introduction here.',
				type: 'text',
			},
			{
				name: 'literature',
				label: 'Literature Review',
				defaultValue: 'Write your literature review here.',
				type: 'text',
			},
			{
				name: 'methodology',
				label: 'Methodology',
				defaultValue: 'Describe your methodology here.',
				type: 'text',
			},
			{ name: 'results', label: 'Results', defaultValue: 'Present your results here.', type: 'text' },
			{
				name: 'discussion',
				label: 'Discussion',
				defaultValue: 'Discuss your findings here.',
				type: 'text',
			},
			{
				name: 'conclusion',
				label: 'Conclusion',
				defaultValue: 'Write your conclusion here.',
				type: 'text',
			},
		],
		isBuiltIn: true,
	},
	{
		id: 'book-chapter',
		name: 'Book Chapter',
		description: 'Single book chapter with sections and subsections',
		category: 'section',
		tags: ['chapter', 'book', 'section'],
		content: `# Chapter {{chapter_number}}: {{chapter_title}}

## Introduction

{{introduction}}

## {{section1_title}}

{{section1_content}}

## {{section2_title}}

{{section2_content}}

## Conclusion

{{conclusion}}
`,
		variables: [
			{ name: 'chapter_number', label: 'Chapter Number', required: true, type: 'number' },
			{ name: 'chapter_title', label: 'Chapter Title', required: true, type: 'text' },
			{
				name: 'introduction',
				label: 'Introduction',
				defaultValue: 'Chapter introduction...',
				type: 'text',
			},
			{ name: 'section1_title', label: 'Section 1 Title', defaultValue: 'Section One', type: 'text' },
			{
				name: 'section1_content',
				label: 'Section 1 Content',
				defaultValue: 'Content for section one...',
				type: 'text',
			},
			{ name: 'section2_title', label: 'Section 2 Title', defaultValue: 'Section Two', type: 'text' },
			{
				name: 'section2_content',
				label: 'Section 2 Content',
				defaultValue: 'Content for section two...',
				type: 'text',
			},
			{
				name: 'conclusion',
				label: 'Conclusion',
				defaultValue: 'Chapter conclusion...',
				type: 'text',
			},
		],
		isBuiltIn: true,
	},
];

/**
 * Built-in snippet definitions
 */
export const BUILTIN_SNIPPETS: Partial<Snippet>[] = [
	{
		id: 'figure-basic',
		name: 'Figure (Basic)',
		description: 'Basic figure with caption',
		category: 'figure',
		trigger: 'fig',
		tags: ['figure', 'image', 'graphic'],
		content: `![{{caption}}]({{path}})`,
		variables: [
			{ name: 'caption', label: 'Caption', required: true, type: 'text', placeholder: 'Figure caption' },
			{ name: 'path', label: 'Image Path', required: true, type: 'text', placeholder: 'path/to/image.png' },
		],
		cursorPosition: 0,
		isBuiltIn: true,
	},
	{
		id: 'figure-latex',
		name: 'Figure (LaTeX)',
		description: 'LaTeX figure environment with label',
		category: 'figure',
		trigger: 'figlatex',
		tags: ['figure', 'latex', 'label'],
		content: `\\begin{figure}[{{placement}}]
\\centering
\\includegraphics[width={{width}}\\textwidth]{{{path}}}
\\caption{{{caption}}}
\\label{fig:{{label}}}
\\end{figure}`,
		variables: [
			{
				name: 'placement',
				label: 'Placement',
				defaultValue: 'htbp',
				type: 'select',
				options: ['h', 't', 'b', 'p', 'H', 'htbp'],
			},
			{ name: 'width', label: 'Width (0-1)', defaultValue: '0.8', type: 'text' },
			{ name: 'path', label: 'Image Path', required: true, type: 'text', placeholder: 'figures/image.png' },
			{ name: 'caption', label: 'Caption', required: true, type: 'text', placeholder: 'Figure caption' },
			{ name: 'label', label: 'Label', required: true, type: 'text', placeholder: 'unique-label' },
		],
		cursorPosition: 0,
		isBuiltIn: true,
	},
	{
		id: 'table-basic',
		name: 'Table (Basic)',
		description: 'Markdown table with headers',
		category: 'table',
		trigger: 'table',
		tags: ['table', 'markdown'],
		content: `| {{col1}} | {{col2}} | {{col3}} |
|----------|----------|----------|
|          |          |          |
|          |          |          |`,
		variables: [
			{ name: 'col1', label: 'Column 1 Header', defaultValue: 'Column 1', type: 'text' },
			{ name: 'col2', label: 'Column 2 Header', defaultValue: 'Column 2', type: 'text' },
			{ name: 'col3', label: 'Column 3 Header', defaultValue: 'Column 3', type: 'text' },
		],
		cursorPosition: 0,
		isBuiltIn: true,
	},
	{
		id: 'equation-inline',
		name: 'Equation (Inline)',
		description: 'Inline math equation',
		category: 'equation',
		trigger: 'eq',
		tags: ['equation', 'math', 'inline'],
		content: `${{ equation }}$`,
		variables: [{ name: 'equation', label: 'Equation', required: true, type: 'text', placeholder: 'x = y' }],
		cursorPosition: 1,
		isBuiltIn: true,
	},
	{
		id: 'equation-display',
		name: 'Equation (Display)',
		description: 'Display math equation with label',
		category: 'equation',
		trigger: 'eqn',
		tags: ['equation', 'math', 'display'],
		content: `$$
{{equation}}
$$ {#eq:{{label}}}`,
		variables: [
			{ name: 'equation', label: 'Equation', required: true, type: 'text', placeholder: 'E = mc^2' },
			{ name: 'label', label: 'Label', required: true, type: 'text', placeholder: 'einstein' },
		],
		cursorPosition: 0,
		isBuiltIn: true,
	},
	{
		id: 'theorem',
		name: 'Theorem',
		description: 'Theorem environment',
		category: 'theorem',
		trigger: 'thm',
		tags: ['theorem', 'proof', 'math'],
		content: `**Theorem {{number}}** ({{name}}). {{statement}}

*Proof.* {{proof}} $\\square$`,
		variables: [
			{ name: 'number', label: 'Theorem Number', type: 'text', placeholder: '1' },
			{ name: 'name', label: 'Theorem Name', type: 'text', placeholder: 'Pythagorean Theorem' },
			{ name: 'statement', label: 'Statement', required: true, type: 'text' },
			{ name: 'proof', label: 'Proof', defaultValue: 'Proof goes here.', type: 'text' },
		],
		cursorPosition: 0,
		isBuiltIn: true,
	},
	{
		id: 'code-block',
		name: 'Code Block',
		description: 'Fenced code block with language',
		category: 'code',
		trigger: 'code',
		tags: ['code', 'programming'],
		content: `\`\`\`{{language}}
{{code}}
\`\`\``,
		variables: [
			{
				name: 'language',
				label: 'Language',
				defaultValue: 'python',
				type: 'select',
				options: ['python', 'javascript', 'java', 'cpp', 'r', 'bash', 'latex', 'markdown'],
			},
			{ name: 'code', label: 'Code', defaultValue: '# Your code here', type: 'text' },
		],
		cursorPosition: 0,
		isBuiltIn: true,
	},
	{
		id: 'citation-apa',
		name: 'Citation (APA)',
		description: 'APA-style citation',
		category: 'citation',
		trigger: 'citeapa',
		tags: ['citation', 'apa', 'reference'],
		content: `[@{{key}}]`,
		variables: [{ name: 'key', label: 'Citation Key', required: true, type: 'text' }],
		cursorPosition: 0,
		isBuiltIn: true,
	},
];
