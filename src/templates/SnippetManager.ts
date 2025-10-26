/**
 * Snippet Manager
 * Manages small reusable content snippets with text triggers
 */

import {
	App,
	TFile,
	TFolder,
	Notice,
	Editor,
	EditorSuggest,
	EditorPosition,
	EditorSuggestTriggerInfo,
	EditorSuggestContext,
} from 'obsidian';
import type LatexPandocConcealerPlugin from '../main';
import type {
	Snippet,
	TemplateVariable,
	InsertionRequest,
	InsertionResult,
	TemplateCategory,
} from './TemplateInterfaces';
import { BUILTIN_SNIPPETS } from './TemplateInterfaces';

export class SnippetManager {
	private snippets: Map<string, Snippet> = new Map();
	private triggerMap: Map<string, Snippet> = new Map();
	private app: App;

	constructor(private plugin: LatexPandocConcealerPlugin) {
		this.app = plugin.app;
	}

	/**
	 * Initialize snippet manager
	 */
	async initialize(): Promise<void> {
		// Load built-in snippets
		this.loadBuiltInSnippets();

		// Load custom snippets from vault
		await this.loadCustomSnippets();
	}

	/**
	 * Load built-in snippets
	 */
	private loadBuiltInSnippets(): void {
		const now = Date.now();

		BUILTIN_SNIPPETS.forEach((partial) => {
			const snippet: Snippet = {
				id: partial.id || '',
				name: partial.name || '',
				description: partial.description || '',
				category: partial.category || 'custom',
				trigger: partial.trigger,
				content: partial.content || '',
				variables: partial.variables || [],
				tags: partial.tags || [],
				cursorPosition: partial.cursorPosition,
				isBuiltIn: true,
				createdAt: now,
				modifiedAt: now,
			};

			this.snippets.set(snippet.id, snippet);

			// Index by trigger
			if (snippet.trigger) {
				this.triggerMap.set(snippet.trigger, snippet);
			}
		});
	}

	/**
	 * Load custom snippets from vault
	 */
	private async loadCustomSnippets(): Promise<void> {
		const snippetsPath = this.plugin.settings.templates?.customSnippetsPath || '.snippets';

		// Check if snippets directory exists
		const folder = this.app.vault.getAbstractFileByPath(snippetsPath);
		if (!(folder instanceof TFolder)) {
			return;
		}

		// Read all markdown files in snippets directory
		const files = folder.children.filter((file) => file instanceof TFile && file.extension === 'md') as TFile[];

		for (const file of files) {
			try {
				const content = await this.app.vault.read(file);
				const snippet = this.parseSnippetFile(file, content);
				if (snippet) {
					this.snippets.set(snippet.id, snippet);
					if (snippet.trigger) {
						this.triggerMap.set(snippet.trigger, snippet);
					}
				}
			} catch (error) {
				console.error(`Failed to load snippet ${file.path}:`, error);
			}
		}
	}

	/**
	 * Parse snippet file
	 */
	private parseSnippetFile(file: TFile, content: string): Snippet | null {
		// Extract frontmatter
		const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
		const match = content.match(frontmatterRegex);

		if (!match) {
			// No frontmatter, use file name as snippet name
			return {
				id: file.basename,
				name: file.basename,
				description: '',
				category: 'custom',
				content: content,
				variables: this.extractVariables(content),
				tags: [],
				isBuiltIn: false,
				createdAt: file.stat.ctime,
				modifiedAt: file.stat.mtime,
			};
		}

		// Parse frontmatter
		const frontmatter = match[1];
		const snippetContent = match[2];

		const metadata: any = {};
		frontmatter.split('\n').forEach((line) => {
			const [key, ...valueParts] = line.split(':');
			if (key && valueParts.length > 0) {
				const value = valueParts.join(':').trim();
				metadata[key.trim()] = value.replace(/^["']|["']$/g, '');
			}
		});

		return {
			id: metadata.id || file.basename,
			name: metadata.name || file.basename,
			description: metadata.description || '',
			category: (metadata.category as TemplateCategory) || 'custom',
			trigger: metadata.trigger,
			content: snippetContent,
			variables: this.extractVariables(snippetContent),
			tags: metadata.tags ? metadata.tags.split(',').map((t: string) => t.trim()) : [],
			cursorPosition: metadata.cursorPosition ? parseInt(metadata.cursorPosition) : undefined,
			isBuiltIn: false,
			createdAt: file.stat.ctime,
			modifiedAt: file.stat.mtime,
		};
	}

	/**
	 * Extract variables from snippet content
	 */
	private extractVariables(content: string): TemplateVariable[] {
		const variableRegex = /\{\{(\w+)\}\}/g;
		const variableNames = new Set<string>();
		const variables: TemplateVariable[] = [];

		let match;
		while ((match = variableRegex.exec(content)) !== null) {
			const name = match[1];
			if (!variableNames.has(name)) {
				variableNames.add(name);
				variables.push({
					name,
					label: this.formatLabel(name),
					type: 'text',
					required: false,
				});
			}
		}

		return variables;
	}

	/**
	 * Format variable name as label
	 */
	private formatLabel(name: string): string {
		return name
			.replace(/_/g, ' ')
			.replace(/([A-Z])/g, ' $1')
			.replace(/^./, (str) => str.toUpperCase())
			.trim();
	}

	/**
	 * Get all snippets
	 */
	getAllSnippets(): Snippet[] {
		return Array.from(this.snippets.values());
	}

	/**
	 * Get snippets by category
	 */
	getSnippetsByCategory(category: TemplateCategory): Snippet[] {
		return Array.from(this.snippets.values()).filter((s) => s.category === category);
	}

	/**
	 * Get snippet by ID
	 */
	getSnippet(id: string): Snippet | undefined {
		return this.snippets.get(id);
	}

	/**
	 * Get snippet by trigger
	 */
	getSnippetByTrigger(trigger: string): Snippet | undefined {
		return this.triggerMap.get(trigger);
	}

	/**
	 * Search snippets
	 */
	searchSnippets(query: string): Snippet[] {
		const lowerQuery = query.toLowerCase();
		return Array.from(this.snippets.values()).filter(
			(s) =>
				s.name.toLowerCase().includes(lowerQuery) ||
				s.description.toLowerCase().includes(lowerQuery) ||
				s.tags.some((tag) => tag.toLowerCase().includes(lowerQuery)) ||
				(s.trigger && s.trigger.toLowerCase().includes(lowerQuery)),
		);
	}

	/**
	 * Insert snippet
	 */
	async insertSnippet(request: InsertionRequest): Promise<InsertionResult> {
		if (!request.snippet) {
			return {
				success: false,
				error: 'No snippet provided',
			};
		}

		try {
			// Validate required variables
			const missingRequired = request.snippet.variables
				.filter((v) => v.required && !request.variableValues[v.name])
				.map((v) => v.label || v.name);

			if (missingRequired.length > 0) {
				return {
					success: false,
					error: `Missing required fields: ${missingRequired.join(', ')}`,
				};
			}

			// Replace variables in content
			let insertedText = request.snippet.content;

			for (const variable of request.snippet.variables) {
				const value = request.variableValues[variable.name] || variable.defaultValue || '';
				// Escape special regex characters in variable name
				const escapedName = variable.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
				const regex = new RegExp(`\\{\\{${escapedName}\\}\\}`, 'g');
				insertedText = insertedText.replace(regex, value);
			}

			// Get active editor
			const activeView = this.app.workspace.getActiveViewOfType(require('obsidian').MarkdownView);
			if (!activeView) {
				return {
					success: false,
					error: 'No active editor',
				};
			}

			const editor = (activeView as any).editor;

			if (request.insertAtCursor) {
				// Insert at cursor
				const cursor = editor.getCursor();
				editor.replaceRange(insertedText, cursor);

				// Handle cursor positioning
				let finalCursor;
				if (request.snippet.cursorPosition !== undefined) {
					// Use snippet-defined cursor position
					const offset = request.snippet.cursorPosition;
					const beforeCursor = insertedText.substring(0, offset);
					const lines = beforeCursor.split('\n');
					finalCursor = {
						line: cursor.line + lines.length - 1,
						ch: lines.length === 1 ? cursor.ch + offset : lines[lines.length - 1].length,
					};
				} else {
					// Move cursor to end of inserted text
					const lines = insertedText.split('\n');
					finalCursor = {
						line: cursor.line + lines.length - 1,
						ch: lines.length === 1 ? cursor.ch + insertedText.length : lines[lines.length - 1].length,
					};
				}
				editor.setCursor(finalCursor);
			} else {
				// Replace selection
				const selection = editor.getSelection();
				if (selection) {
					editor.replaceSelection(insertedText);
				} else {
					const cursor = editor.getCursor();
					editor.replaceRange(insertedText, cursor);
				}
			}

			return {
				success: true,
				insertedText,
			};
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
			console.error('Snippet insertion error:', error);
			return {
				success: false,
				error: errorMessage,
			};
		}
	}

	/**
	 * Insert snippet by trigger (for auto-complete)
	 */
	async insertSnippetByTrigger(
		editor: Editor,
		trigger: string,
		variableValues: Record<string, string> = {},
	): Promise<boolean> {
		const snippet = this.triggerMap.get(trigger);
		if (!snippet) {
			return false;
		}

		// Remove the trigger text
		const cursor = editor.getCursor();
		const line = editor.getLine(cursor.line);
		const triggerStart = line.lastIndexOf(trigger, cursor.ch);

		if (triggerStart >= 0) {
			editor.replaceRange(
				'',
				{ line: cursor.line, ch: triggerStart },
				{ line: cursor.line, ch: triggerStart + trigger.length },
			);
		}

		// Insert snippet
		const result = await this.insertSnippet({
			snippet,
			variableValues,
			insertAtCursor: true,
		});

		return result.success;
	}

	/**
	 * Create new custom snippet
	 */
	async createSnippet(snippet: Omit<Snippet, 'id' | 'createdAt' | 'modifiedAt' | 'isBuiltIn'>): Promise<Snippet> {
		const id = this.generateId(snippet.name);
		const now = Date.now();

		const newSnippet: Snippet = {
			...snippet,
			id,
			isBuiltIn: false,
			createdAt: now,
			modifiedAt: now,
		};

		this.snippets.set(id, newSnippet);

		if (newSnippet.trigger) {
			this.triggerMap.set(newSnippet.trigger, newSnippet);
		}

		// Save to vault
		await this.saveSnippetToVault(newSnippet);

		return newSnippet;
	}

	/**
	 * Update existing snippet
	 */
	async updateSnippet(id: string, updates: Partial<Snippet>): Promise<Snippet | null> {
		const snippet = this.snippets.get(id);
		if (!snippet) {
			return null;
		}

		if (snippet.isBuiltIn) {
			throw new Error('Cannot modify built-in snippets');
		}

		// Remove old trigger
		if (snippet.trigger) {
			this.triggerMap.delete(snippet.trigger);
		}

		const updated: Snippet = {
			...snippet,
			...updates,
			id: snippet.id,
			isBuiltIn: false,
			createdAt: snippet.createdAt,
			modifiedAt: Date.now(),
		};

		this.snippets.set(id, updated);

		// Add new trigger
		if (updated.trigger) {
			this.triggerMap.set(updated.trigger, updated);
		}

		// Save to vault
		await this.saveSnippetToVault(updated);

		return updated;
	}

	/**
	 * Delete snippet
	 */
	async deleteSnippet(id: string): Promise<boolean> {
		const snippet = this.snippets.get(id);
		if (!snippet) {
			return false;
		}

		if (snippet.isBuiltIn) {
			throw new Error('Cannot delete built-in snippets');
		}

		this.snippets.delete(id);

		if (snippet.trigger) {
			this.triggerMap.delete(snippet.trigger);
		}

		// Delete from vault
		const snippetsPath = this.plugin.settings.templates?.customSnippetsPath || '.snippets';
		const filePath = `${snippetsPath}/${id}.md`;
		const file = this.app.vault.getAbstractFileByPath(filePath);

		if (file instanceof TFile) {
			await this.app.vault.delete(file);
		}

		return true;
	}

	/**
	 * Save snippet to vault
	 */
	private async saveSnippetToVault(snippet: Snippet): Promise<void> {
		const snippetsPath = this.plugin.settings.templates?.customSnippetsPath || '.snippets';

		// Ensure snippets directory exists
		const folder = this.app.vault.getAbstractFileByPath(snippetsPath);
		if (!folder) {
			await this.app.vault.createFolder(snippetsPath);
		}

		// Generate file content with frontmatter
		const frontmatterLines = [
			'---',
			`id: ${snippet.id}`,
			`name: ${snippet.name}`,
			`description: ${snippet.description}`,
			`category: ${snippet.category}`,
		];

		if (snippet.trigger) {
			frontmatterLines.push(`trigger: ${snippet.trigger}`);
		}

		if (snippet.cursorPosition !== undefined) {
			frontmatterLines.push(`cursorPosition: ${snippet.cursorPosition}`);
		}

		frontmatterLines.push(`tags: ${snippet.tags.join(', ')}`);
		frontmatterLines.push('---', '', snippet.content);

		const frontmatter = frontmatterLines.join('\n');

		const filePath = `${snippetsPath}/${snippet.id}.md`;
		const file = this.app.vault.getAbstractFileByPath(filePath);

		if (file instanceof TFile) {
			await this.app.vault.modify(file, frontmatter);
		} else {
			await this.app.vault.create(filePath, frontmatter);
		}
	}

	/**
	 * Generate unique ID
	 */
	private generateId(name: string): string {
		const base = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
		let id = base;
		let counter = 1;

		while (this.snippets.has(id)) {
			id = `${base}-${counter}`;
			counter++;
		}

		return id;
	}

	/**
	 * Get all triggers
	 */
	getAllTriggers(): string[] {
		return Array.from(this.triggerMap.keys());
	}
}
