/**
 * Pre-publication Validation Data Models
 * Defines validation issues, rules, and results
 */

/**
 * Validation issue severity levels
 */
export type ValidationSeverity = 'critical' | 'error' | 'warning' | 'info';

/**
 * Validation issue categories
 */
export type ValidationCategory =
	| 'reference' // Cross-references (labels, refs)
	| 'citation' // Bibliography and citations
	| 'figure' // Figures and images
	| 'table' // Tables
	| 'equation' // Equations
	| 'structure' // Document structure
	| 'format' // Formatting issues
	| 'consistency'; // Style consistency

/**
 * Position in a file
 */
export interface ValidationPosition {
	file: string;
	line?: number;
	ch?: number;
}

/**
 * A single validation issue
 */
export interface ValidationIssue {
	id: string; // Unique identifier for the issue
	severity: ValidationSeverity;
	category: ValidationCategory;
	message: string;
	description?: string; // Longer explanation
	location: ValidationPosition;
	suggestion?: string; // How to fix
	autoFixable: boolean;
	relatedIssues?: string[]; // IDs of related issues
}

/**
 * Validation results grouped by category
 */
export interface ValidationResults {
	timestamp: number;
	filesScanned: number;
	issues: ValidationIssue[];
	summary: ValidationSummary;
}

/**
 * Summary statistics of validation
 */
export interface ValidationSummary {
	total: number;
	bySeverity: {
		critical: number;
		error: number;
		warning: number;
		info: number;
	};
	byCategory: {
		reference: number;
		citation: number;
		figure: number;
		table: number;
		equation: number;
		structure: number;
		format: number;
		consistency: number;
	};
}

/**
 * Validation rule definition
 */
export interface ValidationRule {
	id: string;
	name: string;
	description: string;
	category: ValidationCategory;
	severity: ValidationSeverity;
	enabled: boolean;
	validate: (context: ValidationContext) => Promise<ValidationIssue[]>;
}

/**
 * Context passed to validation rules
 */
export interface ValidationContext {
	files: string[]; // Files to validate
	plugin: any; // Plugin instance for accessing managers
	config?: any; // Manuscript config if available
}

/**
 * Settings for validation feature
 */
export interface ValidationSettings {
	enabled: boolean;
	autoValidateOnSave: boolean;
	showPanel: boolean;

	// Rule toggles
	validateReferences: boolean;
	validateCitations: boolean;
	validateFigures: boolean;
	validateTables: boolean;
	validateEquations: boolean;
	validateStructure: boolean;

	// Display options
	groupByCategory: boolean;
	hideInfoLevel: boolean;
	showOnlyErrors: boolean;
}
