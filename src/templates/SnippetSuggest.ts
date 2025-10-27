/**
 * Snippet Trigger Autocomplete
 * Shows snippet suggestions as you type trigger words
 */

import { Editor, EditorPosition, EditorSuggest, EditorSuggestContext, EditorSuggestTriggerInfo, TFile } from 'obsidian';
import type LatexPandocConcealerPlugin from '../main';
import type { Snippet } from './TemplateInterfaces';

interface SnippetSuggestion {
	snippet: Snippet;
	displayText: string;
	trigger: string;
}

export class SnippetSuggest extends EditorSuggest<SnippetSuggestion> {
	constructor(private plugin: LatexPandocConcealerPlugin) {
		super(plugin.app);
	}

	/**
	 * Check if we should trigger autocomplete
	 */
	onTrigger(cursor: EditorPosition, editor: Editor, file: TFile | null): EditorSuggestTriggerInfo | null {
		// Check if snippet triggers are enabled
		if (!this.plugin.settings.templates?.enableTriggers) {
			return null;
		}

		// Get current line
		const line = editor.getLine(cursor.line);
		const textBeforeCursor = line.substring(0, cursor.ch);

		// Look for potential trigger word at cursor
		// Match word characters that could be a trigger
		const triggerMatch = textBeforeCursor.match(/(\w+)$/);

		if (!triggerMatch) {
			return null;
		}

		const triggerText = triggerMatch[1];

		// Check if any snippets have triggers that start with this text
		const allTriggers = this.plugin.snippetManager.getAllTriggers();
		const hasMatchingTrigger = allTriggers.some((trigger) =>
			trigger.toLowerCase().startsWith(triggerText.toLowerCase()),
		);

		if (!hasMatchingTrigger) {
			return null;
		}

		return {
			start: { line: cursor.line, ch: cursor.ch - triggerText.length },
			end: cursor,
			query: triggerText,
		};
	}

	/**
	 * Get suggestions based on current query
	 */
	getSuggestions(context: EditorSuggestContext): SnippetSuggestion[] {
		const query = context.query.toLowerCase();
		const suggestions: SnippetSuggestion[] = [];

		// Get all snippets
		const allSnippets = this.plugin.snippetManager.getAllSnippets();

		for (const snippet of allSnippets) {
			// Only suggest snippets with triggers
			if (!snippet.trigger) continue;

			// Match trigger against query
			if (snippet.trigger.toLowerCase().startsWith(query)) {
				suggestions.push({
					snippet,
					displayText: snippet.name,
					trigger: snippet.trigger,
				});
			}
		}

		// Sort by trigger length (shorter = more specific)
		suggestions.sort((a, b) => a.trigger.length - b.trigger.length);

		return suggestions;
	}

	/**
	 * Render suggestion in dropdown
	 */
	renderSuggestion(suggestion: SnippetSuggestion, el: HTMLElement): void {
		const container = el.createDiv({ cls: 'snippet-suggestion' });

		// Trigger badge
		container.createEl('code', {
			text: suggestion.trigger,
			cls: 'snippet-suggestion-trigger',
		});

		// Snippet name
		container.createEl('span', {
			text: suggestion.displayText,
			cls: 'snippet-suggestion-name',
		});

		// Description
		if (suggestion.snippet.description) {
			container.createEl('div', {
				text: suggestion.snippet.description,
				cls: 'snippet-suggestion-desc',
			});
		}
	}

	/**
	 * Apply suggestion when selected
	 */
	async selectSuggestion(suggestion: SnippetSuggestion, evt: MouseEvent | KeyboardEvent): Promise<void> {
		const editor = this.context?.editor;
		if (!editor) return;

		// If snippet has variables, show variable input dialog
		if (suggestion.snippet.variables.length > 0) {
			// Import dialog dynamically to avoid circular dependency
			const { TemplateVariableModal } = require('./TemplateDialog');

			const modal = new TemplateVariableModal(
				this.plugin.app,
				suggestion.snippet,
				async (values: Record<string, string>) => {
					// Remove the trigger text
					const start = this.context?.start;
					const end = this.context?.end;
					if (start && end) {
						editor.replaceRange('', start, end);
					}

					// Insert snippet
					await this.plugin.snippetManager.insertSnippet({
						snippet: suggestion.snippet,
						variableValues: values,
						insertAtCursor: true,
					});
				},
			);
			modal.open();
		} else {
			// No variables, insert directly
			const start = this.context?.start;
			const end = this.context?.end;
			if (start && end) {
				editor.replaceRange('', start, end);
			}

			await this.plugin.snippetManager.insertSnippet({
				snippet: suggestion.snippet,
				variableValues: {},
				insertAtCursor: true,
			});
		}
	}
}
