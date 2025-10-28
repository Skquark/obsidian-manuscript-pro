/**
 * Goal Editor Modal
 * Rich UI for creating and editing writing goals
 */

import { App, Modal, Setting, Notice } from 'obsidian';
import type { WritingGoal } from './StatsInterfaces';

export class GoalEditorModal extends Modal {
	private goal: Partial<WritingGoal>;
	private onSave: (goal: WritingGoal) => void;
	private isEdit: boolean;

	constructor(app: App, existingGoal: WritingGoal | null, onSave: (goal: WritingGoal) => void) {
		super(app);
		this.isEdit = !!existingGoal;
		this.goal = existingGoal || {
			type: 'daily',
			targetWords: 1000,
			manuscript: 'all',
		};
		this.onSave = onSave;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass('goal-editor-modal');

		// Title
		const title = contentEl.createEl('h2', {
			text: this.isEdit ? 'Edit Writing Goal' : 'Create Writing Goal',
			cls: 'goal-editor-title',
		});

		// Goal name
		new Setting(contentEl)
			.setName('Goal name')
			.setDesc('Give your goal a memorable name')
			.addText((text) => {
				text.setPlaceholder('e.g., Daily Writing Practice')
					.setValue(this.goal.name || '')
					.onChange((value) => {
						this.goal.name = value;
					});
				text.inputEl.focus();
			});

		// Goal type
		new Setting(contentEl)
			.setName('Goal type')
			.setDesc('Choose the time frame for this goal')
			.addDropdown((dropdown) => {
				dropdown
					.addOption('daily', '📅 Daily Goal')
					.addOption('weekly', '📆 Weekly Goal')
					.addOption('project', '📖 Project Goal')
					.addOption('session', '⏱️ Session Goal')
					.setValue(this.goal.type || 'daily')
					.onChange((value) => {
						this.goal.type = value as WritingGoal['type'];
						this.renderTargetSection(contentEl);
					});
			});

		// Target section (will be re-rendered based on type)
		this.renderTargetSection(contentEl);

		// Manuscript selection
		new Setting(contentEl)
			.setName('Apply to')
			.setDesc('Track goal for a specific manuscript or all writing')
			.addDropdown((dropdown) => {
				dropdown
					.addOption('all', 'All writing')
					.setValue(this.goal.manuscript || 'all')
					.onChange((value) => {
						this.goal.manuscript = value;
					});

				// TODO: Add manuscript files from vault
				// Could scan for book-manifest.json or common manuscript patterns
			});

		// Buttons
		const buttonContainer = contentEl.createDiv({ cls: 'goal-editor-buttons' });

		const cancelButton = buttonContainer.createEl('button', {
			text: 'Cancel',
			cls: 'goal-editor-button-secondary',
		});
		cancelButton.onclick = () => this.close();

		const saveButton = buttonContainer.createEl('button', {
			text: this.isEdit ? 'Save Changes' : 'Create Goal',
			cls: 'goal-editor-button-primary',
		});
		saveButton.onclick = () => this.save();

		// Add styles
		this.addStyles();
	}

	private renderTargetSection(container: HTMLElement) {
		// Remove existing target section if present
		const existing = container.querySelector('.goal-target-section');
		if (existing) existing.remove();

		const section = container.createDiv({ cls: 'goal-target-section' });

		// Target words
		new Setting(section)
			.setName('Target word count')
			.setDesc(this.getTargetDescription())
			.addText((text) => {
				text.setPlaceholder('1000')
					.setValue(this.goal.targetWords?.toString() || '')
					.onChange((value) => {
						const num = parseInt(value);
						if (!isNaN(num) && num > 0) {
							this.goal.targetWords = num;
						}
					});
				text.inputEl.type = 'number';
				text.inputEl.min = '1';
				text.inputEl.step = '100';
			});

		// Show deadline for project and weekly goals
		if (this.goal.type === 'project' || this.goal.type === 'weekly') {
			new Setting(section)
				.setName('Deadline (optional)')
				.setDesc('Set a target completion date')
				.addText((text) => {
					if (this.goal.deadline) {
						const date = new Date(this.goal.deadline);
						text.setValue(date.toISOString().split('T')[0]);
					}
					text.inputEl.type = 'date';
					text.onChange((value) => {
						if (value) {
							this.goal.deadline = new Date(value).getTime();
						} else {
							this.goal.deadline = undefined;
						}
					});
				});
		}

		// Show estimated days for project goals
		if (this.goal.type === 'project' && this.goal.targetWords) {
			this.renderProjectEstimate(section);
		}
	}

	private renderProjectEstimate(container: HTMLElement) {
		const estimateDiv = container.createDiv({ cls: 'goal-estimate' });
		estimateDiv.createEl('h6', { text: 'Project Estimate' });

		const assumedDailyWords = 1000; // Default assumption
		const daysNeeded = Math.ceil((this.goal.targetWords || 0) / assumedDailyWords);

		estimateDiv.createEl('p', {
			text: `At ${assumedDailyWords} words/day, this will take approximately ${daysNeeded} days.`,
			cls: 'goal-estimate-text',
		});

		estimateDiv.createEl('p', {
			text: 'The system will adjust this estimate based on your actual writing velocity.',
			cls: 'goal-estimate-note',
		});
	}

	private getTargetDescription(): string {
		switch (this.goal.type) {
			case 'daily':
				return 'Words to write each day';
			case 'weekly':
				return 'Total words to write this week';
			case 'project':
				return 'Total words for the entire project';
			case 'session':
				return 'Words to write in each writing session';
			default:
				return 'Target word count';
		}
	}

	private save() {
		// Validation
		if (!this.goal.name || this.goal.name.trim() === '') {
			new Notice('Please enter a goal name');
			return;
		}

		if (!this.goal.targetWords || this.goal.targetWords <= 0) {
			new Notice('Please enter a valid target word count');
			return;
		}

		// Create full goal object
		const fullGoal: WritingGoal = {
			id: this.isEdit && (this.goal as WritingGoal).id ? (this.goal as WritingGoal).id : Date.now().toString(),
			name: this.goal.name,
			type: this.goal.type || 'daily',
			targetWords: this.goal.targetWords,
			deadline: this.goal.deadline,
			currentWords: this.isEdit ? (this.goal as WritingGoal).currentWords : 0,
			createdAt: this.isEdit ? (this.goal as WritingGoal).createdAt : Date.now(),
			manuscript: this.goal.manuscript || 'all',
			completed: (this.goal as WritingGoal).completed || false,
			completedAt: (this.goal as WritingGoal).completedAt,
		};

		this.onSave(fullGoal);
		new Notice(`Goal ${this.isEdit ? 'updated' : 'created'}: ${fullGoal.name}`);
		this.close();
	}

	private addStyles() {
		// Styles are added to main styles.css
		// This is a placeholder for any dynamic styling needs
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
