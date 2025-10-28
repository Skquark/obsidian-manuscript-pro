import { App } from 'obsidian';
import {
	TimelineEvent,
	TimelineDate,
	TimelineConflict,
	ConflictType,
	EventType,
	DatePrecision,
	TimelineStats,
	TimelineSearchResult,
	CharacterAge,
	DateRange
} from './TimelineInterfaces';

/**
 * Timeline Manager
 * Manages timeline events with date handling and conflict detection
 */
export class TimelineManager {
	private app: App;
	private events: Map<string, TimelineEvent> = new Map();

	constructor(app: App) {
		this.app = app;
	}

	// ========== DATA PERSISTENCE ==========

	/**
	 * Load events from saved data
	 */
	loadEvents(data: Record<string, TimelineEvent>): void {
		this.events.clear();
		Object.entries(data).forEach(([id, event]) => {
			this.events.set(id, event);
		});
	}

	/**
	 * Get events for saving
	 */
	getEventsForSave(): Record<string, TimelineEvent> {
		const data: Record<string, TimelineEvent> = {};
		this.events.forEach((event, id) => {
			data[id] = event;
		});
		return data;
	}

	// ========== CRUD OPERATIONS ==========

	/**
	 * Get all events
	 */
	getAllEvents(): TimelineEvent[] {
		return Array.from(this.events.values());
	}

	/**
	 * Get event by ID
	 */
	getEvent(id: string): TimelineEvent | undefined {
		return this.events.get(id);
	}

	/**
	 * Create new timeline event
	 */
	createEvent(
		title: string,
		type: EventType,
		startDate: TimelineDate,
		importance: 'critical' | 'major' | 'moderate' | 'minor' = 'moderate'
	): TimelineEvent {
		const event: TimelineEvent = {
			id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
			title,
			type,
			startDate,
			importance,
			created: Date.now(),
			modified: Date.now()
		};

		this.events.set(event.id, event);
		return event;
	}

	/**
	 * Update event
	 */
	updateEvent(id: string, updates: Partial<TimelineEvent>): void {
		const event = this.events.get(id);
		if (!event) return;

		Object.assign(event, updates);
		event.modified = Date.now();

		this.events.set(id, event);
	}

	/**
	 * Delete event
	 */
	deleteEvent(id: string): boolean {
		// Remove from parent's children
		const event = this.events.get(id);
		if (event?.parentEventId) {
			const parent = this.events.get(event.parentEventId);
			if (parent?.childEventIds) {
				parent.childEventIds = parent.childEventIds.filter(cid => cid !== id);
			}
		}

		// Delete children recursively
		if (event?.childEventIds) {
			event.childEventIds.forEach(childId => {
				this.deleteEvent(childId);
			});
		}

		return this.events.delete(id);
	}

	// ========== DATE OPERATIONS ==========

	/**
	 * Compare two dates
	 * Returns: -1 if date1 < date2, 0 if equal, 1 if date1 > date2
	 * null if dates cannot be compared
	 */
	compareDates(date1: TimelineDate, date2: TimelineDate): number | null {
		// Handle unknown/relative dates
		if (date1.precision === 'unknown' || date2.precision === 'unknown') {
			return null;
		}

		// Convert to comparable numbers (days since epoch or custom comparison)
		const days1 = this.dateToComparableValue(date1);
		const days2 = this.dateToComparableValue(date2);

		if (days1 === null || days2 === null) return null;

		if (Math.abs(days1 - days2) < 1) return 0;
		return days1 < days2 ? -1 : 1;
	}

	/**
	 * Convert date to comparable numeric value (days since epoch)
	 */
	private dateToComparableValue(date: TimelineDate): number | null {
		// Standard dates
		if (date.year !== undefined) {
			const year = date.year;
			const month = date.month || 1;
			const day = date.day || 1;
			const hour = date.hour || 0;
			const minute = date.minute || 0;

			const jsDate = new Date(year, month - 1, day, hour, minute);
			return jsDate.getTime() / (1000 * 60 * 60 * 24); // Days since epoch
		}

		// Custom dates - use custom year as base
		if (date.customYear !== undefined) {
			return date.customYear * 365; // Approximate
		}

		return null;
	}

	/**
	 * Calculate duration between two dates in days
	 */
	calculateDuration(start: TimelineDate, end: TimelineDate): number | null {
		const comparison = this.compareDates(start, end);
		if (comparison === null) return null;

		const startDays = this.dateToComparableValue(start);
		const endDays = this.dateToComparableValue(end);

		if (startDays === null || endDays === null) return null;

		return Math.abs(endDays - startDays);
	}

	/**
	 * Format date for display
	 */
	formatDate(date: TimelineDate): string {
		if (date.displayText) return date.displayText;

		// Standard date
		if (date.year !== undefined) {
			const parts: string[] = [];

			if (date.precision === 'exact' || date.precision === 'day') {
				if (date.day) parts.push(date.day.toString());
				if (date.month) parts.push(this.getMonthName(date.month));
				parts.push(date.year.toString());

				if (date.precision === 'exact' && date.hour !== undefined) {
					parts.push(`${date.hour.toString().padStart(2, '0')}:${(date.minute || 0).toString().padStart(2, '0')}`);
				}
			} else if (date.precision === 'month') {
				if (date.month) parts.push(this.getMonthName(date.month));
				parts.push(date.year.toString());
			} else {
				parts.push(date.year.toString());
			}

			let formatted = parts.join(' ');
			if (date.isApproximate) formatted = `~${formatted}`;
			return formatted;
		}

		// Custom date
		if (date.customYear !== undefined) {
			const parts: string[] = [];
			if (date.customDay) parts.push(date.customDay);
			if (date.customMonth) parts.push(date.customMonth);
			parts.push(`Year ${date.customYear}`);
			if (date.customEra) parts.push(`of ${date.customEra}`);
			return parts.join(' ');
		}

		// Relative date
		if (date.relativeDescription) {
			return date.relativeDescription;
		}

		return 'Unknown date';
	}

	/**
	 * Get month name
	 */
	private getMonthName(month: number): string {
		const names = [
			'January', 'February', 'March', 'April', 'May', 'June',
			'July', 'August', 'September', 'October', 'November', 'December'
		];
		return names[month - 1] || month.toString();
	}

	// ========== SORTING AND FILTERING ==========

	/**
	 * Sort events chronologically
	 */
	sortEvents(events: TimelineEvent[]): TimelineEvent[] {
		return events.sort((a, b) => {
			const comparison = this.compareDates(a.startDate, b.startDate);
			if (comparison === null) return 0;
			return comparison;
		});
	}

	/**
	 * Filter events by criteria
	 */
	filterEvents(options: {
		types?: EventType[];
		importance?: Array<'critical' | 'major' | 'moderate' | 'minor'>;
		characterIds?: string[];
		tags?: string[];
		dateRange?: DateRange;
		hasConflicts?: boolean;
	}): TimelineEvent[] {
		let events = this.getAllEvents();

		if (options.types) {
			events = events.filter(e => options.types!.includes(e.type));
		}

		if (options.importance) {
			events = events.filter(e => options.importance!.includes(e.importance));
		}

		if (options.characterIds && options.characterIds.length > 0) {
			events = events.filter(e =>
				e.characterIds?.some(id => options.characterIds!.includes(id))
			);
		}

		if (options.tags && options.tags.length > 0) {
			events = events.filter(e =>
				e.tags?.some(tag => options.tags!.includes(tag))
			);
		}

		if (options.dateRange) {
			events = events.filter(e => {
				const afterStart = this.compareDates(e.startDate, options.dateRange!.start);
				const beforeEnd = this.compareDates(e.startDate, options.dateRange!.end);
				return afterStart !== null && afterStart >= 0 && beforeEnd !== null && beforeEnd <= 0;
			});
		}

		if (options.hasConflicts !== undefined) {
			if (options.hasConflicts) {
				events = events.filter(e => e.conflicts && e.conflicts.length > 0);
			} else {
				events = events.filter(e => !e.conflicts || e.conflicts.length === 0);
			}
		}

		return events;
	}

	/**
	 * Search events
	 */
	searchEvents(query: string): TimelineSearchResult[] {
		const results: TimelineSearchResult[] = [];
		const lowerQuery = query.toLowerCase();

		this.events.forEach(event => {
			let relevance = 0;
			const matchedFields: string[] = [];

			// Title
			if (event.title.toLowerCase().includes(lowerQuery)) {
				relevance += 10;
				matchedFields.push('title');
			}

			// Description
			if (event.description?.toLowerCase().includes(lowerQuery)) {
				relevance += 7;
				matchedFields.push('description');
			}

			// Location
			if (event.location?.toLowerCase().includes(lowerQuery)) {
				relevance += 5;
				matchedFields.push('location');
			}

			// Tags
			if (event.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))) {
				relevance += 4;
				matchedFields.push('tags');
			}

			// Notes
			if (event.notes?.toLowerCase().includes(lowerQuery)) {
				relevance += 3;
				matchedFields.push('notes');
			}

			if (relevance > 0) {
				results.push({
					event,
					relevance,
					matchedFields
				});
			}
		});

		return results.sort((a, b) => b.relevance - a.relevance);
	}

	// ========== CONFLICT DETECTION ==========

	/**
	 * Detect all conflicts in timeline
	 */
	detectAllConflicts(): void {
		const events = this.getAllEvents();

		events.forEach(event => {
			const conflicts: TimelineConflict[] = [];

			// Check for overlapping events
			conflicts.push(...this.detectOverlappingEvents(event));

			// Check for age inconsistencies
			conflicts.push(...this.detectAgeInconsistencies(event));

			// Check for invalid dates
			conflicts.push(...this.detectInvalidDates(event));

			// Check for circular references
			conflicts.push(...this.detectCircularReferences(event));

			// Update event with conflicts
			if (conflicts.length > 0) {
				event.conflicts = conflicts;
			} else {
				delete event.conflicts;
			}
		});
	}

	/**
	 * Detect overlapping events for same character
	 */
	private detectOverlappingEvents(event: TimelineEvent): TimelineConflict[] {
		const conflicts: TimelineConflict[] = [];

		if (!event.characterIds || event.characterIds.length === 0) {
			return conflicts;
		}

		// Find other events with same characters
		const otherEvents = this.getAllEvents().filter(e =>
			e.id !== event.id &&
			e.characterIds?.some(id => event.characterIds!.includes(id))
		);

		otherEvents.forEach(other => {
			// Check if events overlap in time
			const overlap = this.eventsOverlap(event, other);
			if (overlap) {
				const sharedCharacters = event.characterIds!.filter(id =>
					other.characterIds!.includes(id)
				);

				conflicts.push({
					id: `conflict-overlap-${event.id}-${other.id}`,
					type: 'overlapping-events',
					severity: 'warning',
					message: `Character(s) appear in overlapping events: "${event.title}" and "${other.title}"`,
					eventIds: [event.id, other.id],
					resolved: false
				});
			}
		});

		return conflicts;
	}

	/**
	 * Check if two events overlap in time
	 */
	private eventsOverlap(event1: TimelineEvent, event2: TimelineEvent): boolean {
		// Get end dates (or use start date if no end)
		const end1 = event1.endDate || event1.startDate;
		const end2 = event2.endDate || event2.startDate;

		// event1.start <= event2.end && event2.start <= event1.end
		const comp1 = this.compareDates(event1.startDate, end2);
		const comp2 = this.compareDates(event2.startDate, end1);

		if (comp1 === null || comp2 === null) return false;

		return comp1 <= 0 && comp2 <= 0;
	}

	/**
	 * Detect age inconsistencies
	 */
	private detectAgeInconsistencies(event: TimelineEvent): TimelineConflict[] {
		// TODO: Implement when character manager is integrated
		// Would check if character age at event matches their birth date
		return [];
	}

	/**
	 * Detect invalid dates
	 */
	private detectInvalidDates(event: TimelineEvent): TimelineConflict[] {
		const conflicts: TimelineConflict[] = [];

		// Check if standard date is valid
		if (event.startDate.year !== undefined) {
			const isValid = this.isValidDate(
				event.startDate.year,
				event.startDate.month,
				event.startDate.day
			);

			if (!isValid) {
				conflicts.push({
					id: `conflict-invalid-date-${event.id}`,
					type: 'impossible-date',
					severity: 'error',
					message: `Invalid start date in "${event.title}"`,
					eventIds: [event.id],
					resolved: false
				});
			}
		}

		// Check if end date comes after start date
		if (event.endDate) {
			const comparison = this.compareDates(event.startDate, event.endDate);
			if (comparison !== null && comparison > 0) {
				conflicts.push({
					id: `conflict-date-order-${event.id}`,
					type: 'date-order',
					severity: 'error',
					message: `End date before start date in "${event.title}"`,
					eventIds: [event.id],
					resolved: false
				});
			}
		}

		return conflicts;
	}

	/**
	 * Check if date is valid
	 */
	private isValidDate(year?: number, month?: number, day?: number): boolean {
		if (year === undefined) return true;

		if (month !== undefined && (month < 1 || month > 12)) {
			return false;
		}

		if (day !== undefined && month !== undefined) {
			const daysInMonth = new Date(year, month, 0).getDate();
			if (day < 1 || day > daysInMonth) {
				return false;
			}
		}

		return true;
	}

	/**
	 * Detect circular references
	 */
	private detectCircularReferences(event: TimelineEvent): TimelineConflict[] {
		const conflicts: TimelineConflict[] = [];

		if (event.parentEventId) {
			const visited = new Set<string>();
			let current: TimelineEvent | undefined = event;

			while (current?.parentEventId) {
				if (visited.has(current.parentEventId)) {
					conflicts.push({
						id: `conflict-circular-${event.id}`,
						type: 'circular-reference',
						severity: 'error',
						message: `Circular parent reference in "${event.title}"`,
						eventIds: [event.id],
						resolved: false
					});
					break;
				}

				visited.add(current.id);
				current = this.events.get(current.parentEventId);
			}
		}

		return conflicts;
	}

	// ========== STATISTICS ==========

	/**
	 * Get timeline statistics
	 */
	getStatistics(): TimelineStats {
		const events = this.getAllEvents();

		const eventsByType: Record<EventType, number> = {
			'scene': 0,
			'character-event': 0,
			'plot-point': 0,
			'historical-fact': 0,
			'world-event': 0,
			'research': 0,
			'other': 0
		};

		const eventsByImportance: Record<string, number> = {
			'critical': 0,
			'major': 0,
			'moderate': 0,
			'minor': 0
		};

		let totalConflicts = 0;
		let unresolvedConflicts = 0;
		const conflictsByType: Record<ConflictType, number> = {
			'overlapping-events': 0,
			'age-inconsistency': 0,
			'date-order': 0,
			'travel-time': 0,
			'duration-mismatch': 0,
			'missing-dependency': 0,
			'circular-reference': 0,
			'impossible-date': 0
		};

		const allCharacterIds = new Set<string>();
		let eventsWithCharacters = 0;

		events.forEach(event => {
			eventsByType[event.type]++;
			eventsByImportance[event.importance]++;

			if (event.conflicts) {
				totalConflicts += event.conflicts.length;
				event.conflicts.forEach(conflict => {
					if (!conflict.resolved) unresolvedConflicts++;
					conflictsByType[conflict.type]++;
				});
			}

			if (event.characterIds) {
				event.characterIds.forEach(id => allCharacterIds.add(id));
				eventsWithCharacters++;
			}
		});

		// Find earliest and latest events
		const sortedEvents = this.sortEvents([...events]);
		const earliestEvent = sortedEvents[0];
		const latestEvent = sortedEvents[sortedEvents.length - 1];

		let totalSpanDays: number | undefined;
		if (earliestEvent && latestEvent) {
			totalSpanDays = this.calculateDuration(earliestEvent.startDate, latestEvent.startDate) || undefined;
		}

		return {
			totalEvents: events.length,
			eventsByType,
			eventsByImportance,
			earliestEvent,
			latestEvent,
			totalSpanDays,
			totalConflicts,
			unresolvedConflicts,
			conflictsByType,
			charactersTracked: allCharacterIds.size,
			eventsWithCharacters
		};
	}

	/**
	 * Get all tags used in timeline
	 */
	getAllTags(): string[] {
		const tags = new Set<string>();
		this.events.forEach(event => {
			event.tags?.forEach(tag => tags.add(tag));
		});
		return Array.from(tags).sort();
	}

	/**
	 * Get events for a specific character
	 */
	getCharacterEvents(characterId: string): TimelineEvent[] {
		return this.getAllEvents().filter(e =>
			e.characterIds?.includes(characterId)
		);
	}
}
