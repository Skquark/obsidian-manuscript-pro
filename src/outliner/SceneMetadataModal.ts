import { Modal, App, Setting, Notice, TFile } from 'obsidian';
import { Scene, SceneStatus } from './OutlinerInterfaces';
import { OutlinerManager } from './OutlinerManager';

/**
 * Modal for editing scene metadata
 */
export class SceneMetadataModal extends Modal {
	private manager: OutlinerManager;
	private manuscriptId: string;
	private sceneId: string;
	private scene: Scene;
	private onSave: () => void;

	// Form fields
	private titleInput!: HTMLInputElement;
	private summaryInput!: HTMLTextAreaElement;
	private notesInput!: HTMLTextAreaElement;
	private povInput!: HTMLInputElement;
	private locationInput!: HTMLInputElement;
	private timeOfDayInput!: HTMLSelectElement;
	private dateInStoryInput!: HTMLInputElement;
	private toneInput!: HTMLInputElement;
	private plotThreadsInput!: HTMLInputElement;
	private statusSelect!: HTMLSelectElement;
	private wordCountInput!: HTMLInputElement;

	constructor(
		app: App,
		manager: OutlinerManager,
		manuscriptId: string,
		sceneId: string,
		onSave: () => void
	) {
		super(app);
		this.manager = manager;
		this.manuscriptId = manuscriptId;
		this.sceneId = sceneId;
		this.onSave = onSave;

		const scene = manager.getScene(manuscriptId, sceneId);
		if (!scene) {
			throw new Error('Scene not found');
		}
		this.scene = scene;
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass('scene-metadata-modal');

		// Title
		contentEl.createEl('h2', { text: 'Edit Scene Metadata' });

		// Create form
		this.createForm();

		// Buttons
		this.createButtons();
	}

	private createForm(): void {
		const { contentEl } = this;
		const form = contentEl.createDiv('scene-metadata-form');

		// Scene title
		new Setting(form)
			.setName('Scene title')
			.setDesc('A descriptive title for this scene')
			.addText(text => {
				this.titleInput = text.inputEl;
				text.setValue(this.scene.title)
					.setPlaceholder('e.g., "Opening confrontation"');
			});

		// Summary
		new Setting(form)
			.setName('Summary')
			.setDesc('Brief summary of what happens in this scene')
			.addTextArea(text => {
				this.summaryInput = text.inputEl;
				text.setValue(this.scene.summary || '')
					.setPlaceholder('What happens in this scene?');
				text.inputEl.rows = 3;
			});

		// Status
		new Setting(form)
			.setName('Status')
			.setDesc('Current scene status')
			.addDropdown(dropdown => {
				this.statusSelect = dropdown.selectEl;
				dropdown
					.addOption('outline', 'Outline')
					.addOption('draft', 'Draft')
					.addOption('revision', 'Revision')
					.addOption('complete', 'Complete')
					.setValue(this.scene.metadata.status);
			});

		// Divider
		form.createEl('h3', { text: 'Scene Details' });

		// POV (Point of View)
		new Setting(form)
			.setName('POV Character')
			.setDesc('Which character\'s perspective is this scene from?')
			.addText(text => {
				this.povInput = text.inputEl;
				text.setValue(this.scene.metadata.pov || '')
					.setPlaceholder('e.g., "Emma" or "Third person"');
			});

		// Location
		new Setting(form)
			.setName('Location')
			.setDesc('Where does this scene take place?')
			.addText(text => {
				this.locationInput = text.inputEl;
				text.setValue(this.scene.metadata.location || '')
					.setPlaceholder('e.g., "Coffee shop" or "London, 1888"');
			});

		// Time of day
		new Setting(form)
			.setName('Time of day')
			.setDesc('When does this scene occur?')
			.addDropdown(dropdown => {
				this.timeOfDayInput = dropdown.selectEl;
				dropdown
					.addOption('', '-- Not set --')
					.addOption('dawn', 'Dawn')
					.addOption('morning', 'Morning')
					.addOption('noon', 'Noon')
					.addOption('afternoon', 'Afternoon')
					.addOption('evening', 'Evening')
					.addOption('dusk', 'Dusk')
					.addOption('night', 'Night')
					.addOption('midnight', 'Midnight')
					.setValue(this.scene.metadata.timeOfDay || '');
			});

		// Date in story
		new Setting(form)
			.setName('Story date')
			.setDesc('When in the story timeline does this occur?')
			.addText(text => {
				this.dateInStoryInput = text.inputEl;
				text.setValue(this.scene.metadata.dateInStory || '')
					.setPlaceholder('e.g., "Day 3" or "March 15, 1888"');
			});

		// Tone
		new Setting(form)
			.setName('Tone')
			.setDesc('Emotional tone or atmosphere of the scene')
			.addText(text => {
				this.toneInput = text.inputEl;
				text.setValue(this.scene.metadata.tone || '')
					.setPlaceholder('e.g., "Tense", "Romantic", "Action-packed"');
			});

		// Plot threads
		new Setting(form)
			.setName('Plot threads')
			.setDesc('Comma-separated list of plot threads this scene advances')
			.addText(text => {
				this.plotThreadsInput = text.inputEl;
				const threads = this.scene.metadata.plotThreads?.join(', ') || '';
				text.setValue(threads)
					.setPlaceholder('e.g., "Main mystery, Character arc, Romance"');
			});

		// Divider
		form.createEl('h3', { text: 'Additional Information' });

		// Notes
		new Setting(form)
			.setName('Notes')
			.setDesc('Additional notes, reminders, or research for this scene')
			.addTextArea(text => {
				this.notesInput = text.inputEl;
				text.setValue(this.scene.notes || '')
					.setPlaceholder('Scene notes, research, reminders...');
				text.inputEl.rows = 4;
			});

		// Word count
		new Setting(form)
			.setName('Word count')
			.setDesc('Manually set word count (or link to file for automatic counting)')
			.addText(text => {
				this.wordCountInput = text.inputEl;
				text.setValue(this.scene.wordCount.toString())
					.setPlaceholder('0');
				text.inputEl.type = 'number';
			});

		// Linked file
		if (this.scene.file) {
			const fileSetting = new Setting(form)
				.setName('Linked file')
				.setDesc('This scene is linked to: ' + this.scene.file.path);

			fileSetting.addButton(btn => btn
				.setButtonText('Open file')
				.onClick(() => {
					if (this.scene.file) {
						this.app.workspace.getLeaf(false).openFile(this.scene.file);
						this.close();
					}
				})
			);

			fileSetting.addButton(btn => btn
				.setButtonText('Unlink')
				.onClick(() => {
					this.manager.updateScene(this.manuscriptId, this.sceneId, { file: undefined });
					new Notice('File unlinked');
					this.close();
					this.onSave();
				})
			);
		} else {
			new Setting(form)
				.setName('Link to file')
				.setDesc('Link this scene to a markdown file')
				.addButton(btn => btn
					.setButtonText('Link file')
					.onClick(() => this.linkToFile())
				);
		}
	}

	private createButtons(): void {
		const { contentEl } = this;
		const buttonContainer = contentEl.createDiv('modal-button-container');

		// Cancel button
		const cancelBtn = buttonContainer.createEl('button', { text: 'Cancel' });
		cancelBtn.addEventListener('click', () => this.close());

		// Save button
		const saveBtn = buttonContainer.createEl('button', {
			text: 'Save',
			cls: 'mod-cta'
		});
		saveBtn.addEventListener('click', () => this.save());
	}

	private save(): void {
		// Parse plot threads
		const plotThreadsStr = this.plotThreadsInput.value.trim();
		const plotThreads = plotThreadsStr
			? plotThreadsStr.split(',').map(t => t.trim()).filter(t => t.length > 0)
			: undefined;

		// Update scene
		this.manager.updateScene(this.manuscriptId, this.sceneId, {
			title: this.titleInput.value.trim() || 'Untitled Scene',
			summary: this.summaryInput.value.trim() || undefined,
			notes: this.notesInput.value.trim() || undefined,
			metadata: {
				pov: this.povInput.value.trim() || undefined,
				location: this.locationInput.value.trim() || undefined,
				timeOfDay: this.timeOfDayInput.value || undefined,
				dateInStory: this.dateInStoryInput.value.trim() || undefined,
				tone: this.toneInput.value.trim() || undefined,
				plotThreads,
				status: this.statusSelect.value as SceneStatus
			},
			wordCount: parseInt(this.wordCountInput.value) || 0
		});

		new Notice('Scene metadata saved');
		this.onSave();
		this.close();
	}

	private linkToFile(): void {
		// Simple file selector - in a real implementation, this would use a file chooser
		const filename = prompt('Enter the path to the markdown file:');
		if (!filename) return;

		const file = this.app.vault.getAbstractFileByPath(filename);
		if (file instanceof TFile && file.extension === 'md') {
			this.manager.linkSceneToFile(this.manuscriptId, this.sceneId, file);
			new Notice('File linked');
			this.close();
			this.onSave();
		} else {
			new Notice('File not found or not a markdown file');
		}
	}

	onClose(): void {
		const { contentEl } = this;
		contentEl.empty();
	}
}
