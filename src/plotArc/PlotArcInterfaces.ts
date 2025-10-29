/**
 * Plot Arc Tracker Interfaces
 * Data models for tracking plot threads, story structure, and pacing
 */

/**
 * Plot thread types
 */
export type PlotThreadType =
	| 'main-plot'
	| 'subplot'
	| 'character-arc'
	| 'mystery'
	| 'romance'
	| 'custom';

/**
 * Plot thread status
 */
export type PlotThreadStatus = 'active' | 'resolved' | 'abandoned';

/**
 * Story structure milestone types
 */
export type MilestoneType =
	| 'setup'
	| 'inciting-incident'
	| 'rising-action'
	| 'midpoint'
	| 'climax'
	| 'resolution'
	| 'custom';

/**
 * How prominently a plot thread appears in a scene
 */
export type PlotProminence = 'primary' | 'secondary' | 'mentioned';

/**
 * Story structure frameworks
 */
export type StoryStructure =
	| 'three-act'
	| 'four-act'
	| 'five-act'
	| 'save-the-cat'
	| 'heros-journey'
	| 'seven-point'
	| 'custom';

/**
 * Plot thread - A storyline that runs through the manuscript
 */
export interface PlotThread {
	id: string;
	title: string;
	type: PlotThreadType;
	description: string;
	color: string; // Hex color for visualization

	// Status
	status: PlotThreadStatus;
	resolution?: string; // How this thread was resolved

	// Progression through manuscript
	milestones: PlotMilestone[];
	appearances: PlotAppearance[];

	// Relationships
	relatedCharacters: string[]; // Character IDs
	relatedThreads: string[]; // Other plot thread IDs that interact with this one
	conflicts: string[]; // Plot thread IDs that conflict with this one (creates tension)

	// Metadata
	created: number;
	modified: number;
}

/**
 * Plot milestone - A significant event in a plot thread
 */
export interface PlotMilestone {
	id: string;
	sceneId?: string; // Link to outliner scene (optional)
	chapterNumber?: number; // Chapter where this occurs
	position: number; // Position in manuscript (0-100%)

	type: MilestoneType;
	description: string;
	tension: number; // 1-10 intensity rating
	notes?: string;

	// Story structure markers
	actNumber?: number; // 1, 2, 3 for three-act structure
	beatSheet?: string; // Save the Cat beat, Hero's Journey stage, etc.

	created: number;
}

/**
 * Plot appearance - Where a plot thread appears in the manuscript
 */
export interface PlotAppearance {
	sceneId: string; // Scene where thread appears
	chapterNumber?: number;
	prominence: PlotProminence;
	notes?: string;
}

/**
 * Plot analysis issue
 */
export interface PlotIssue {
	id: string;
	severity: 'critical' | 'warning' | 'info';
	type:
		| 'unresolved-thread'
		| 'missing-climax'
		| 'flat-pacing'
		| 'orphaned-milestone'
		| 'missing-beat'
		| 'low-tension'
		| 'inconsistent-pacing';
	threadId?: string;
	message: string;
	suggestion?: string;
	location?: {
		chapterNumber?: number;
		position?: number; // 0-100%
	};
}

/**
 * Plot Arc settings
 */
export interface PlotArcSettings {
	enabled: boolean;
	structure: StoryStructure;
	showTensionGraph: boolean;
	showTimeline: boolean;
	colorCodeThreads: boolean;
	autoAnalyze: boolean; // Automatically run plot hole detection
	defaultThreadColor: string;
}

/**
 * Tension data point for graphing
 */
export interface TensionDataPoint {
	position: number; // 0-100% through manuscript
	tension: number; // 1-10
	threadId?: string; // If specific to a thread
	chapterNumber?: number;
}

/**
 * Story beat definition (for Save the Cat, Hero's Journey, etc.)
 */
export interface StoryBeat {
	id: string;
	name: string;
	description: string;
	expectedPosition: number; // Expected position as % (e.g., 25 for 25%)
	structure: StoryStructure;
}

/**
 * Plot Arc data stored in settings
 */
export interface PlotArcData {
	threads: PlotThread[];
	settings: PlotArcSettings;
	lastAnalysis?: number; // Timestamp of last plot analysis
	issues?: PlotIssue[]; // Cached analysis results
}

/**
 * Default story beats for various structures
 */
export const STORY_BEATS: Record<StoryStructure, StoryBeat[]> = {
	'three-act': [
		{ id: 'act1-setup', name: 'Act 1: Setup', description: 'Introduce world, characters, status quo', expectedPosition: 0, structure: 'three-act' },
		{ id: 'inciting', name: 'Inciting Incident', description: 'Event that sets story in motion', expectedPosition: 12, structure: 'three-act' },
		{ id: 'act1-end', name: 'Plot Point 1', description: 'End of Act 1, point of no return', expectedPosition: 25, structure: 'three-act' },
		{ id: 'midpoint', name: 'Midpoint', description: 'Major revelation or reversal', expectedPosition: 50, structure: 'three-act' },
		{ id: 'act2-end', name: 'Plot Point 2', description: 'Lowest point, all is lost', expectedPosition: 75, structure: 'three-act' },
		{ id: 'climax', name: 'Climax', description: 'Final confrontation', expectedPosition: 90, structure: 'three-act' },
		{ id: 'resolution', name: 'Resolution', description: 'New normal established', expectedPosition: 98, structure: 'three-act' },
	],
	'save-the-cat': [
		{ id: 'opening', name: 'Opening Image', description: 'Snapshot of protagonist\'s world', expectedPosition: 0, structure: 'save-the-cat' },
		{ id: 'theme', name: 'Theme Stated', description: 'Hint at story\'s deeper meaning', expectedPosition: 5, structure: 'save-the-cat' },
		{ id: 'catalyst', name: 'Catalyst', description: 'Life-changing event', expectedPosition: 10, structure: 'save-the-cat' },
		{ id: 'debate', name: 'Debate', description: 'Protagonist hesitates', expectedPosition: 12, structure: 'save-the-cat' },
		{ id: 'break-into-2', name: 'Break Into Two', description: 'Commits to journey', expectedPosition: 20, structure: 'save-the-cat' },
		{ id: 'b-story', name: 'B Story', description: 'Love story or relationship begins', expectedPosition: 22, structure: 'save-the-cat' },
		{ id: 'fun-games', name: 'Fun and Games', description: 'Promise of the premise', expectedPosition: 30, structure: 'save-the-cat' },
		{ id: 'midpoint', name: 'Midpoint', description: 'False victory or false defeat', expectedPosition: 50, structure: 'save-the-cat' },
		{ id: 'bad-guys', name: 'Bad Guys Close In', description: 'Forces of antagonism regroup', expectedPosition: 55, structure: 'save-the-cat' },
		{ id: 'all-is-lost', name: 'All Is Lost', description: 'Lowest point', expectedPosition: 75, structure: 'save-the-cat' },
		{ id: 'dark-night', name: 'Dark Night of the Soul', description: 'Emotional despair', expectedPosition: 78, structure: 'save-the-cat' },
		{ id: 'break-into-3', name: 'Break Into Three', description: 'Solution found', expectedPosition: 80, structure: 'save-the-cat' },
		{ id: 'finale', name: 'Finale', description: 'Synthesize everything learned', expectedPosition: 85, structure: 'save-the-cat' },
		{ id: 'closing', name: 'Final Image', description: 'Opposite of opening image', expectedPosition: 99, structure: 'save-the-cat' },
	],
	'heros-journey': [
		{ id: 'ordinary', name: 'Ordinary World', description: 'Hero in normal life', expectedPosition: 0, structure: 'heros-journey' },
		{ id: 'call', name: 'Call to Adventure', description: 'Problem or challenge presented', expectedPosition: 10, structure: 'heros-journey' },
		{ id: 'refusal', name: 'Refusal of the Call', description: 'Hero hesitates', expectedPosition: 12, structure: 'heros-journey' },
		{ id: 'mentor', name: 'Meeting the Mentor', description: 'Guidance received', expectedPosition: 15, structure: 'heros-journey' },
		{ id: 'threshold', name: 'Crossing the Threshold', description: 'Enter special world', expectedPosition: 20, structure: 'heros-journey' },
		{ id: 'tests', name: 'Tests, Allies, Enemies', description: 'Learn the rules', expectedPosition: 30, structure: 'heros-journey' },
		{ id: 'approach', name: 'Approach to Inmost Cave', description: 'Prepare for ordeal', expectedPosition: 45, structure: 'heros-journey' },
		{ id: 'ordeal', name: 'Ordeal', description: 'Face greatest fear', expectedPosition: 50, structure: 'heros-journey' },
		{ id: 'reward', name: 'Reward', description: 'Seize the sword', expectedPosition: 60, structure: 'heros-journey' },
		{ id: 'road-back', name: 'The Road Back', description: 'Return journey begins', expectedPosition: 70, structure: 'heros-journey' },
		{ id: 'resurrection', name: 'Resurrection', description: 'Final test using lessons', expectedPosition: 85, structure: 'heros-journey' },
		{ id: 'elixir', name: 'Return with Elixir', description: 'Bring wisdom home', expectedPosition: 98, structure: 'heros-journey' },
	],
	'seven-point': [
		{ id: 'hook', name: 'Hook', description: 'Grab reader attention', expectedPosition: 0, structure: 'seven-point' },
		{ id: 'plot1', name: 'Plot Turn 1', description: 'Introduce conflict', expectedPosition: 12, structure: 'seven-point' },
		{ id: 'pinch1', name: 'Pinch Point 1', description: 'Apply pressure', expectedPosition: 33, structure: 'seven-point' },
		{ id: 'midpoint', name: 'Midpoint', description: 'Move from reaction to action', expectedPosition: 50, structure: 'seven-point' },
		{ id: 'pinch2', name: 'Pinch Point 2', description: 'Things get worse', expectedPosition: 66, structure: 'seven-point' },
		{ id: 'plot2', name: 'Plot Turn 2', description: 'Power for final battle', expectedPosition: 75, structure: 'seven-point' },
		{ id: 'resolution', name: 'Resolution', description: 'Resolve plot threads', expectedPosition: 98, structure: 'seven-point' },
	],
	'four-act': [
		{ id: 'act1', name: 'Act 1: Setup', description: 'Establish world and characters', expectedPosition: 0, structure: 'four-act' },
		{ id: 'turn1', name: 'First Turning Point', description: 'Inciting incident', expectedPosition: 25, structure: 'four-act' },
		{ id: 'act2', name: 'Act 2: Response', description: 'React to conflict', expectedPosition: 26, structure: 'four-act' },
		{ id: 'turn2', name: 'Second Turning Point', description: 'Midpoint shift', expectedPosition: 50, structure: 'four-act' },
		{ id: 'act3', name: 'Act 3: Attack', description: 'Proactive approach', expectedPosition: 51, structure: 'four-act' },
		{ id: 'turn3', name: 'Third Turning Point', description: 'Crisis point', expectedPosition: 75, structure: 'four-act' },
		{ id: 'act4', name: 'Act 4: Resolution', description: 'Climax and resolution', expectedPosition: 76, structure: 'four-act' },
	],
	'five-act': [
		{ id: 'act1', name: 'Act 1: Exposition', description: 'Establish world', expectedPosition: 0, structure: 'five-act' },
		{ id: 'act2', name: 'Act 2: Rising Action', description: 'Complications arise', expectedPosition: 20, structure: 'five-act' },
		{ id: 'act3', name: 'Act 3: Climax', description: 'Turning point', expectedPosition: 50, structure: 'five-act' },
		{ id: 'act4', name: 'Act 4: Falling Action', description: 'Consequences unfold', expectedPosition: 70, structure: 'five-act' },
		{ id: 'act5', name: 'Act 5: Denouement', description: 'Resolution', expectedPosition: 90, structure: 'five-act' },
	],
	'custom': [],
};

/**
 * Default colors for different plot thread types
 */
export const DEFAULT_THREAD_COLORS: Record<PlotThreadType, string> = {
	'main-plot': '#4A90E2',
	'subplot': '#7B68EE',
	'character-arc': '#50C878',
	'mystery': '#E94B3C',
	'romance': '#FF69B4',
	'custom': '#9B9B9B',
};
