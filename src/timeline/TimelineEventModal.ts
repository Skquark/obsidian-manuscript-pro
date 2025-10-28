import { App, Modal, Setting, Notice, TFile } from 'obsidian';
import { TimelineManager } from './TimelineManager';
import { TimelineEvent, TimelineDate, EventType, DatePrecision, TimelineConflict } from './TimelineInterfaces';

/**
 * Timeline Event Modal
 * Comprehensive modal for creating and editing timeline events
 */
export class TimelineEventModal extends Modal {
	private manager: TimelineManager;
	private eventId: string | null;
	private event: TimelineEvent;
	private onSave: () => Promise<void>;
	private isNewEvent: boolean;

	// Tabs
	private activeTab: 'basic' | 'details' | 'links' | 'conflicts' | 'notes' = 'basic';

	constructor(
		app: App,
		manager: TimelineManager,
		eventId: string | null,
		onSave: () => Promise<void>
	) {
		super(app);
		this.manager = manager;
		this.eventId = eventId;
		this.onSave = onSave;
		this.isNewEvent = eventId === null;

		// Load or create event
		if (eventId) {
			const existing = manager.getEvent(eventId);
			if (!existing) {
				new Notice('Event not found');
				this.close();
				return;
			}
			// Deep copy for editing
			this.event = JSON.parse(JSON.stringify(existing));
		} else {
			// Create new event with defaults
			const now = Date.now();
			this.event = {
				id: `event-${now}`,
				title: '',
				type: 'scene',
				importance: 'moderate',
				startDate: {
					precision: 'exact',
					isApproximate: false
				},
				tags: [],
				created: now,
				modified: now
			};
		}
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass('timeline-event-modal');

		// Title
		contentEl.createEl('h2', {
			text: this.isNewEvent ? 'New Timeline Event' : 'Edit Timeline Event'
		});

		// Tab navigation
		this.renderTabs();

		// Tab content
		const tabContent = contentEl.createDiv('timeline-event-modal-content');
		this.renderTabContent(tabContent);

		// Buttons
		this.renderButtons();
	}

	/**
	 * Render tab navigation
	 */
	private renderTabs(): void {
		const tabContainer = this.contentEl.createDiv('timeline-event-tabs');

		const tabs: Array<{ id: typeof this.activeTab; label: string }> = [
			{ id: 'basic', label: 'Basic Info' },
			{ id: 'details', label: 'Details' },
			{ id: 'links', label: 'Links' },
			{ id: 'conflicts', label: 'Conflicts' },
			{ id: 'notes', label: 'Notes' }
		];

		tabs.forEach(tab => {
			const tabBtn = tabContainer.createEl('button', {
				text: tab.label,
				cls: `timeline-event-tab ${this.activeTab === tab.id ? 'active' : ''}`
			});

			tabBtn.addEventListener('click', () => {
				this.activeTab = tab.id;
				this.onOpen(); // Re-render
			});
		});
	}

	/**
	 * Render active tab content
	 */
	private renderTabContent(container: HTMLElement): void {
		container.empty();

		switch (this.activeTab) {
			case 'basic':
				this.renderBasicTab(container);
				break;
			case 'details':
				this.renderDetailsTab(container);
				break;
			case 'links':
				this.renderLinksTab(container);
				break;
			case 'conflicts':
				this.renderConflictsTab(container);
				break;
			case 'notes':
				this.renderNotesTab(container);
				break;
		}
	}

	/**
	 * Render Basic Info tab
	 */
	private renderBasicTab(container: HTMLElement): void {
		// Title
		new Setting(container)
			.setName('Title')
			.setDesc('Name of this event')
			.addText(text => text
				.setValue(this.event.title)
				.onChange(value => {
					this.event.title = value;
				})
			);

		// Type
		new Setting(container)
			.setName('Event Type')
			.setDesc('Category of this event')
			.addDropdown(dropdown => {
				const types: EventType[] = [
					'scene', 'character-event', 'plot-point',
					'historical-fact', 'world-event', 'research', 'other'
				];

				types.forEach(type => {
					dropdown.addOption(type, type);
				});

				dropdown.setValue(this.event.type)
					.onChange(value => {
						this.event.type = value as EventType;
					});
			});

		// Importance
		new Setting(container)
			.setName('Importance')
			.setDesc('Significance of this event')
			.addDropdown(dropdown => {
				dropdown
					.addOption('critical', 'Critical')
					.addOption('major', 'Major')
					.addOption('moderate', 'Moderate')
					.addOption('minor', 'Minor')
					.setValue(this.event.importance)
					.onChange(value => {
						this.event.importance = value as any;
					});
			});

		// Start Date section
		container.createEl('h3', { text: 'Start Date', cls: 'timeline-modal-section-header' });
		this.renderDatePicker(container, this.event.startDate, 'start');

		// End Date section (optional)
		container.createEl('h3', { text: 'End Date (Optional)', cls: 'timeline-modal-section-header' });

		const hasEndDate = !!this.event.endDate;
		new Setting(container)
			.setName('Has end date')
			.setDesc('Enable if this is a multi-day event')
			.addToggle(toggle => toggle
				.setValue(hasEndDate)
				.onChange(value => {
					if (value && !this.event.endDate) {
						this.event.endDate = {
							precision: 'exact',
							isApproximate: false
						};
					} else if (!value) {
						delete this.event.endDate;
					}
					this.onOpen(); // Re-render to show/hide end date picker
				})
			);

		if (this.event.endDate) {
			this.renderDatePicker(container, this.event.endDate, 'end');
		}

		// Duration (calculated or manual)
		if (this.event.endDate) {
			const calculated = this.manager.calculateDuration(
				this.event.startDate,
				this.event.endDate
			);

			if (calculated !== null) {
				new Setting(container)
					.setName('Calculated Duration')
					.setDesc(`${calculated} days`)
					.setDisabled(true);
			}
		}
	}

	/**
	 * Render date picker for a TimelineDate
	 */
	private renderDatePicker(
		container: HTMLElement,
		date: TimelineDate,
		prefix: 'start' | 'end'
	): void {
		// Date precision
		new Setting(container)
			.setName('Date Precision')
			.setDesc('How precise is this date?')
			.addDropdown(dropdown => {
				dropdown
					.addOption('exact', 'Exact date/time')
					.addOption('day', 'Day known')
					.addOption('month', 'Month known')
					.addOption('year', 'Year only')
					.addOption('decade', 'Approximate decade')
					.addOption('century', 'Approximate century')
					.addOption('relative', 'Relative to another event')
					.addOption('unknown', 'Unknown')
					.setValue(date.precision)
					.onChange(value => {
						date.precision = value as DatePrecision;
						this.onOpen(); // Re-render
					});
			});

		// Approximate toggle
		new Setting(container)
			.setName('Approximate')
			.setDesc('Is this date approximate/uncertain?')
			.addToggle(toggle => toggle
				.setValue(date.isApproximate)
				.onChange(value => {
					date.isApproximate = value;
				})
			);

		// Standard date fields (for real-world dates)
		if (date.precision !== 'relative' && date.precision !== 'unknown') {
			const dateContainer = container.createDiv('timeline-date-fields');

			// Year
			if (['exact', 'day', 'month', 'year', 'decade', 'century'].includes(date.precision)) {
				new Setting(dateContainer)
					.setName('Year')
					.addText(text => text
						.setValue(date.year?.toString() || '')
						.setPlaceholder('2024')
						.onChange(value => {
							const num = parseInt(value);
							if (!isNaN(num)) {
								date.year = num;
							} else {
								delete date.year;
							}
						})
					);
			}

			// Month
			if (['exact', 'day', 'month'].includes(date.precision)) {
				new Setting(dateContainer)
					.setName('Month')
					.addText(text => text
						.setValue(date.month?.toString() || '')
						.setPlaceholder('1-12')
						.onChange(value => {
							const num = parseInt(value);
							if (!isNaN(num) && num >= 1 && num <= 12) {
								date.month = num;
							} else {
								delete date.month;
							}
						})
					);
			}

			// Day
			if (['exact', 'day'].includes(date.precision)) {
				new Setting(dateContainer)
					.setName('Day')
					.addText(text => text
						.setValue(date.day?.toString() || '')
						.setPlaceholder('1-31')
						.onChange(value => {
							const num = parseInt(value);
							if (!isNaN(num) && num >= 1 && num <= 31) {
								date.day = num;
							} else {
								delete date.day;
							}
						})
					);
			}

			// Hour and minute (for exact)
			if (date.precision === 'exact') {
				new Setting(dateContainer)
					.setName('Time (optional)')
					.addText(text => text
						.setValue(date.hour !== undefined ? `${date.hour}:${date.minute || 0}` : '')
						.setPlaceholder('HH:MM (e.g., 14:30)')
						.onChange(value => {
							if (value.includes(':')) {
								const [h, m] = value.split(':');
								const hour = parseInt(h);
								const minute = parseInt(m);
								if (!isNaN(hour) && hour >= 0 && hour <= 23) {
									date.hour = hour;
								}
								if (!isNaN(minute) && minute >= 0 && minute <= 59) {
									date.minute = minute;
								}
							} else {
								delete date.hour;
								delete date.minute;
							}
						})
					);
			}

			// Custom era (for fiction)
			new Setting(dateContainer)
				.setName('Custom Era (optional)')
				.setDesc('For fictional calendars (e.g., "Third Age")')
				.addText(text => text
					.setValue(date.customEra || '')
					.setPlaceholder('Third Age')
					.onChange(value => {
						if (value) {
							date.customEra = value;
						} else {
							delete date.customEra;
						}
					})
				);

			// Display text override
			new Setting(dateContainer)
				.setName('Display Text (optional)')
				.setDesc('Custom display format (e.g., "Spring 1920")')
				.addText(text => text
					.setValue(date.displayText || '')
					.setPlaceholder('Spring 1920')
					.onChange(value => {
						if (value) {
							date.displayText = value;
						} else {
							delete date.displayText;
						}
					})
				);
		}

		// Relative date fields
		if (date.precision === 'relative') {
			new Setting(container)
				.setName('Relative Description')
				.setDesc('E.g., "3 days after the battle"')
				.addText(text => text
					.setValue(date.relativeDescription || '')
					.setPlaceholder('3 days after...')
					.onChange(value => {
						date.relativeDescription = value;
					})
				);

			// TODO: Could add event picker for relativeToEventId
		}
	}

	/**
	 * Render Details tab
	 */
	private renderDetailsTab(container: HTMLElement): void {
		// Description
		new Setting(container)
			.setName('Description')
			.setDesc('Detailed description of this event')
			.addTextArea(text => {
				text.setValue(this.event.description || '')
					.onChange(value => {
						this.event.description = value;
					});
				text.inputEl.rows = 6;
			});

		// Location
		new Setting(container)
			.setName('Location')
			.setDesc('Where does this event occur?')
			.addText(text => text
				.setValue(this.event.location || '')
				.setPlaceholder('Paris, France')
				.onChange(value => {
					if (value) {
						this.event.location = value;
					} else {
						delete this.event.location;
					}
				})
			);

		// Color
		new Setting(container)
			.setName('Color')
			.setDesc('Color code for visual timeline')
			.addText(text => text
				.setValue(this.event.color || '')
				.setPlaceholder('#3498db')
				.onChange(value => {
					if (value) {
						this.event.color = value;
					} else {
						delete this.event.color;
					}
				})
			);

		// Tags
		new Setting(container)
			.setName('Tags')
			.setDesc('Comma-separated tags')
			.addText(text => text
				.setValue(this.event.tags?.join(', ') || '')
				.setPlaceholder('war, battle, turning-point')
				.onChange(value => {
					if (value.trim()) {
						this.event.tags = value.split(',')
							.map(t => t.trim().toLowerCase())
							.filter(t => t.length > 0);
					} else {
						this.event.tags = [];
					}
				})
			);
	}

	/**
	 * Render Links tab
	 */
	private renderLinksTab(container: HTMLElement): void {
		container.createEl('p', {
			text: 'Link this event to characters, scenes, research notes, and other events.',
			cls: 'setting-item-description'
		});

		// Character IDs (if character manager available)
		new Setting(container)
			.setName('Characters')
			.setDesc('Character IDs involved in this event (comma-separated)')
			.addText(text => text
				.setValue(this.event.characterIds?.join(', ') || '')
				.setPlaceholder('char-1, char-2')
				.onChange(value => {
					if (value.trim()) {
						this.event.characterIds = value.split(',').map(id => id.trim());
					} else {
						this.event.characterIds = [];
					}
				})
			);

		// Scene IDs
		new Setting(container)
			.setName('Scenes')
			.setDesc('Scene/chapter IDs related to this event')
			.addText(text => text
				.setValue(this.event.sceneIds?.join(', ') || '')
				.setPlaceholder('scene-1, scene-5')
				.onChange(value => {
					if (value.trim()) {
						this.event.sceneIds = value.split(',').map(id => id.trim());
					} else {
						this.event.sceneIds = [];
					}
				})
			);

		// Research Note IDs
		new Setting(container)
			.setName('Research Notes')
			.setDesc('Research note IDs linked to this event')
			.addText(text => text
				.setValue(this.event.researchNoteIds?.join(', ') || '')
				.setPlaceholder('research-1, research-3')
				.onChange(value => {
					if (value.trim()) {
						this.event.researchNoteIds = value.split(',').map(id => id.trim());
					} else {
						this.event.researchNoteIds = [];
					}
				})
			);

		// Parent Event
		new Setting(container)
			.setName('Parent Event')
			.setDesc('Parent event ID (if this is a sub-event)')
			.addText(text => text
				.setValue(this.event.parentEventId || '')
				.setPlaceholder('event-123')
				.onChange(value => {
					if (value) {
						this.event.parentEventId = value;
					} else {
						delete this.event.parentEventId;
					}
				})
			);

		// Child Events (display only)
		if (this.event.childEventIds && this.event.childEventIds.length > 0) {
			new Setting(container)
				.setName('Child Events')
				.setDesc(`${this.event.childEventIds.length} sub-events`)
				.setDisabled(true);
		}
	}

	/**
	 * Render Conflicts tab
	 */
	private renderConflictsTab(container: HTMLElement): void {
		const conflicts = this.event.conflicts || [];

		if (conflicts.length === 0) {
			container.createEl('p', {
				text: 'No conflicts detected for this event.',
				cls: 'timeline-empty-message'
			});
			return;
		}

		container.createEl('h3', {
			text: `${conflicts.length} Conflict(s) Detected`,
			cls: 'timeline-conflicts-header'
		});

		conflicts.forEach(conflict => {
			if (conflict.resolved || conflict.ignoredByUser) return;

			const conflictEl = container.createDiv('timeline-conflict-item');
			conflictEl.addClass(`severity-${conflict.severity}`);

			const header = conflictEl.createDiv('conflict-header');
			header.createSpan({ text: conflict.type, cls: 'conflict-type' });
			header.createSpan({ text: conflict.severity, cls: 'conflict-severity' });

			conflictEl.createDiv({ text: conflict.message, cls: 'conflict-message' });

			if (conflict.details) {
				const detailsEl = conflictEl.createDiv('conflict-details');
				detailsEl.createEl('pre', {
					text: JSON.stringify(conflict.details, null, 2)
				});
			}

			// Actions
			const actions = conflictEl.createDiv('conflict-actions');

			const resolveBtn = actions.createEl('button', {
				text: 'Mark Resolved',
				cls: 'mod-cta'
			});
			resolveBtn.addEventListener('click', () => {
				conflict.resolved = true;
				this.onOpen(); // Re-render
			});

			const ignoreBtn = actions.createEl('button', {
				text: 'Ignore',
				cls: 'mod-warning'
			});
			ignoreBtn.addEventListener('click', () => {
				conflict.ignoredByUser = true;
				this.onOpen(); // Re-render
			});
		});
	}

	/**
	 * Render Notes tab
	 */
	private renderNotesTab(container: HTMLElement): void {
		new Setting(container)
			.setName('Additional Notes')
			.setDesc('Any additional information about this event')
			.addTextArea(text => {
				text.setValue(this.event.notes || '')
					.onChange(value => {
						this.event.notes = value;
					});
				text.inputEl.rows = 15;
			});
	}

	/**
	 * Render save/cancel buttons
	 */
	private renderButtons(): void {
		const buttonContainer = this.contentEl.createDiv('modal-button-container');

		// Save button
		const saveBtn = buttonContainer.createEl('button', {
			text: this.isNewEvent ? 'Create Event' : 'Save Changes',
			cls: 'mod-cta'
		});
		saveBtn.addEventListener('click', async () => {
			await this.save();
		});

		// Cancel button
		const cancelBtn = buttonContainer.createEl('button', {
			text: 'Cancel'
		});
		cancelBtn.addEventListener('click', () => {
			this.close();
		});
	}

	/**
	 * Save event
	 */
	private async save(): Promise<void> {
		// Validation
		if (!this.event.title.trim()) {
			new Notice('Please enter a title');
			this.activeTab = 'basic';
			this.onOpen();
			return;
		}

		// Validate dates
		if (!this.validateDate(this.event.startDate)) {
			new Notice('Invalid start date');
			this.activeTab = 'basic';
			this.onOpen();
			return;
		}

		if (this.event.endDate && !this.validateDate(this.event.endDate)) {
			new Notice('Invalid end date');
			this.activeTab = 'basic';
			this.onOpen();
			return;
		}

		// Update modified timestamp
		this.event.modified = Date.now();

		// Save to manager
		if (this.isNewEvent) {
			// Create new event (manager will assign ID)
			this.manager.createEvent(
				this.event.title,
				this.event.type,
				this.event.startDate,
				this.event.importance
			);

			// Get the created event and update with full data
			const created = this.manager.getEvent(this.event.id);
			if (created) {
				this.manager.updateEvent(this.event.id, this.event);
			}
		} else {
			// Update existing event
			this.manager.updateEvent(this.event.id, this.event);
		}

		// Save settings
		await this.onSave();

		new Notice(this.isNewEvent ? 'Event created' : 'Event updated');
		this.close();
	}

	/**
	 * Validate a TimelineDate
	 */
	private validateDate(date: TimelineDate): boolean {
		// Unknown and relative dates are always valid
		if (date.precision === 'unknown' || date.precision === 'relative') {
			return true;
		}

		// Check required fields based on precision
		switch (date.precision) {
			case 'exact':
			case 'day':
				if (!date.year || !date.month || !date.day) {
					return false;
				}
				// Validate date values
				if (date.month < 1 || date.month > 12) return false;
				if (date.day < 1 || date.day > 31) return false;
				break;

			case 'month':
				if (!date.year || !date.month) {
					return false;
				}
				if (date.month < 1 || date.month > 12) return false;
				break;

			case 'year':
			case 'decade':
			case 'century':
				if (!date.year) {
					return false;
				}
				break;
		}

		return true;
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
