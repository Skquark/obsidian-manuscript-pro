import { Menu } from 'obsidian';
import LatexPandocConcealerPlugin from '../main';

/**
 * Profile dropdown component for status bar
 */
export class ProfileDropdown {
	private plugin: LatexPandocConcealerPlugin;
	private buttonEl: HTMLElement;

	constructor(plugin: LatexPandocConcealerPlugin, statusBarItem: HTMLElement) {
		this.plugin = plugin;
		this.buttonEl = statusBarItem;

		// Make the entire status bar item clickable
		this.buttonEl.addClass('latex-pandoc-profile-dropdown');
		this.buttonEl.addEventListener('click', (e) => this.showMenu(e));
	}

	/**
	 * Show the profile dropdown menu
	 */
	private showMenu(event: MouseEvent): void {
		const menu = new Menu();

		// Get all profiles
		const profiles = this.plugin.profileManager.getAllProfiles();
		const activeProfile = this.plugin.profileManager.getActiveProfile();

		// Add profile items
		profiles.forEach((profile) => {
			menu.addItem((item) => {
				item
					.setTitle(`${profile.icon} ${profile.name}`)
					.setChecked(profile.id === activeProfile?.id)
					.onClick(async () => {
						await this.plugin.profileManager.applyProfile(profile.id);
					});

				// Add description as section if available
				if (profile.description) {
					item.setSection(profile.description);
				}
			});
		});

		// Add separator
		menu.addSeparator();

		// Add management options
		menu.addItem((item) => {
			item
				.setTitle('💾 Save Current as Profile...')
				.setIcon('save')
				.onClick(() => {
					this.promptSaveProfile();
				});
		});

		menu.addItem((item) => {
			item
				.setTitle('⚙️ Manage Profiles...')
				.setIcon('settings')
				.onClick(() => {
					// Open settings tab to profiles section
					// @ts-ignore - setting is available in Obsidian API
					this.plugin.app.setting.open();
					// @ts-ignore - setting is available in Obsidian API
					this.plugin.app.setting.openTabById(this.plugin.manifest.id);
				});
		});

		// Show menu at cursor position
		menu.showAtMouseEvent(event);
	}

	/**
	 * Prompt user to save current settings as a new profile
	 */
	private promptSaveProfile(): void {
		const modal = new SaveProfileModal(this.plugin.app, (name, description, icon) => {
			this.plugin.profileManager.saveCurrentAsProfile(name, description, icon);
		});
		modal.open();
	}

	/**
	 * Update the dropdown button text with active profile
	 */
	updateDisplay(): void {
		const activeProfile = this.plugin.profileManager.getActiveProfile();

		if (activeProfile) {
			this.buttonEl.setText(`${activeProfile.icon} ${activeProfile.name}`);
			this.buttonEl.title = `Active Profile: ${activeProfile.name}\n${activeProfile.description}\nClick to switch profiles`;
		} else {
			this.buttonEl.setText('⚙️ No Profile');
			this.buttonEl.title = 'Click to select a profile';
		}
	}
}

/**
 * Modal for saving current settings as a new profile
 */
import { App, Modal, Setting } from 'obsidian';

class SaveProfileModal extends Modal {
	private onSave: (name: string, description: string, icon: string) => void;
	private name = '';
	private description = '';
	private icon = '⚙️';

	constructor(app: App, onSave: (name: string, description: string, icon: string) => void) {
		super(app);
		this.onSave = onSave;
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.empty();

		contentEl.createEl('h2', { text: 'Save as New Profile' });

		// Name input
		new Setting(contentEl)
			.setName('Profile name')
			.setDesc('Enter a name for this profile')
			.addText((text) => {
				text
					.setPlaceholder('My Custom Profile')
					.setValue(this.name)
					.onChange((value) => {
						this.name = value;
					});
				text.inputEl.focus();
			});

		// Description input
		new Setting(contentEl)
			.setName('Description')
			.setDesc('Optional description')
			.addTextArea((text) => {
				text
					.setPlaceholder('Settings for...')
					.setValue(this.description)
					.onChange((value) => {
						this.description = value;
					});
			});

		// Icon input
		new Setting(contentEl)
			.setName('Icon')
			.setDesc('Emoji or icon for this profile')
			.addText((text) => {
				text
					.setPlaceholder('⚙️')
					.setValue(this.icon)
					.onChange((value) => {
						this.icon = value || '⚙️';
					});
			});

		// Buttons
		new Setting(contentEl)
			.addButton((btn) => {
				btn.setButtonText('Cancel').onClick(() => {
					this.close();
				});
			})
			.addButton((btn) => {
				btn
					.setButtonText('Save Profile')
					.setCta()
					.onClick(() => {
						if (!this.name.trim()) {
							new Notice('Please enter a profile name');
							return;
						}
						this.onSave(this.name, this.description, this.icon);
						this.close();
					});
			});
	}

	onClose(): void {
		const { contentEl } = this;
		contentEl.empty();
	}
}

import { Notice } from 'obsidian';
