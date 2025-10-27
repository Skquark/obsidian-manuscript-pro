/**
 * Template Preset System
 * Pre-configured templates for common book types and publishing scenarios
 */

import type { TemplateConfiguration } from './TemplateConfiguration';
import { BUILT_IN_PRESETS } from './BuiltInPresets';

export interface TemplatePreset {
	id: string;
	name: string;
	description: string;
	category: 'fiction' | 'non-fiction' | 'academic' | 'technical' | 'special';
	tags: string[]; // e.g., ['novel', 'print', 'professional']

	configuration: TemplateConfiguration;

	// Visual
	thumbnail?: string; // Base64 or path to preview image
	icon?: string; // Emoji or icon identifier

	// Metadata
	author?: string;
	version?: string;
	isBuiltIn: boolean;
	isPro?: boolean; // Requires pro license

	// Usage hints
	bestFor?: string; // e.g., "Contemporary novels, fiction manuscripts"
	trimSizes?: string[]; // Recommended trim sizes for this preset
	formats?: string[]; // Recommended export formats
}

export interface PresetCategory {
	id: string;
	name: string;
	description: string;
	icon: string;
	presets: TemplatePreset[];
}

/**
 * Preset manager for loading, saving, and organizing templates
 */
export class PresetManager {
	private presets: Map<string, TemplatePreset> = new Map();
	private categories: Map<string, PresetCategory> = new Map();

	constructor() {
		this.loadBuiltInPresets();
	}

	/**
	 * Get all presets
	 */
	getAllPresets(): TemplatePreset[] {
		return Array.from(this.presets.values());
	}

	/**
	 * Get presets by category
	 */
	getPresetsByCategory(category: string): TemplatePreset[] {
		return this.getAllPresets().filter((p) => p.category === category);
	}

	/**
	 * Get preset by ID
	 */
	getPreset(id: string): TemplatePreset | undefined {
		return this.presets.get(id);
	}

	/**
	 * Add or update a preset
	 */
	addPreset(preset: TemplatePreset): void {
		this.presets.set(preset.id, preset);
	}

	/**
	 * Delete a preset (only user presets)
	 */
	deletePreset(id: string): boolean {
		const preset = this.presets.get(id);
		if (preset && !preset.isBuiltIn) {
			this.presets.delete(id);
			return true;
		}
		return false;
	}

	/**
	 * Search presets
	 */
	searchPresets(query: string): TemplatePreset[] {
		const lowerQuery = query.toLowerCase();
		return this.getAllPresets().filter(
			(p) =>
				p.name.toLowerCase().includes(lowerQuery) ||
				p.description.toLowerCase().includes(lowerQuery) ||
				p.tags.some((t) => t.toLowerCase().includes(lowerQuery)),
		);
	}

	/**
	 * Export preset to JSON
	 */
	exportPreset(id: string): string | null {
		const preset = this.presets.get(id);
		if (!preset) return null;

		// Remove built-in flag for export
		const exportData = {
			...preset,
			isBuiltIn: false,
		};

		return JSON.stringify(exportData, null, 2);
	}

	/**
	 * Import preset from JSON
	 */
	importPreset(json: string): TemplatePreset | null {
		try {
			const data = JSON.parse(json);

			// Validate basic structure
			if (!data.id || !data.name || !data.configuration) {
				throw new Error('Invalid preset format');
			}

			// Generate new ID if conflict
			let id = data.id;
			if (this.presets.has(id)) {
				id = `${id}-imported-${Date.now()}`;
			}

			const preset: TemplatePreset = {
				...data,
				id,
				isBuiltIn: false,
			};

			this.addPreset(preset);
			return preset;
		} catch (error) {
			console.error('Failed to import preset:', error);
			return null;
		}
	}

	/**
	 * Load built-in presets
	 */
	private loadBuiltInPresets(): void {
		// Add all built-in presets
		for (const preset of BUILT_IN_PRESETS) {
			this.addPreset(preset);
		}

		this.categories.set('fiction', {
			id: 'fiction',
			name: 'Fiction',
			description: 'Templates for novels, short stories, and creative writing',
			icon: '📚',
			presets: [],
		});

		this.categories.set('non-fiction', {
			id: 'non-fiction',
			name: 'Non-Fiction',
			description: 'Templates for memoirs, guides, and reference books',
			icon: '📖',
			presets: [],
		});

		this.categories.set('academic', {
			id: 'academic',
			name: 'Academic',
			description: 'Templates for theses, dissertations, and papers',
			icon: '🎓',
			presets: [],
		});

		this.categories.set('technical', {
			id: 'technical',
			name: 'Technical',
			description: 'Templates for manuals, documentation, and reference',
			icon: '⚙️',
			presets: [],
		});

		this.categories.set('special', {
			id: 'special',
			name: 'Special',
			description: 'Specialized templates for specific needs',
			icon: '✨',
			presets: [],
		});
	}

	/**
	 * Get all categories
	 */
	getCategories(): PresetCategory[] {
		return Array.from(this.categories.values());
	}

	/**
	 * Get category by ID
	 */
	getCategory(id: string): PresetCategory | undefined {
		return this.categories.get(id);
	}
}

// Global preset manager instance
export const presetManager = new PresetManager();
