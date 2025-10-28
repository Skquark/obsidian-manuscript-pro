import { Modal, App, Setting, Notice } from 'obsidian';
import { Character, CharacterRole, CharacterImportance } from './CharacterInterfaces';
import { CharacterManager } from './CharacterManager';

/**
 * Modal for editing full character profile
 */
export class CharacterProfileModal extends Modal {
	private manager: CharacterManager;
	private characterId: string;
	private character: Character;
	private onSave: () => void;
	private activeTab: string = 'basic';

	constructor(
		app: App,
		manager: CharacterManager,
		characterId: string,
		onSave: () => void
	) {
		super(app);
		this.manager = manager;
		this.characterId = characterId;
		this.onSave = onSave;

		const char = manager.getCharacter(characterId);
		if (!char) {
			throw new Error('Character not found');
		}
		this.character = JSON.parse(JSON.stringify(char)); // Deep copy
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass('character-profile-modal');

		// Title
		contentEl.createEl('h2', { text: `${this.character.name} - Character Profile` });

		// Tabs
		this.renderTabs();

		// Tab content
		this.renderTabContent();

		// Buttons
		this.renderButtons();
	}

	private renderTabs(): void {
		const { contentEl } = this;
		const tabsContainer = contentEl.createDiv('character-profile-tabs');

		const tabs = [
			{ id: 'basic', label: 'Basic Info', icon: 'user' },
			{ id: 'appearance', label: 'Appearance', icon: 'eye' },
			{ id: 'personality', label: 'Personality', icon: 'heart' },
			{ id: 'background', label: 'Background', icon: 'book' },
			{ id: 'arc', label: 'Character Arc', icon: 'trending-up' },
			{ id: 'relationships', label: 'Relationships', icon: 'users' }
		];

		tabs.forEach(tab => {
			const tabBtn = tabsContainer.createDiv('character-profile-tab');
			if (tab.id === this.activeTab) {
				tabBtn.addClass('active');
			}
			tabBtn.textContent = tab.label;
			tabBtn.addEventListener('click', () => {
				this.activeTab = tab.id;
				this.onOpen(); // Re-render
			});
		});
	}

	private renderTabContent(): void {
		const { contentEl } = this;

		// Remove old content
		const oldContent = contentEl.querySelector('.character-profile-content');
		if (oldContent) oldContent.remove();

		const contentContainer = contentEl.createDiv('character-profile-content');

		switch (this.activeTab) {
			case 'basic':
				this.renderBasicTab(contentContainer);
				break;
			case 'appearance':
				this.renderAppearanceTab(contentContainer);
				break;
			case 'personality':
				this.renderPersonalityTab(contentContainer);
				break;
			case 'background':
				this.renderBackgroundTab(contentContainer);
				break;
			case 'arc':
				this.renderArcTab(contentContainer);
				break;
			case 'relationships':
				this.renderRelationshipsTab(contentContainer);
				break;
		}
	}

	private renderBasicTab(container: HTMLElement): void {
		// Name
		new Setting(container)
			.setName('Name')
			.setDesc('Character\'s full name')
			.addText(text => text
				.setValue(this.character.name)
				.onChange(value => this.character.name = value)
			);

		// Role
		new Setting(container)
			.setName('Role')
			.setDesc('Character\'s role in the story')
			.addDropdown(dropdown => dropdown
				.addOption('protagonist', 'Protagonist')
				.addOption('antagonist', 'Antagonist')
				.addOption('supporting', 'Supporting')
				.addOption('minor', 'Minor')
				.addOption('other', 'Other')
				.setValue(this.character.role)
				.onChange((value: CharacterRole) => this.character.role = value)
			);

		// Importance
		new Setting(container)
			.setName('Importance')
			.setDesc('Character\'s importance level')
			.addDropdown(dropdown => dropdown
				.addOption('major', 'Major')
				.addOption('moderate', 'Moderate')
				.addOption('minor', 'Minor')
				.setValue(this.character.importance)
				.onChange((value: CharacterImportance) => this.character.importance = value)
			);

		// Tagline
		new Setting(container)
			.setName('Tagline')
			.setDesc('One-line character description')
			.addText(text => text
				.setValue(this.character.tagline || '')
				.setPlaceholder('e.g., "The reluctant hero"')
				.onChange(value => this.character.tagline = value || undefined)
			);

		// Summary
		new Setting(container)
			.setName('Summary')
			.setDesc('Longer character description')
			.addTextArea(text => {
				text.setValue(this.character.summary || '')
					.setPlaceholder('Character overview...')
					.onChange(value => this.character.summary = value || undefined);
				text.inputEl.rows = 4;
			});

		// Tags
		new Setting(container)
			.setName('Tags')
			.setDesc('Comma-separated tags for categorization')
			.addText(text => text
				.setValue(this.character.tags?.join(', ') || '')
				.setPlaceholder('e.g., hero, warrior, young')
				.onChange(value => {
					this.character.tags = value
						? value.split(',').map(t => t.trim()).filter(t => t.length > 0)
						: undefined;
				})
			);

		// Color
		new Setting(container)
			.setName('Color')
			.setDesc('Visual identification color')
			.addText(text => text
				.setValue(this.character.color || '')
				.setPlaceholder('#3498db')
				.onChange(value => this.character.color = value || undefined)
			);
	}

	private renderAppearanceTab(container: HTMLElement): void {
		if (!this.character.appearance) {
			this.character.appearance = {};
		}

		const app = this.character.appearance;

		new Setting(container)
			.setName('Age')
			.addText(text => text
				.setValue(app.age || '')
				.onChange(value => app.age = value || undefined)
			);

		new Setting(container)
			.setName('Gender')
			.addText(text => text
				.setValue(app.gender || '')
				.onChange(value => app.gender = value || undefined)
			);

		new Setting(container)
			.setName('Height')
			.addText(text => text
				.setValue(app.height || '')
				.setPlaceholder('e.g., 5\'10"')
				.onChange(value => app.height = value || undefined)
			);

		new Setting(container)
			.setName('Build')
			.addText(text => text
				.setValue(app.build || '')
				.setPlaceholder('e.g., athletic, slender')
				.onChange(value => app.build = value || undefined)
			);

		new Setting(container)
			.setName('Hair Color')
			.addText(text => text
				.setValue(app.hairColor || '')
				.onChange(value => app.hairColor = value || undefined)
			);

		new Setting(container)
			.setName('Hair Style')
			.addText(text => text
				.setValue(app.hairStyle || '')
				.onChange(value => app.hairStyle = value || undefined)
			);

		new Setting(container)
			.setName('Eye Color')
			.addText(text => text
				.setValue(app.eyeColor || '')
				.onChange(value => app.eyeColor = value || undefined)
			);

		new Setting(container)
			.setName('Skin Tone')
			.addText(text => text
				.setValue(app.skinTone || '')
				.onChange(value => app.skinTone = value || undefined)
			);

		new Setting(container)
			.setName('Distinguishing Features')
			.setDesc('Scars, tattoos, unique features')
			.addTextArea(text => {
				text.setValue(app.distinguishingFeatures || '')
					.onChange(value => app.distinguishingFeatures = value || undefined);
				text.inputEl.rows = 3;
			});

		new Setting(container)
			.setName('Typical Clothing')
			.addTextArea(text => {
				text.setValue(app.typicalClothing || '')
					.onChange(value => app.typicalClothing = value || undefined);
				text.inputEl.rows = 2;
			});
	}

	private renderPersonalityTab(container: HTMLElement): void {
		if (!this.character.personality) {
			this.character.personality = {};
		}

		const pers = this.character.personality;

		new Setting(container)
			.setName('Traits')
			.setDesc('Comma-separated personality traits')
			.addText(text => text
				.setValue(pers.traits?.join(', ') || '')
				.setPlaceholder('e.g., brave, impulsive, loyal')
				.onChange(value => {
					pers.traits = value
						? value.split(',').map(t => t.trim()).filter(t => t.length > 0)
						: undefined;
				})
			);

		new Setting(container)
			.setName('Strengths')
			.setDesc('Comma-separated strengths')
			.addText(text => text
				.setValue(pers.strengths?.join(', ') || '')
				.onChange(value => {
					pers.strengths = value
						? value.split(',').map(t => t.trim()).filter(t => t.length > 0)
						: undefined;
				})
			);

		new Setting(container)
			.setName('Weaknesses')
			.setDesc('Comma-separated weaknesses')
			.addText(text => text
				.setValue(pers.weaknesses?.join(', ') || '')
				.onChange(value => {
					pers.weaknesses = value
						? value.split(',').map(t => t.trim()).filter(t => t.length > 0)
						: undefined;
				})
			);

		new Setting(container)
			.setName('Fears')
			.setDesc('What the character fears')
			.addText(text => text
				.setValue(pers.fears?.join(', ') || '')
				.onChange(value => {
					pers.fears = value
						? value.split(',').map(t => t.trim()).filter(t => t.length > 0)
						: undefined;
				})
			);

		new Setting(container)
			.setName('Desires')
			.setDesc('What the character wants')
			.addText(text => text
				.setValue(pers.desires?.join(', ') || '')
				.onChange(value => {
					pers.desires = value
						? value.split(',').map(t => t.trim()).filter(t => t.length > 0)
						: undefined;
				})
			);

		new Setting(container)
			.setName('Quirks')
			.setDesc('Unique mannerisms or habits')
			.addText(text => text
				.setValue(pers.quirks?.join(', ') || '')
				.onChange(value => {
					pers.quirks = value
						? value.split(',').map(t => t.trim()).filter(t => t.length > 0)
						: undefined;
				})
			);
	}

	private renderBackgroundTab(container: HTMLElement): void {
		if (!this.character.background) {
			this.character.background = {};
		}

		const bg = this.character.background;

		new Setting(container)
			.setName('Birthplace')
			.addText(text => text
				.setValue(bg.birthplace || '')
				.onChange(value => bg.birthplace = value || undefined)
			);

		new Setting(container)
			.setName('Occupation')
			.addText(text => text
				.setValue(bg.occupation || '')
				.onChange(value => bg.occupation = value || undefined)
			);

		new Setting(container)
			.setName('Education')
			.addText(text => text
				.setValue(bg.education || '')
				.onChange(value => bg.education = value || undefined)
			);

		new Setting(container)
			.setName('Family')
			.setDesc('Family background and relationships')
			.addTextArea(text => {
				text.setValue(bg.family || '')
					.onChange(value => bg.family = value || undefined);
				text.inputEl.rows = 3;
			});

		new Setting(container)
			.setName('Backstory')
			.setDesc('Character\'s history before the story begins')
			.addTextArea(text => {
				text.setValue(bg.backstory || '')
					.onChange(value => bg.backstory = value || undefined);
				text.inputEl.rows = 5;
			});
	}

	private renderArcTab(container: HTMLElement): void {
		if (!this.character.arc) {
			this.character.arc = {};
		}

		const arc = this.character.arc;

		new Setting(container)
			.setName('Starting State')
			.setDesc('Who they are at the beginning')
			.addTextArea(text => {
				text.setValue(arc.startingState || '')
					.onChange(value => arc.startingState = value || undefined);
				text.inputEl.rows = 2;
			});

		new Setting(container)
			.setName('Goal')
			.setDesc('What they want')
			.addTextArea(text => {
				text.setValue(arc.goal || '')
					.onChange(value => arc.goal = value || undefined);
				text.inputEl.rows = 2;
			});

		new Setting(container)
			.setName('Motivation')
			.setDesc('Why they want it')
			.addTextArea(text => {
				text.setValue(arc.motivation || '')
					.onChange(value => arc.motivation = value || undefined);
				text.inputEl.rows = 2;
			});

		new Setting(container)
			.setName('Conflict')
			.setDesc('What stands in their way')
			.addTextArea(text => {
				text.setValue(arc.conflict || '')
					.onChange(value => arc.conflict = value || undefined);
				text.inputEl.rows = 2;
			});

		new Setting(container)
			.setName('Ending State')
			.setDesc('Who they become')
			.addTextArea(text => {
				text.setValue(arc.endingState || '')
					.onChange(value => arc.endingState = value || undefined);
				text.inputEl.rows = 2;
			});

		new Setting(container)
			.setName('Transformation')
			.setDesc('How they change')
			.addTextArea(text => {
				text.setValue(arc.transformation || '')
					.onChange(value => arc.transformation = value || undefined);
				text.inputEl.rows = 3;
			});
	}

	private renderRelationshipsTab(container: HTMLElement): void {
		container.createEl('p', {
			text: 'Character relationships',
			cls: 'character-relationships-note'
		});

		if (!this.character.relationships || this.character.relationships.length === 0) {
			container.createEl('p', { text: 'No relationships defined yet' });
		} else {
			this.character.relationships.forEach(rel => {
				const otherChar = this.manager.getCharacter(rel.characterId);
				if (otherChar) {
					const relDiv = container.createDiv('character-relationship-item');
					relDiv.createEl('strong', { text: otherChar.name });
					relDiv.createSpan({ text: ` - ${rel.type}` });
					if (rel.description) {
						relDiv.createEl('p', { text: rel.description });
					}
				}
			});
		}

		container.createEl('p', {
			text: 'Relationship management coming soon',
			cls: 'setting-item-description'
		});
	}

	private renderButtons(): void {
		const { contentEl } = this;

		// Remove old buttons
		const oldButtons = contentEl.querySelector('.modal-button-container');
		if (oldButtons) oldButtons.remove();

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
		// Update character in manager
		this.manager.updateCharacter(this.characterId, this.character);
		new Notice('Character saved');
		this.onSave();
		this.close();
	}

	onClose(): void {
		const { contentEl } = this;
		contentEl.empty();
	}
}
