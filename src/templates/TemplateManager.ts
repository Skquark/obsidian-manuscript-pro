/**
 * Template Manager
 * Manages document templates and their variables
 */

import { App, TFile, TFolder, Notice } from 'obsidian';
import type LatexPandocConcealerPlugin from '../main';
import type {
	Template,
	TemplateVariable,
	InsertionRequest,
	InsertionResult,
	TemplateCategory,
} from './TemplateInterfaces';
import { BUILTIN_TEMPLATES } from './TemplateInterfaces';

export class TemplateManager {
	private templates: Map<string, Template> = new Map();
	private app: App;

	constructor(private plugin: LatexPandocConcealerPlugin) {
		this.app = plugin.app;
	}

	/**
	 * Initialize template manager
	 */
	async initialize(): Promise<void> {
		// Load built-in templates
		this.loadBuiltInTemplates();

		// Load custom templates from vault
		await this.loadCustomTemplates();
	}

	/**
	 * Load built-in templates
	 */
	private loadBuiltInTemplates(): void {
		const now = Date.now();

		BUILTIN_TEMPLATES.forEach((partial) => {
			const template: Template = {
				id: partial.id || '',
				name: partial.name || '',
				description: partial.description || '',
				category: partial.category || 'custom',
				content: partial.content || '',
				variables: partial.variables || [],
				tags: partial.tags || [],
				isBuiltIn: true,
				createdAt: now,
				modifiedAt: now,
			};

			this.templates.set(template.id, template);
		});
	}

	/**
	 * Load custom templates from vault
	 */
	private async loadCustomTemplates(): Promise<void> {
		const templatesPath = this.plugin.settings.templates?.customTemplatesPath || '.templates';

		// Check if templates directory exists
		const folder = this.app.vault.getAbstractFileByPath(templatesPath);
		if (!(folder instanceof TFolder)) {
			return;
		}

		// Read all markdown files in templates directory
		const files = folder.children.filter((file) => file instanceof TFile && file.extension === 'md') as TFile[];

		for (const file of files) {
			try {
				const content = await this.app.vault.read(file);
				const template = this.parseTemplateFile(file, content);
				if (template) {
					this.templates.set(template.id, template);
				}
			} catch (error) {
				console.error(`Failed to load template ${file.path}:`, error);
			}
		}
	}

	/**
	 * Parse template file
	 */
	private parseTemplateFile(file: TFile, content: string): Template | null {
		// Extract frontmatter
		const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
		const match = content.match(frontmatterRegex);

		if (!match) {
			// No frontmatter, use file name as template name
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
		const templateContent = match[2];

		const metadata: any = {};
		frontmatter.split('\n').forEach((line) => {
			const [key, ...valueParts] = line.split(':');
			if (key && valueParts.length > 0) {
				const value = valueParts.join(':').trim();
				// Remove quotes if present
				metadata[key.trim()] = value.replace(/^["']|["']$/g, '');
			}
		});

		return {
			id: metadata.id || file.basename,
			name: metadata.name || file.basename,
			description: metadata.description || '',
			category: (metadata.category as TemplateCategory) || 'custom',
			content: templateContent,
			variables: this.extractVariables(templateContent),
			tags: metadata.tags ? metadata.tags.split(',').map((t: string) => t.trim()) : [],
			isBuiltIn: false,
			createdAt: file.stat.ctime,
			modifiedAt: file.stat.mtime,
		};
	}

	/**
	 * Extract variables from template content
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
	 * Get all templates
	 */
	getAllTemplates(): Template[] {
		return Array.from(this.templates.values());
	}

	/**
	 * Get templates by category
	 */
	getTemplatesByCategory(category: TemplateCategory): Template[] {
		return Array.from(this.templates.values()).filter((t) => t.category === category);
	}

	/**
	 * Get template by ID
	 */
	getTemplate(id: string): Template | undefined {
		return this.templates.get(id);
	}

	/**
	 * Search templates
	 */
	searchTemplates(query: string): Template[] {
		const lowerQuery = query.toLowerCase();
		return Array.from(this.templates.values()).filter(
			(t) =>
				t.name.toLowerCase().includes(lowerQuery) ||
				t.description.toLowerCase().includes(lowerQuery) ||
				t.tags.some((tag) => tag.toLowerCase().includes(lowerQuery)),
		);
	}

	/**
	 * Insert template
	 */
	async insertTemplate(request: InsertionRequest): Promise<InsertionResult> {
		if (!request.template) {
			return {
				success: false,
				error: 'No template provided',
			};
		}

		try {
			// Validate required variables
			const missingRequired = request.template.variables
				.filter((v) => v.required && !request.variableValues[v.name])
				.map((v) => v.label || v.name);

			if (missingRequired.length > 0) {
				return {
					success: false,
					error: `Missing required fields: ${missingRequired.join(', ')}`,
				};
			}

			// Replace variables in content
			let insertedText = request.template.content;

			for (const variable of request.template.variables) {
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

				// Move cursor to end of inserted text
				const lines = insertedText.split('\n');
				const newCursor = {
					line: cursor.line + lines.length - 1,
					ch: lines.length === 1 ? cursor.ch + insertedText.length : lines[lines.length - 1].length,
				};
				editor.setCursor(newCursor);
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

			new Notice(`Template "${request.template.name}" inserted`);

			return {
				success: true,
				insertedText,
			};
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
			console.error('Template insertion error:', error);
			return {
				success: false,
				error: errorMessage,
			};
		}
	}

	/**
	 * Create new custom template
	 */
	async createTemplate(template: Omit<Template, 'id' | 'createdAt' | 'modifiedAt' | 'isBuiltIn'>): Promise<Template> {
		const id = this.generateId(template.name);
		const now = Date.now();

		const newTemplate: Template = {
			...template,
			id,
			isBuiltIn: false,
			createdAt: now,
			modifiedAt: now,
		};

		this.templates.set(id, newTemplate);

		// Save to vault
		await this.saveTemplateToVault(newTemplate);

		return newTemplate;
	}

	/**
	 * Update existing template
	 */
	async updateTemplate(id: string, updates: Partial<Template>): Promise<Template | null> {
		const template = this.templates.get(id);
		if (!template) {
			return null;
		}

		if (template.isBuiltIn) {
			throw new Error('Cannot modify built-in templates');
		}

		const updated: Template = {
			...template,
			...updates,
			id: template.id, // Don't allow ID changes
			isBuiltIn: false,
			createdAt: template.createdAt,
			modifiedAt: Date.now(),
		};

		this.templates.set(id, updated);

		// Save to vault
		await this.saveTemplateToVault(updated);

		return updated;
	}

	/**
	 * Delete template
	 */
	async deleteTemplate(id: string): Promise<boolean> {
		const template = this.templates.get(id);
		if (!template) {
			return false;
		}

		if (template.isBuiltIn) {
			throw new Error('Cannot delete built-in templates');
		}

		this.templates.delete(id);

		// Delete from vault
		const templatesPath = this.plugin.settings.templates?.customTemplatesPath || '.templates';
		const filePath = `${templatesPath}/${id}.md`;
		const file = this.app.vault.getAbstractFileByPath(filePath);

		if (file instanceof TFile) {
			await this.app.vault.delete(file);
		}

		return true;
	}

	/**
	 * Save template to vault
	 */
	private async saveTemplateToVault(template: Template): Promise<void> {
		const templatesPath = this.plugin.settings.templates?.customTemplatesPath || '.templates';

		// Ensure templates directory exists
		const folder = this.app.vault.getAbstractFileByPath(templatesPath);
		if (!folder) {
			await this.app.vault.createFolder(templatesPath);
		}

		// Generate file content with frontmatter
		const frontmatter = [
			'---',
			`id: ${template.id}`,
			`name: ${template.name}`,
			`description: ${template.description}`,
			`category: ${template.category}`,
			`tags: ${template.tags.join(', ')}`,
			'---',
			'',
			template.content,
		].join('\n');

		const filePath = `${templatesPath}/${template.id}.md`;
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

		while (this.templates.has(id)) {
			id = `${base}-${counter}`;
			counter++;
		}

		return id;
	}

	/**
	 * Get template categories
	 */
	getCategories(): TemplateCategory[] {
		return ['document', 'section', 'figure', 'table', 'equation', 'theorem', 'list', 'code', 'citation', 'custom'];
	}
}
