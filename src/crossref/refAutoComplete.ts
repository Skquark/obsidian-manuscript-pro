/**
 * Cross-Reference Auto-Completion
 * CodeMirror 6 auto-completion for \ref{} commands
 */

import { autocompletion, CompletionContext, CompletionResult } from '@codemirror/autocomplete';
import type LatexPandocConcealerPlugin from '../main';

/**
 * Create auto-completion extension for references
 */
export function createRefAutoComplete(plugin: LatexPandocConcealerPlugin) {
	return autocompletion({
		override: [
			(context: CompletionContext): CompletionResult | null => {
				// Check if we're inside a ref command
				const before = context.matchBefore(/\\(ref|eqref|cref|pageref|autoref)\{[^}]*/);
				if (!before) return null;

				// Extract ref type and current text
				const match = before.text.match(/\\(ref|eqref|cref|pageref|autoref)\{([^}]*)/);
				if (!match) return null;

				const refType = match[1] as any;
				const prefix = match[2] || '';

				// Get suggestions from CrossRefManager
				const activeFile = plugin.app.workspace.getActiveFile();
				const suggestions = plugin.crossRefManager.getSuggestions(
					prefix,
					refType,
					activeFile?.path,
				);

				// Convert to completion options
				const options = suggestions.map((suggestion) => ({
					label: suggestion.key,
					type: 'text',
					detail: `${suggestion.type} (${suggestion.file})`,
					info: () => {
						const dom = document.createElement('div');
						dom.className = 'ref-completion-info';

						dom.createEl('div', {
							cls: 'ref-type-badge',
							text: suggestion.type.toUpperCase(),
						});

						dom.createEl('div', {
							cls: 'ref-location',
							text: `${suggestion.file}:${suggestion.line}`,
						});

						dom.createEl('div', {
							cls: 'ref-context',
							text: suggestion.context,
						});

						return dom;
					},
					apply: suggestion.key,
				}));

				return {
					from: before.from + before.text.lastIndexOf('{') + 1,
					options,
				};
			},
		],
		tooltipClass: () => 'ref-completion-tooltip',
	});
}
