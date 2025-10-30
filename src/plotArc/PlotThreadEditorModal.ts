/**
 * Plot Thread Editor Modal
 * Modal for editing plot thread details and milestones
 * TODO: Full implementation in Phase 2
 */

import { App, Modal } from 'obsidian';
import type LatexPandocConcealerPlugin from '../main';
import type { PlotThread } from './PlotArcInterfaces';

export class PlotThreadEditorModal extends Modal {
	private plugin: LatexPandocConcealerPlugin;
	private thread: PlotThread;
	private onSave: () => void;

	constructor(
		app: App,
		plugin: LatexPandocConcealerPlugin,
		thread: PlotThread,
		onSave: () => void
	) {
		super(app);
		this.plugin = plugin;
		this.thread = thread;
		this.onSave = onSave;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.createEl('h2', { text: 'Edit Plot Thread' });
		contentEl.createEl('p', { text: 'Full editor coming soon...' });
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
