import { App } from 'obsidian';
import {
	Character,
	CharacterRole,
	CharacterImportance,
	CharacterSearchResult,
	CharacterStats,
	SceneAppearance,
	CharacterRelationship
} from './CharacterInterfaces';

/**
 * Manages character database
 */
export class CharacterManager {
	private app: App;
	private characters: Map<string, Character> = new Map();

	constructor(app: App) {
		this.app = app;
	}

	/**
	 * Load characters from saved data
	 */
	loadCharacters(data: Record<string, Character>): void {
		this.characters.clear();
		if (data) {
			Object.entries(data).forEach(([id, character]) => {
				this.characters.set(id, character);
			});
		}
	}

	/**
	 * Get characters for saving
	 */
	getCharactersForSave(): Record<string, Character> {
		const result: Record<string, Character> = {};
		this.characters.forEach((character, id) => {
			result[id] = character;
		});
		return result;
	}

	/**
	 * Get all characters
	 */
	getAllCharacters(): Character[] {
		return Array.from(this.characters.values());
	}

	/**
	 * Get character by ID
	 */
	getCharacter(id: string): Character | undefined {
		return this.characters.get(id);
	}

	/**
	 * Get character by name
	 */
	getCharacterByName(name: string): Character | undefined {
		return this.getAllCharacters().find(c => c.name.toLowerCase() === name.toLowerCase());
	}

	/**
	 * Create new character
	 */
	createCharacter(name: string, role: CharacterRole = 'other', importance: CharacterImportance = 'minor'): Character {
		const id = this.generateId();
		const character: Character = {
			id,
			name,
			role,
			importance,
			created: Date.now(),
			modified: Date.now(),
			appearances: [],
			relationships: [],
			tags: []
		};

		this.characters.set(id, character);
		return character;
	}

	/**
	 * Update character
	 */
	updateCharacter(id: string, updates: Partial<Character>): void {
		const character = this.characters.get(id);
		if (!character) return;

		Object.assign(character, updates);
		character.modified = Date.now();
		this.characters.set(id, character);
	}

	/**
	 * Delete character
	 */
	deleteCharacter(id: string): boolean {
		return this.characters.delete(id);
	}

	/**
	 * Add scene appearance to character
	 */
	addSceneAppearance(characterId: string, appearance: SceneAppearance): void {
		const character = this.characters.get(characterId);
		if (!character) return;

		if (!character.appearances) {
			character.appearances = [];
		}

		// Check if appearance already exists
		const exists = character.appearances.some(a =>
			a.sceneId === appearance.sceneId && a.chapterId === appearance.chapterId
		);

		if (!exists) {
			character.appearances.push(appearance);
			character.modified = Date.now();
		}
	}

	/**
	 * Remove scene appearance from character
	 */
	removeSceneAppearance(characterId: string, sceneId: string): void {
		const character = this.characters.get(characterId);
		if (!character || !character.appearances) return;

		character.appearances = character.appearances.filter(a => a.sceneId !== sceneId);
		character.modified = Date.now();
	}

	/**
	 * Add relationship between characters
	 */
	addRelationship(characterId: string, relationship: CharacterRelationship): void {
		const character = this.characters.get(characterId);
		if (!character) return;

		if (!character.relationships) {
			character.relationships = [];
		}

		// Remove existing relationship with same character
		character.relationships = character.relationships.filter(
			r => r.characterId !== relationship.characterId
		);

		character.relationships.push(relationship);
		character.modified = Date.now();
	}

	/**
	 * Remove relationship
	 */
	removeRelationship(characterId: string, otherCharacterId: string): void {
		const character = this.characters.get(characterId);
		if (!character || !character.relationships) return;

		character.relationships = character.relationships.filter(
			r => r.characterId !== otherCharacterId
		);
		character.modified = Date.now();
	}

	/**
	 * Search characters
	 */
	searchCharacters(query: string): CharacterSearchResult[] {
		const lowerQuery = query.toLowerCase();
		const results: CharacterSearchResult[] = [];

		this.characters.forEach(character => {
			const matchedFields: string[] = [];
			let score = 0;

			// Check name (highest priority)
			if (character.name.toLowerCase().includes(lowerQuery)) {
				matchedFields.push('name');
				score += 10;
			}

			// Check tagline
			if (character.tagline?.toLowerCase().includes(lowerQuery)) {
				matchedFields.push('tagline');
				score += 5;
			}

			// Check summary
			if (character.summary?.toLowerCase().includes(lowerQuery)) {
				matchedFields.push('summary');
				score += 3;
			}

			// Check role
			if (character.role.toLowerCase().includes(lowerQuery)) {
				matchedFields.push('role');
				score += 2;
			}

			// Check tags
			if (character.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))) {
				matchedFields.push('tags');
				score += 2;
			}

			// Check backstory
			if (character.background?.backstory?.toLowerCase().includes(lowerQuery)) {
				matchedFields.push('backstory');
				score += 1;
			}

			if (matchedFields.length > 0) {
				results.push({
					character,
					matchedFields,
					score
				});
			}
		});

		// Sort by score (descending)
		return results.sort((a, b) => b.score - a.score);
	}

	/**
	 * Filter characters by criteria
	 */
	filterCharacters(options: {
		role?: CharacterRole;
		importance?: CharacterImportance;
		tags?: string[];
	}): Character[] {
		let filtered = this.getAllCharacters();

		if (options.role) {
			filtered = filtered.filter(c => c.role === options.role);
		}

		if (options.importance) {
			filtered = filtered.filter(c => c.importance === options.importance);
		}

		if (options.tags && options.tags.length > 0) {
			filtered = filtered.filter(c =>
				c.tags?.some(tag => options.tags!.includes(tag))
			);
		}

		return filtered;
	}

	/**
	 * Get characters appearing in a specific scene
	 */
	getCharactersInScene(sceneId: string): Character[] {
		return this.getAllCharacters().filter(character =>
			character.appearances?.some(a => a.sceneId === sceneId)
		);
	}

	/**
	 * Get character statistics
	 */
	getStatistics(): CharacterStats {
		const characters = this.getAllCharacters();
		const stats: CharacterStats = {
			totalCharacters: characters.length,
			byRole: {
				protagonist: 0,
				antagonist: 0,
				supporting: 0,
				minor: 0,
				other: 0
			},
			byImportance: {
				major: 0,
				moderate: 0,
				minor: 0
			},
			averageAppearances: 0
		};

		let totalAppearances = 0;

		characters.forEach(character => {
			stats.byRole[character.role]++;
			stats.byImportance[character.importance]++;
			const appearances = character.appearances?.length || 0;
			totalAppearances += appearances;
		});

		stats.averageAppearances = characters.length > 0
			? Math.round(totalAppearances / characters.length)
			: 0;

		// Find most frequent character
		if (characters.length > 0) {
			stats.mostFrequentCharacter = characters.reduce((max, char) => {
				const charAppearances = char.appearances?.length || 0;
				const maxAppearances = max.appearances?.length || 0;
				return charAppearances > maxAppearances ? char : max;
			});
		}

		return stats;
	}

	/**
	 * Sort characters by various criteria
	 */
	sortCharacters(characters: Character[], sortBy: 'name' | 'role' | 'importance' | 'appearances' | 'recent'): Character[] {
		const sorted = [...characters];

		switch (sortBy) {
			case 'name':
				sorted.sort((a, b) => a.name.localeCompare(b.name));
				break;
			case 'role':
				const roleOrder: Record<CharacterRole, number> = {
					protagonist: 0,
					antagonist: 1,
					supporting: 2,
					minor: 3,
					other: 4
				};
				sorted.sort((a, b) => roleOrder[a.role] - roleOrder[b.role]);
				break;
			case 'importance':
				const importanceOrder: Record<CharacterImportance, number> = {
					major: 0,
					moderate: 1,
					minor: 2
				};
				sorted.sort((a, b) => importanceOrder[a.importance] - importanceOrder[b.importance]);
				break;
			case 'appearances':
				sorted.sort((a, b) => (b.appearances?.length || 0) - (a.appearances?.length || 0));
				break;
			case 'recent':
				sorted.sort((a, b) => b.modified - a.modified);
				break;
		}

		return sorted;
	}

	/**
	 * Generate unique character ID
	 */
	private generateId(): string {
		return 'char_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
	}
}
