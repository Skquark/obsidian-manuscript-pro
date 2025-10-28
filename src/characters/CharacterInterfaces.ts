import { TFile } from 'obsidian';

/**
 * Character role in the story
 */
export type CharacterRole = 'protagonist' | 'antagonist' | 'supporting' | 'minor' | 'other';

/**
 * Character importance level
 */
export type CharacterImportance = 'major' | 'moderate' | 'minor';

/**
 * Physical appearance details
 */
export interface CharacterAppearance {
	age?: string;
	gender?: string;
	height?: string;
	build?: string;
	hairColor?: string;
	hairStyle?: string;
	eyeColor?: string;
	skinTone?: string;
	distinguishingFeatures?: string; // Scars, tattoos, unique features
	typicalClothing?: string;
}

/**
 * Character personality and traits
 */
export interface CharacterPersonality {
	traits?: string[]; // Array of personality traits
	strengths?: string[];
	weaknesses?: string[];
	fears?: string[];
	desires?: string[];
	quirks?: string[];
}

/**
 * Character background and history
 */
export interface CharacterBackground {
	birthplace?: string;
	occupation?: string;
	education?: string;
	family?: string;
	backstory?: string;
	significantEvents?: string[];
}

/**
 * Character arc and development
 */
export interface CharacterArc {
	startingState?: string; // Who they are at the beginning
	goal?: string; // What they want
	motivation?: string; // Why they want it
	conflict?: string; // What stands in their way
	endingState?: string; // Who they become
	transformation?: string; // How they change
}

/**
 * Relationship with another character
 */
export interface CharacterRelationship {
	characterId: string; // ID of the other character
	type: string; // friend, enemy, lover, family, rival, mentor, etc.
	description?: string;
	status?: string; // current, past, complicated, etc.
}

/**
 * Scene appearance record
 */
export interface SceneAppearance {
	sceneId: string;
	chapterId: string;
	partId?: string;
	role?: string; // Role in this specific scene (POV, present, mentioned)
	notes?: string;
}

/**
 * Complete character profile
 */
export interface Character {
	id: string;
	name: string;
	role: CharacterRole;
	importance: CharacterImportance;

	// Brief overview
	tagline?: string; // One-line description
	summary?: string; // Longer description

	// Detailed information
	appearance?: CharacterAppearance;
	personality?: CharacterPersonality;
	background?: CharacterBackground;
	arc?: CharacterArc;

	// Relationships
	relationships?: CharacterRelationship[];

	// Scene tracking
	appearances?: SceneAppearance[];

	// Notes and references
	notes?: string;
	linkedFile?: TFile; // Link to detailed character file
	imageUrl?: string; // Character portrait/reference image

	// Metadata
	created: number;
	modified: number;
	color?: string; // Color for visual identification
	tags?: string[]; // Custom tags for filtering
}

/**
 * Character database settings
 */
export interface CharacterDatabaseSettings {
	enabled: boolean;
	showInSidebar: boolean;

	// Display options
	groupBy: 'role' | 'importance' | 'alphabetical' | 'recent';
	showAppearances: boolean;
	showRelationships: boolean;

	// Filters
	filterByRole?: CharacterRole;
	filterByImportance?: CharacterImportance;
	filterByTags?: string[];

	// Storage
	characters?: Record<string, Character>; // Character ID -> Character
}

/**
 * Character search result
 */
export interface CharacterSearchResult {
	character: Character;
	matchedFields: string[]; // Which fields matched the search
	score: number; // Relevance score
}

/**
 * Character statistics
 */
export interface CharacterStats {
	totalCharacters: number;
	byRole: Record<CharacterRole, number>;
	byImportance: Record<CharacterImportance, number>;
	averageAppearances: number;
	mostFrequentCharacter?: Character;
}
