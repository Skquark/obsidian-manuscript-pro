import { EditorSelection, StateEffect } from '@codemirror/state';
import {
	Decoration,
	DecorationSet,
	EditorView,
	MatchDecorator,
	PluginSpec,
	PluginValue,
	ViewPlugin,
	ViewUpdate,
	WidgetType,
} from '@codemirror/view';
import { editorLivePreviewField } from 'obsidian';
import { ConcealMatchDecorator } from './conceal-match-decorator';
import { syntaxTree } from '@codemirror/language';
import { PluginSettings } from '../interfaces/plugin-settings';

/**
 * Widget to display replacement text for concealed LaTeX commands
 */
class ReplacementWidget extends WidgetType {
	constructor(readonly text: string) {
		super();
	}

	toDOM(): HTMLElement {
		const span = document.createElement('span');
		span.className = 'manuscript-pro-replacement';
		span.textContent = this.text;
		return span;
	}

	ignoreEvent(): boolean {
		return false;
	}
}

class ConcealViewPlugin implements PluginValue {
	decorations: DecorationSet;
	matchDecorator: MatchDecorator;
	settings: PluginSettings;
	replacement: string;
	cursorLineFrom = -1;
	cursorLineTo = -1;
	lastCursorPos = -1;

	constructor(view: EditorView, regexp: RegExp, settings: PluginSettings, replacement = '') {
		this.settings = settings;
		this.replacement = replacement;
		this.matchDecorator = new ConcealMatchDecorator({
			regexp: regexp,
			decorate: (add, from, to, match, view): void => {
				// Define conditions where a decorator should not be added for a match
				if (this.isCodeblock(view, from, to)) return;

				// Cursor-aware revealing: skip decoration if cursor is on this line
				if (this.settings.cursorReveal.enabled && this.isCursorOnLine(view, from, to)) {
					return;
				}

				if (this.selectionAndRangeOverlap(view.state.selection, from, to)) return;

				// Add mark decorator for each capture group in regex
				for (let i = 1; i < match.length; i++) {
					// Fallback for older Electron builds without 'd' flag support
					if (!match.indices) {
						// Use manual calculation based on match groups
						// This is less accurate but works without indices
						let offset = 0;
						for (let j = 0; j < i; j++) {
							const groupStr = match[j] || '';
							offset += groupStr.length;
						}
						const captureStr = match[i] || '';
						const startPos = from + offset;
						const finalPos = startPos + captureStr.length;
						add(startPos, finalPos, Decoration.mark({ class: 'manuscript-pro-hide-match' }));
						continue;
					}

					const startPos = from + (match.indices[i][0] - match.index);
					const finalPos = from + (match.indices[i][1] - match.index);
					add(startPos, finalPos, Decoration.mark({ class: 'manuscript-pro-hide-match' }));
				}

				// If no capture groups, hide the entire match
				if (match.length === 1) {
					// Add replacement text widget FIRST if specified
					// Widget must be added before mark decoration for proper ordering
					if (this.replacement) {
						const widget = Decoration.widget({
							widget: new ReplacementWidget(this.replacement),
							side: -1,
						});
						add(from, from, widget);
					}

					// Then add the hiding mark decoration
					add(from, to, Decoration.mark({ class: 'manuscript-pro-hide-match' }));
				}
			},
		});

		this.decorations = this.initializeDecorations(view);
	}

	/**
	 * Check if cursor is on a line containing the match
	 */
	private isCursorOnLine(view: EditorView, from: number, to: number): boolean {
		const selection = view.state.selection.main;
		const cursorPos = selection.head;

		// Get line boundaries
		const line = view.state.doc.lineAt(cursorPos);

		if (this.settings.cursorReveal.revealParagraph) {
			// Reveal entire paragraph (block of text separated by blank lines)
			let paragraphStart = line.from;
			let paragraphEnd = line.to;

			// Scan backwards for paragraph start
			let currentLine = line.number - 1;
			while (currentLine > 0) {
				const prevLine = view.state.doc.line(currentLine);
				if (prevLine.text.trim() === '') break;
				paragraphStart = prevLine.from;
				currentLine--;
			}

			// Scan forwards for paragraph end
			currentLine = line.number + 1;
			const totalLines = view.state.doc.lines;
			while (currentLine <= totalLines) {
				const nextLine = view.state.doc.line(currentLine);
				if (nextLine.text.trim() === '') break;
				paragraphEnd = nextLine.to;
				currentLine++;
			}

			return from >= paragraphStart && to <= paragraphEnd;
		} else {
			// Reveal just the current line
			return from >= line.from && to <= line.to;
		}
	}

	/**
	 * isCodeblock returns true if the current match overlaps with a code block
	 * Exception: Pandoc raw LaTeX blocks (```{=latex}) are allowed to be concealed
	 */
	private isCodeblock(view: EditorView, from: number, to: number): boolean {
		// Check if we're inside a Pandoc raw LaTeX block
		// These blocks start with ```{=latex} and should be concealed
		const doc = view.state.doc;
		const lineStart = doc.lineAt(from);

		// Scan backwards to find the start of the code block
		for (let lineNum = lineStart.number; lineNum > 0; lineNum--) {
			const line = doc.line(lineNum);
			const text = line.text.trim();

			// Found opening fence
			if (text.startsWith('```')) {
				// If it's a Pandoc raw LaTeX block, allow concealment
				if (text === '```{=latex}') {
					return false; // Not a regular code block, allow concealment
				}
				// Otherwise it's a regular code block, prevent concealment
				return true;
			}

			// Stop if we hit a blank line (not in a code block)
			if (text === '') {
				break;
			}
		}

		// Also check syntax tree for inline code
		let isInlineCode = false;
		syntaxTree(view.state).iterate({
			from,
			to,
			enter: (node) => {
				if (/^inline-code/.test(node.name)) {
					isInlineCode = true;
					return false;
				}
			},
		});
		return isInlineCode;
	}

	/**
	 * selectionAndRangeOverlap returns true if the specified range
	 * overlaps with the current cursor location or selection range
	 */
	private selectionAndRangeOverlap(selection: EditorSelection, rangeFrom: number, rangeTo: number): boolean {
		for (const range of selection.ranges) {
			if (range.from <= rangeTo && range.to >= rangeFrom) {
				return true;
			}
		}
		return false;
	}

	update(update: ViewUpdate) {
		const isSourceMode = !update.state.field(editorLivePreviewField);
		const isEditorLayoutChanged = update.transactions.some((t) =>
			t.effects.some((e) => e.is(workspaceLayoutChangeEffect)),
		);

		// Reinitialize Decorations if source mode or recently switched back to Live Preview
		if (isSourceMode || isEditorLayoutChanged) {
			this.decorations = this.initializeDecorations(update.view);
			return;
		}

		// Track cursor position changes for revealing
		const selection = update.state.selection.main;
		const cursorPos = selection.head;
		const cursorLine = update.state.doc.lineAt(cursorPos);
		const cursorLineChanged = cursorLine.from !== this.cursorLineFrom || cursorLine.to !== this.cursorLineTo;

		// Re-decorate when cursor line changes OR when selection changes (click events)
		// This allows multi-line blocks to re-conceal when clicking away
		if (this.settings.cursorReveal.enabled && (cursorLineChanged || update.selectionSet)) {
			this.cursorLineFrom = cursorLine.from;
			this.cursorLineTo = cursorLine.to;
			this.lastCursorPos = cursorPos;
			// Force redecorating when cursor moves
			this.decorations = this.matchDecorator.createDeco(update.view);
			return;
		}

		// Update DecorationSet with MatchDecorator
		this.decorations = this.matchDecorator.updateDeco(update, this.decorations);
	}

	destroy() {}

	/**
	 * Initializes DecorationSet. Is disabled if the editor is in source mode.
	 */
	private initializeDecorations(view: EditorView): DecorationSet {
		return view.state.field(editorLivePreviewField) ? this.matchDecorator.createDeco(view) : Decoration.none;
	}
}

const pluginSpec: PluginSpec<ConcealViewPlugin> = {
	decorations: (instance: ConcealViewPlugin) => instance.decorations,
};

/**
 * concealViewPlugin creates a ViewPlugin to be registered as an editorExtension
 */
export const concealViewPlugin = (regexp: RegExp, settings: PluginSettings, replacement = '') => {
	return ViewPlugin.define((view) => new ConcealViewPlugin(view, regexp, settings, replacement), pluginSpec);
};

/**
 * A state effect that represents the workspace's layout change.
 * Mainly intended to detect when the user switches between live preview and source mode.
 */
export const workspaceLayoutChangeEffect = StateEffect.define<null>();
