/**
 * Cross-Reference Intelligence Interfaces
 * Data models for label indexing and reference management
 */

export type LabelType = 'section' | 'subsection' | 'figure' | 'table' | 'equation' | 'listing' | 'other';
export type RefType = 'ref' | 'eqref' | 'cref' | 'pageref' | 'autoref';
export type IssueSeverity = 'error' | 'warning' | 'info';
export type IssueType = 'undefined-ref' | 'duplicate-label' | 'orphaned-label' | 'invalid-format';

export interface Position {
	line: number;
	ch: number;
}

export interface ReferenceLocation {
	file: string;
	position: Position;
	refType: RefType;
	context: string; // Surrounding text for preview
}

export interface LabelMetadata {
	sectionTitle?: string;
	figureCaption?: string;
	tableCaption?: string;
	equationContent?: string;
}

export interface LabelEntry {
	key: string;
	type: LabelType;
	file: string;
	position: Position;
	context: string; // Surrounding text
	references: ReferenceLocation[];
	metadata?: LabelMetadata;
	createdAt: number;
}

export interface ValidationIssue {
	type: IssueType;
	severity: IssueSeverity;
	message: string;
	location: {
		file: string;
		line: number;
		ch: number;
	};
	suggestions?: string[];
	fix?: () => void;
}

export interface CrossRefData {
	labels: Record<string, LabelEntry>; // key -> LabelEntry
	lastIndexed: number;
	indexedFiles: string[];
}

export interface LabelSuggestion {
	key: string;
	type: LabelType;
	context: string;
	score: number; // Relevance score for sorting
	file: string;
	line: number;
}
