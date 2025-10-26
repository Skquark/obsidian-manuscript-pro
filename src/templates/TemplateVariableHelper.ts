/**
 * Template Variable Helper
 * Auto-fills template variables from file metadata and context
 */

import { TFile, App } from 'obsidian';
import type LatexPandocConcealerPlugin from '../main';
import type { TemplateVariable } from './TemplateInterfaces';

export class TemplateVariableHelper {
	constructor(private plugin: LatexPandocConcealerPlugin) {}

	/**
	 * Get suggested values for template variables
	 */
	async getSuggestedValues(variables: TemplateVariable[], file?: TFile): Promise<Record<string, string>> {
		const suggestions: Record<string, string> = {};

		for (const variable of variables) {
			const value = await this.getSuggestionForVariable(variable, file);
			if (value) {
				suggestions[variable.name] = value;
			}
		}

		return suggestions;
	}

	/**
	 * Get suggestion for a single variable
	 */
	private async getSuggestionForVariable(variable: TemplateVariable, file?: TFile): Promise<string | undefined> {
		// Try different strategies based on variable name
		const name = variable.name.toLowerCase();

		// Date variables
		if (name.includes('date')) {
			return this.getCurrentDate();
		}

		// Author variables
		if (name.includes('author')) {
			return await this.getAuthor(file);
		}

		// Title variables
		if (name.includes('title')) {
			return await this.getTitle(file);
		}

		// Year variables
		if (name.includes('year')) {
			return new Date().getFullYear().toString();
		}

		// Abstract variables
		if (name.includes('abstract')) {
			return await this.getAbstract(file);
		}

		// Keywords/tags
		if (name.includes('keyword') || name.includes('tag')) {
			return await this.getKeywords(file);
		}

		// Default value if provided
		return variable.defaultValue;
	}

	/**
	 * Get current date in ISO format
	 */
	private getCurrentDate(): string {
		return new Date().toISOString().split('T')[0];
	}

	/**
	 * Get author from file metadata or vault settings
	 */
	private async getAuthor(file?: TFile): Promise<string | undefined> {
		if (file) {
			// Try to get from frontmatter
			const metadata = this.plugin.app.metadataCache.getFileCache(file);
			if (metadata?.frontmatter?.author) {
				return metadata.frontmatter.author;
			}
		}

		// Try to get from plugin settings or Obsidian user
		// Could be extended to check vault config
		return undefined;
	}

	/**
	 * Get title from file name or frontmatter
	 */
	private async getTitle(file?: TFile): Promise<string | undefined> {
		if (file) {
			// Try frontmatter first
			const metadata = this.plugin.app.metadataCache.getFileCache(file);
			if (metadata?.frontmatter?.title) {
				return metadata.frontmatter.title;
			}

			// Fall back to file basename
			return file.basename;
		}

		return undefined;
	}

	/**
	 * Get abstract from frontmatter
	 */
	private async getAbstract(file?: TFile): Promise<string | undefined> {
		if (file) {
			const metadata = this.plugin.app.metadataCache.getFileCache(file);
			if (metadata?.frontmatter?.abstract) {
				return metadata.frontmatter.abstract;
			}

			// Try to extract first paragraph as abstract
			const content = await this.plugin.app.vault.read(file);
			const firstParagraph = this.extractFirstParagraph(content);
			if (firstParagraph) {
				return firstParagraph;
			}
		}

		return undefined;
	}

	/**
	 * Get keywords/tags from file
	 */
	private async getKeywords(file?: TFile): Promise<string | undefined> {
		if (file) {
			const metadata = this.plugin.app.metadataCache.getFileCache(file);

			// Try frontmatter keywords
			if (metadata?.frontmatter?.keywords) {
				if (Array.isArray(metadata.frontmatter.keywords)) {
					return metadata.frontmatter.keywords.join(', ');
				}
				return metadata.frontmatter.keywords;
			}

			// Try tags
			if (metadata?.frontmatter?.tags) {
				if (Array.isArray(metadata.frontmatter.tags)) {
					return metadata.frontmatter.tags.join(', ');
				}
				return metadata.frontmatter.tags;
			}

			// Try inline tags
			if (metadata?.tags) {
				return metadata.tags.map((t) => t.tag.replace('#', '')).join(', ');
			}
		}

		return undefined;
	}

	/**
	 * Extract first paragraph from content (skip frontmatter)
	 */
	private extractFirstParagraph(content: string): string | undefined {
		// Remove frontmatter
		const withoutFrontmatter = content.replace(/^---\n[\s\S]*?\n---\n/, '');

		// Split into paragraphs
		const paragraphs = withoutFrontmatter.split(/\n\n+/);

		// Find first non-empty, non-heading paragraph
		for (const para of paragraphs) {
			const trimmed = para.trim();
			if (trimmed && !trimmed.startsWith('#') && trimmed.length > 20) {
				// Return first 200 characters
				return trimmed.substring(0, 200) + (trimmed.length > 200 ? '...' : '');
			}
		}

		return undefined;
	}

	/**
	 * Get context-aware suggestions for specific variable types
	 */
	async getContextSuggestions(variableName: string, file?: TFile): Promise<string[]> {
		const suggestions: string[] = [];
		const name = variableName.toLowerCase();

		// Figure paths
		if (name.includes('path') || name.includes('image') || name.includes('figure')) {
			suggestions.push(...(await this.getImagePaths(file)));
		}

		// Citation keys
		if (name.includes('citation') || name.includes('key') || name.includes('ref')) {
			suggestions.push(...this.getCitationKeys());
		}

		// Label suggestions
		if (name.includes('label')) {
			suggestions.push(...this.getLabels());
		}

		return suggestions;
	}

	/**
	 * Get image paths from vault
	 */
	private async getImagePaths(file?: TFile): Promise<string[]> {
		const images: string[] = [];
		const imageExtensions = ['png', 'jpg', 'jpeg', 'gif', 'svg', 'pdf'];

		this.plugin.app.vault.getFiles().forEach((f) => {
			if (imageExtensions.includes(f.extension)) {
				// Get relative path from current file if provided
				if (file) {
					const relativePath = this.getRelativePath(file.path, f.path);
					images.push(relativePath);
				} else {
					images.push(f.path);
				}
			}
		});

		return images.slice(0, 10); // Limit to 10 suggestions
	}

	/**
	 * Get citation keys from bibliography
	 */
	private getCitationKeys(): string[] {
		const citations = this.plugin.bibliographyManager.getAllCitations();
		return Array.from(citations.keys()).slice(0, 10);
	}

	/**
	 * Get labels from cross-reference system
	 */
	private getLabels(): string[] {
		const labels = this.plugin.crossRefManager.getAllLabels();
		return labels.map((entry) => entry.key).slice(0, 10);
	}

	/**
	 * Get relative path between two files
	 */
	private getRelativePath(from: string, to: string): string {
		const fromParts = from.split('/').slice(0, -1);
		const toParts = to.split('/');

		// Find common ancestor
		let commonLength = 0;
		while (
			commonLength < fromParts.length &&
			commonLength < toParts.length &&
			fromParts[commonLength] === toParts[commonLength]
		) {
			commonLength++;
		}

		// Build relative path
		const upLevels = fromParts.length - commonLength;
		const relativeParts = [];

		for (let i = 0; i < upLevels; i++) {
			relativeParts.push('..');
		}

		relativeParts.push(...toParts.slice(commonLength));

		return relativeParts.join('/');
	}
}
