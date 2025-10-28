/**
 * Timeline/Chronology Interfaces
 *
 * Supports tracking events, character development, plot points,
 * and historical facts with conflict detection.
 */

import { TFile } from 'obsidian';

/**
 * Event type classification
 */
export type EventType =
	| 'scene'              // Story scene/chapter event
	| 'character-event'    // Character life event (birth, death, marriage, etc.)
	| 'plot-point'         // Major plot milestone
	| 'historical-fact'    // Historical/research fact
	| 'world-event'        // World-building event
	| 'research'           // Research milestone
	| 'other';

/**
 * Date precision levels
 */
export type DatePrecision =
	| 'exact'      // Exact date and time known
	| 'day'        // Day known, time unknown
	| 'month'      // Month and year known
	| 'year'       // Year known
	| 'decade'     // Approximate decade
	| 'century'    // Approximate century
	| 'relative'   // Relative to another event
	| 'unknown';   // Unknown date

/**
 * Timeline date representation
 * Supports flexible date formats for fiction and non-fiction
 */
export interface TimelineDate {
	// Standard date (for real-world dates)
	year?: number;
	month?: number;      // 1-12
	day?: number;        // 1-31
	hour?: number;       // 0-23
	minute?: number;     // 0-59

	// Custom date system (for fiction - e.g., "Year 3 of the Third Age")
	customEra?: string;
	customYear?: number;
	customMonth?: string;
	customDay?: string;

	// Relative dating
	relativeToEventId?: string;
	relativeOffset?: number;  // Days offset from referenced event
	relativeDescription?: string;  // "3 days after"

	// Precision and confidence
	precision: DatePrecision;
	isApproximate: boolean;
	confidence?: number;  // 0-1, how confident we are in this date

	// Display
	displayText?: string;  // Override for display (e.g., "Spring 1920")
}

/**
 * Timeline event
 */
export interface TimelineEvent {
	id: string;
	title: string;
	description?: string;
	type: EventType;

	// Dating
	startDate: TimelineDate;
	endDate?: TimelineDate;  // For events with duration
	duration?: number;       // Days (calculated or manual)

	// Relationships
	characterIds?: string[];      // Characters involved
	sceneIds?: string[];          // Related scenes/chapters
	researchNoteIds?: string[];   // Related research
	linkedFileIds?: string[];     // Related files

	// Hierarchical events
	parentEventId?: string;       // Parent event (for sub-events)
	childEventIds?: string[];     // Sub-events

	// Metadata
	location?: string;            // Where the event occurs
	tags?: string[];
	importance: 'critical' | 'major' | 'moderate' | 'minor';
	color?: string;               // Visual color coding

	// Conflict tracking
	conflicts?: TimelineConflict[];

	// Notes
	notes?: string;

	// Timestamps
	created: number;
	modified: number;
}

/**
 * Timeline conflict
 * Detected inconsistencies in the timeline
 */
export interface TimelineConflict {
	id: string;
	type: ConflictType;
	severity: 'error' | 'warning' | 'info';
	message: string;

	// Events involved
	eventIds: string[];

	// Specific conflict data
	details?: {
		expectedValue?: any;
		actualValue?: any;
		difference?: number;
	};

	// Resolution
	resolved: boolean;
	resolution?: string;
	ignoredByUser?: boolean;
}

/**
 * Conflict types
 */
export type ConflictType =
	| 'overlapping-events'      // Character in two places at once
	| 'age-inconsistency'       // Character age doesn't match
	| 'date-order'              // Events out of chronological order
	| 'travel-time'             // Impossible travel time between locations
	| 'duration-mismatch'       // Stated duration doesn't match dates
	| 'missing-dependency'      // Referenced event doesn't exist
	| 'circular-reference'      // Event depends on itself
	| 'impossible-date';        // Invalid date (e.g., Feb 30)

/**
 * Character age at event
 * Calculated from birth date
 */
export interface CharacterAge {
	characterId: string;
	characterName: string;
	ageYears?: number;
	ageMonths?: number;
	ageDays?: number;
	ageDescription?: string;  // "infant", "child", "adult", "elderly"
	birthDate?: TimelineDate;
	eventDate: TimelineDate;
}

/**
 * Timeline view configuration
 */
export interface TimelineViewConfig {
	// Filtering
	showEventTypes: EventType[];
	showImportance: Array<'critical' | 'major' | 'moderate' | 'minor'>;
	filterCharacterIds?: string[];
	filterTags?: string[];

	// Sorting
	sortBy: 'chronological' | 'importance' | 'type' | 'recent';
	sortDirection: 'asc' | 'desc';

	// Display
	groupBy?: 'type' | 'character' | 'year' | 'importance' | 'none';
	showConflicts: boolean;
	showCharacterAges: boolean;
	showDurations: boolean;

	// Zoom level (for visual timeline)
	zoomLevel?: 'century' | 'decade' | 'year' | 'month' | 'day' | 'hour';

	// Date range
	startDate?: TimelineDate;
	endDate?: TimelineDate;
}

/**
 * Timeline statistics
 */
export interface TimelineStats {
	totalEvents: number;
	eventsByType: Record<EventType, number>;
	eventsByImportance: Record<string, number>;

	// Date range
	earliestEvent?: TimelineEvent;
	latestEvent?: TimelineEvent;
	totalSpanDays?: number;

	// Conflicts
	totalConflicts: number;
	unresolvedConflicts: number;
	conflictsByType: Record<ConflictType, number>;

	// Character tracking
	charactersTracked: number;
	eventsWithCharacters: number;
}

/**
 * Timeline export options
 */
export interface TimelineExportOptions {
	format: 'markdown' | 'csv' | 'json' | 'gantt';
	includeDescriptions: boolean;
	includeConflicts: boolean;
	includeCharacterAges: boolean;
	groupBy?: 'type' | 'character' | 'year' | 'none';
	dateFormat: 'iso' | 'custom' | 'display';
}

/**
 * Timeline search result
 */
export interface TimelineSearchResult {
	event: TimelineEvent;
	relevance: number;
	matchedFields: string[];
	excerpt?: string;
}

/**
 * Date range for filtering
 */
export interface DateRange {
	start: TimelineDate;
	end: TimelineDate;
	label?: string;  // "First Act", "1920s", etc.
}

/**
 * Timeline era/period
 * For organizing events into major periods
 */
export interface TimelineEra {
	id: string;
	name: string;
	description?: string;
	startDate: TimelineDate;
	endDate?: TimelineDate;
	color?: string;
	parentEraId?: string;  // For nested eras (e.g., "WWI" within "20th Century")
}

/**
 * Location for events
 */
export interface EventLocation {
	id: string;
	name: string;
	description?: string;
	coordinates?: {
		latitude: number;
		longitude: number;
	};
	parentLocationId?: string;  // For hierarchical locations
}

/**
 * Travel between locations
 */
export interface TravelSegment {
	from: string;           // Location ID
	to: string;             // Location ID
	method?: string;        // "walking", "car", "plane", etc.
	estimatedDays?: number;
	minimumDays?: number;   // Minimum realistic travel time
}
