import { Notice } from 'obsidian';
import { v4 as uuidv4 } from 'uuid';
import LatexPandocConcealerPlugin from '../main';
import { ConcealerProfile, ProfileManagerData, SerializableProfile } from './ProfileInterface';
import { PluginSettings } from '../interfaces/plugin-settings';

/**
 * Manages concealer profiles - create, load, save, delete, import/export
 */
export class ProfileManager {
	private plugin: LatexPandocConcealerPlugin;
	private profiles: Map<string, ConcealerProfile>;
	private activeProfileId: string;
	private defaultProfileId: string;

	constructor(plugin: LatexPandocConcealerPlugin) {
		this.plugin = plugin;
		this.profiles = new Map();
		this.activeProfileId = '';
		this.defaultProfileId = '';
	}

	/**
	 * Initialize the profile manager with default profiles
	 */
	async initialize(): Promise<void> {
		// Load saved profiles from plugin data
		const data = await this.loadProfileData();

		if (data && data.profiles.length > 0) {
			// Load existing profiles
			data.profiles.forEach(profile => {
				this.profiles.set(profile.id, profile);
			});
			this.activeProfileId = data.activeProfileId;
			this.defaultProfileId = data.defaultProfileId;
		} else {
			// Create default profiles
			await this.createDefaultProfiles();
		}

		if (this.plugin.settings.debugMode) {
			console.log('ProfileManager initialized with', this.profiles.size, 'profiles');
		}
	}

	/**
	 * Create the 6 default profiles
	 */
	async createDefaultProfiles(): Promise<void> {
		// Profile 1: Full Concealment (default)
		const fullProfile = this.createProfile(
			'Full Concealment',
			'All syntax concealed for clean reading',
			'👁️',
			{
				enabled: true,
				groups: {
					mathDelimiters: true,
					citations: true,
					latexCommands: true,
					pandocMarkup: true,
					indexingMeta: true,
				},
				focusMode: {
					...this.plugin.settings.focusMode,
					enabled: false,
				}
			},
			true // isDefault
		);
		this.defaultProfileId = fullProfile.id;
		this.activeProfileId = fullProfile.id;

		// Profile 2: Math Review
		this.createProfile(
			'Math Review',
			'Only math visible, everything else concealed',
			'🔬',
			{
				enabled: true,
				groups: {
					mathDelimiters: false,
					citations: true,
					latexCommands: true,
					pandocMarkup: true,
					indexingMeta: true,
				},
			},
			true
		);

		// Profile 3: Citation Check
		this.createProfile(
			'Citation Check',
			'Only citations visible for bibliography review',
			'📚',
			{
				enabled: true,
				groups: {
					mathDelimiters: true,
					citations: false,
					latexCommands: true,
					pandocMarkup: true,
					indexingMeta: true,
				},
			},
			true
		);

		// Profile 4: Clean Prose
		this.createProfile(
			'Clean Prose',
			'All syntax hidden + Focus Mode for writing',
			'✍️',
			{
				enabled: true,
				groups: {
					mathDelimiters: true,
					citations: true,
					latexCommands: true,
					pandocMarkup: true,
					indexingMeta: true,
				},
				focusMode: {
					...this.plugin.settings.focusMode,
					enabled: true,
					typewriterMode: true,
					centerText: true,
				}
			},
			true
		);

		// Profile 5: Technical Edit
		this.createProfile(
			'Technical Edit',
			'No concealment, all syntax visible',
			'🔧',
			{
				enabled: false,
				groups: {
					mathDelimiters: false,
					citations: false,
					latexCommands: false,
					pandocMarkup: false,
					indexingMeta: false,
				},
				focusMode: {
					...this.plugin.settings.focusMode,
					enabled: false,
				}
			},
			true
		);

		// Profile 6: Final Proofread
		this.createProfile(
			'Final Proofread',
			'Minimal concealment for final review',
			'📝',
			{
				enabled: true,
				groups: {
					mathDelimiters: true,
					citations: false,
					latexCommands: false,
					pandocMarkup: true,
					indexingMeta: true,
				},
				focusMode: {
					...this.plugin.settings.focusMode,
					enabled: true,
					typewriterMode: false,
					centerText: true,
				}
			},
			true
		);

		await this.saveProfileData();
	}

	/**
	 * Create a new profile
	 */
	createProfile(
		name: string,
		description = '',
		icon = '⚙️',
		settings: Partial<PluginSettings> = {},
		isDefault = false
	): ConcealerProfile {
		const profile: ConcealerProfile = {
			id: uuidv4(),
			name,
			description,
			icon,
			settings,
			createdAt: Date.now(),
			modifiedAt: Date.now(),
			isDefault,
			isActive: false,
		};

		this.profiles.set(profile.id, profile);

		if (this.plugin.settings.debugMode) {
			console.log('Created profile:', profile.name);
		}

		return profile;
	}

	/**
	 * Get a profile by ID
	 */
	getProfile(id: string): ConcealerProfile | undefined {
		return this.profiles.get(id);
	}

	/**
	 * Get all profiles
	 */
	getAllProfiles(): ConcealerProfile[] {
		return Array.from(this.profiles.values());
	}

	/**
	 * Get the currently active profile
	 */
	getActiveProfile(): ConcealerProfile | undefined {
		return this.profiles.get(this.activeProfileId);
	}

	/**
	 * Update a profile
	 */
	updateProfile(id: string, updates: Partial<ConcealerProfile>): void {
		const profile = this.profiles.get(id);
		if (!profile) {
			new Notice('Profile not found');
			return;
		}

		if (profile.isDefault && (updates.name || updates.settings)) {
			new Notice('Cannot modify default profile settings. Create a duplicate instead.');
			return;
		}

		Object.assign(profile, updates, { modifiedAt: Date.now() });
		this.saveProfileData();
	}

	/**
	 * Delete a profile
	 */
	deleteProfile(id: string): void {
		const profile = this.profiles.get(id);
		if (!profile) {
			new Notice('Profile not found');
			return;
		}

		if (profile.isDefault) {
			new Notice('Cannot delete default profiles');
			return;
		}

		if (id === this.activeProfileId) {
			// Switch to default profile before deleting
			this.applyProfile(this.defaultProfileId);
		}

		this.profiles.delete(id);
		this.saveProfileData();
		new Notice(`Profile "${profile.name}" deleted`);
	}

	/**
	 * Duplicate a profile
	 */
	duplicateProfile(id: string, newName: string): ConcealerProfile | null {
		const original = this.profiles.get(id);
		if (!original) {
			new Notice('Profile not found');
			return null;
		}

		const duplicate = this.createProfile(
			newName,
			original.description,
			original.icon,
			{ ...original.settings },
			false // Not a default profile
		);

		this.saveProfileData();
		new Notice(`Profile "${newName}" created`);
		return duplicate;
	}

	/**
	 * Apply a profile (load its settings)
	 */
	async applyProfile(id: string): Promise<void> {
		const profile = this.profiles.get(id);
		if (!profile) {
			new Notice('Profile not found');
			return;
		}

		// Mark previous profile as inactive
		if (this.activeProfileId) {
			const prevProfile = this.profiles.get(this.activeProfileId);
			if (prevProfile) {
				prevProfile.isActive = false;
			}
		}

		// Mark new profile as active
		profile.isActive = true;
		this.activeProfileId = id;

		// Apply profile settings to plugin
		Object.assign(this.plugin.settings, profile.settings);
		await this.plugin.saveSettings();

		// Update editor extensions
		this.plugin.updateEditorExtension();

		// Update Focus Mode if needed
		if (profile.settings.focusMode?.enabled) {
			this.plugin.focusModeManager.enable();
		} else if (this.plugin.focusModeManager.isEnabled()) {
			this.plugin.focusModeManager.disable();
		}

		// Update UI
		this.plugin.updateStatusBar();

		await this.saveProfileData();

		if (this.plugin.settings.debugMode) {
			console.log('Applied profile:', profile.name);
		}

		new Notice(`Profile: ${profile.name}`);
	}

	/**
	 * Save current settings as a new profile
	 */
	saveCurrentAsProfile(name: string, description = '', icon = '⚙️'): ConcealerProfile {
		const profile = this.createProfile(
			name,
			description,
			icon,
			{ ...this.plugin.settings },
			false
		);

		this.saveProfileData();
		new Notice(`Profile "${name}" saved`);
		return profile;
	}

	/**
	 * Export a profile as JSON
	 */
	exportProfile(id: string): string {
		const profile = this.profiles.get(id);
		if (!profile) {
			throw new Error('Profile not found');
		}

		const serializable: SerializableProfile = {
			name: profile.name,
			description: profile.description,
			icon: profile.icon,
			settings: profile.settings,
			hotkey: profile.hotkey,
			version: this.plugin.manifest.version,
		};

		return JSON.stringify(serializable, null, 2);
	}

	/**
	 * Export all profiles as JSON
	 */
	exportAllProfiles(): string {
		const allProfiles = this.getAllProfiles().map(profile => ({
			name: profile.name,
			description: profile.description,
			icon: profile.icon,
			settings: profile.settings,
			hotkey: profile.hotkey,
			version: this.plugin.manifest.version,
		}));

		return JSON.stringify(allProfiles, null, 2);
	}

	/**
	 * Import a profile from JSON
	 */
	importProfile(json: string): ConcealerProfile | null {
		try {
			const data: SerializableProfile = JSON.parse(json);

			// Validate required fields
			if (!data.name || !data.settings) {
				new Notice('Invalid profile format');
				return null;
			}

			// Create profile
			const profile = this.createProfile(
				data.name,
				data.description || '',
				data.icon || '⚙️',
				data.settings,
				false
			);

			if (data.hotkey) {
				profile.hotkey = data.hotkey;
			}

			this.saveProfileData();
			new Notice(`Profile "${data.name}" imported`);
			return profile;
		} catch (e) {
			new Notice('Failed to import profile: Invalid JSON');
			console.error('Import error:', e);
			return null;
		}
	}

	/**
	 * Import multiple profiles from JSON array
	 */
	importProfiles(json: string): number {
		try {
			const dataArray: SerializableProfile[] = JSON.parse(json);

			if (!Array.isArray(dataArray)) {
				new Notice('Invalid format: Expected array of profiles');
				return 0;
			}

			let imported = 0;
			dataArray.forEach(data => {
				if (data.name && data.settings) {
					this.createProfile(
						data.name,
						data.description || '',
						data.icon || '⚙️',
						data.settings,
						false
					);
					imported++;
				}
			});

			this.saveProfileData();
			new Notice(`Imported ${imported} profile(s)`);
			return imported;
		} catch (e) {
			new Notice('Failed to import profiles: Invalid JSON');
			console.error('Import error:', e);
			return 0;
		}
	}

	/**
	 * Generate a shareable URL for a profile (base64 encoded)
	 */
	generateShareURL(id: string): string {
		const json = this.exportProfile(id);
		const encoded = btoa(json);
		return `obsidian://profile/${encoded}`;
	}

	/**
	 * Import profile from a share URL
	 */
	importFromURL(url: string): ConcealerProfile | null {
		try {
			const match = url.match(/obsidian:\/\/profile\/(.+)/);
			if (!match) {
				new Notice('Invalid profile URL');
				return null;
			}

			const json = atob(match[1]);
			return this.importProfile(json);
		} catch (e) {
			new Notice('Failed to import from URL');
			console.error('URL import error:', e);
			return null;
		}
	}

	/**
	 * Save profile data to plugin storage
	 */
	private async saveProfileData(): Promise<void> {
		const data: ProfileManagerData = {
			profiles: Array.from(this.profiles.values()),
			activeProfileId: this.activeProfileId,
			defaultProfileId: this.defaultProfileId,
		};

		await this.plugin.saveData({ ...this.plugin.loadData(), profiles: data });
	}

	/**
	 * Load profile data from plugin storage
	 */
	private async loadProfileData(): Promise<ProfileManagerData | null> {
		const data = await this.plugin.loadData();
		return data?.profiles || null;
	}
}
