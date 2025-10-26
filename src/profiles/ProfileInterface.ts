import { PluginSettings } from '../interfaces/plugin-settings';

/**
 * Represents a saved profile configuration
 */
export interface ConcealerProfile {
	id: string; // UUID
	name: string;
	description: string;
	icon: string; // emoji or Lucide icon name

	// Settings snapshot
	settings: Partial<PluginSettings>;

	// Optional hotkey
	hotkey?: string;

	// Metadata
	createdAt: number;
	modifiedAt: number;
	isDefault: boolean; // Can't be deleted or modified
	isActive: boolean;
}

/**
 * Profile manager data structure stored in plugin data
 */
export interface ProfileManagerData {
	profiles: ConcealerProfile[];
	activeProfileId: string;
	defaultProfileId: string;
}

/**
 * Serializable profile for import/export
 */
export interface SerializableProfile {
	name: string;
	description: string;
	icon: string;
	settings: Partial<PluginSettings>;
	hotkey?: string;
	version: string; // Plugin version for compatibility
}
