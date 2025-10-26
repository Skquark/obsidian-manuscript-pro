import { EditorView, ViewPlugin, ViewUpdate, Decoration, DecorationSet } from '@codemirror/view';
import { RangeSetBuilder } from '@codemirror/state';
import { syntaxTree } from '@codemirror/language';
import { PluginSettings } from '../interfaces/plugin-settings';

/**
 * CodeMirror view plugin for typewriter dimming effect
 * Dims all text except the active zone (sentence/paragraph/section)
 */
export function createTypewriterPlugin(getSettings: () => PluginSettings) {
	return ViewPlugin.fromClass(
		class {
			decorations: DecorationSet;
			settings: PluginSettings;

			constructor(view: EditorView) {
				this.settings = getSettings();
				this.decorations = this.buildDecorations(view);
			}

			update(update: ViewUpdate) {
				this.settings = getSettings();

				// Rebuild if selection changed or settings changed
				if (update.selectionSet || update.docChanged || update.viewportChanged) {
					this.decorations = this.buildDecorations(update.view);
				}
			}

			buildDecorations(view: EditorView): DecorationSet {
				const settings = this.settings.focusMode;

				// Only apply if typewriter mode is enabled
				if (!settings.enabled || !settings.typewriterMode) {
					return Decoration.none;
				}

				const builder = new RangeSetBuilder<Decoration>();
				const selection = view.state.selection.main;
				const cursorPos = selection.head;

				// Get active zone range
				const activeRange = this.getActiveZone(view, cursorPos, settings.activeZone);

				// Dim everything before active zone
				if (activeRange.from > 0) {
					builder.add(
						0,
						activeRange.from,
						Decoration.mark({
							class: 'typewriter-dimmed',
							attributes: {
								style: `opacity: ${settings.dimOpacity}`
							}
						})
					);
				}

				// Optionally highlight active zone
				if (settings.highlightActive) {
					builder.add(
						activeRange.from,
						activeRange.to,
						Decoration.mark({
							class: 'typewriter-active',
							attributes: {
								style: `background-color: ${settings.highlightColor}`
							}
						})
					);
				}

				// Dim everything after active zone
				if (activeRange.to < view.state.doc.length) {
					builder.add(
						activeRange.to,
						view.state.doc.length,
						Decoration.mark({
							class: 'typewriter-dimmed',
							attributes: {
								style: `opacity: ${settings.dimOpacity}`
							}
						})
					);
				}

				return builder.finish();
			}

			/**
			 * Get the range of the active zone based on cursor position and zone type
			 */
			private getActiveZone(
				view: EditorView,
				pos: number,
				zoneType: 'sentence' | 'paragraph' | 'section'
			): { from: number; to: number } {
				switch (zoneType) {
					case 'sentence':
						return this.getSentenceRange(view, pos);
					case 'paragraph':
						return this.getParagraphRange(view, pos);
					case 'section':
						return this.getSectionRange(view, pos);
					default:
						return this.getParagraphRange(view, pos);
				}
			}

			/**
			 * Get sentence range around cursor position
			 */
			private getSentenceRange(view: EditorView, pos: number): { from: number; to: number } {
				const line = view.state.doc.lineAt(pos);
				const text = line.text;
				const posInLine = pos - line.from;

				// Find sentence boundaries (. ! ?)
				const sentenceEnders = /[.!?]\s/g;

				// Find start of sentence
				let from = line.from;
				const beforeCursor = text.substring(0, posInLine);
				const lastEnder = beforeCursor.lastIndexOf('.');
				const lastQuestion = beforeCursor.lastIndexOf('?');
				const lastExclaim = beforeCursor.lastIndexOf('!');
				const lastSentenceEnd = Math.max(lastEnder, lastQuestion, lastExclaim);

				if (lastSentenceEnd >= 0) {
					from = line.from + lastSentenceEnd + 1;
					// Skip whitespace after sentence ender
					while (from < pos && /\s/.test(view.state.doc.sliceString(from, from + 1))) {
						from++;
					}
				}

				// Find end of sentence
				let to = line.to;
				const afterCursor = text.substring(posInLine);
				const match = afterCursor.match(sentenceEnders);
				if (match && match.index !== undefined) {
					to = pos + match.index + 1;
				}

				return { from, to };
			}

			/**
			 * Get paragraph range around cursor position
			 */
			private getParagraphRange(view: EditorView, pos: number): { from: number; to: number } {
				const line = view.state.doc.lineAt(pos);

				let from = line.from;
				let to = line.to;

				// Scan backwards for paragraph start (blank line)
				let currentLine = line.number - 1;
				while (currentLine > 0) {
					const prevLine = view.state.doc.line(currentLine);
					if (prevLine.text.trim() === '') {
						break;
					}
					from = prevLine.from;
					currentLine--;
				}

				// Scan forwards for paragraph end (blank line)
				currentLine = line.number + 1;
				const totalLines = view.state.doc.lines;
				while (currentLine <= totalLines) {
					const nextLine = view.state.doc.line(currentLine);
					if (nextLine.text.trim() === '') {
						break;
					}
					to = nextLine.to;
					currentLine++;
				}

				return { from, to };
			}

			/**
			 * Get section range around cursor position
			 */
			private getSectionRange(view: EditorView, pos: number): { from: number; to: number } {
				const line = view.state.doc.lineAt(pos);
				const currentLevel = this.getHeadingLevel(line.text);

				let from = 0; // Start of document by default
				let to = view.state.doc.length;

				// Scan backwards for heading of same or higher level
				let currentLine = line.number - 1;
				while (currentLine > 0) {
					const prevLine = view.state.doc.line(currentLine);
					const level = this.getHeadingLevel(prevLine.text);

					if (level > 0 && level <= currentLevel) {
						from = prevLine.from;
						break;
					}
					currentLine--;
				}

				// Scan forwards for heading of same or higher level
				currentLine = line.number + 1;
				const totalLines = view.state.doc.lines;
				while (currentLine <= totalLines) {
					const nextLine = view.state.doc.line(currentLine);
					const level = this.getHeadingLevel(nextLine.text);

					if (level > 0 && level <= currentLevel) {
						to = nextLine.from;
						break;
					}
					currentLine++;
				}

				return { from, to };
			}

			/**
			 * Get markdown heading level (1-6) or 0 if not a heading
			 */
			private getHeadingLevel(text: string): number {
				const match = text.match(/^(#{1,6})\s/);
				return match ? match[1].length : 0;
			}
		},
		{
			decorations: v => v.decorations
		}
	);
}
