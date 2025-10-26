/**
 * Comprehensive Manuscript Schema
 * Supports everything from indie authors to large publishing houses
 */

/**
 * Author or contributor information
 */
export interface Author {
	name: string;
	role: 'primary' | 'co-author' | 'contributor' | 'editor' | 'translator' | 'illustrator' | 'foreword';
	bio?: string;
	email?: string;
	website?: string;
	orcid?: string; // Open Researcher and Contributor ID
}

/**
 * Copyright and legal information
 */
export interface Copyright {
	year: number;
	holder: string;
	statement: string;
	license?: 'all-rights-reserved' | 'cc-by' | 'cc-by-sa' | 'cc-by-nd' | 'cc-by-nc' | 'cc-by-nc-sa' | 'cc-by-nc-nd' | 'public-domain' | 'custom';
	customLicense?: string;
	registrationNumber?: string; // Copyright office registration
}

/**
 * Series information
 */
export interface Series {
	name: string;
	number: number;
	totalBooks?: number;
}

/**
 * Publishing metadata
 */
export interface PublishingMetadata {
	// Classification
	bisacCodes?: string[]; // Book Industry Standards and Communications
	bisacDescriptions?: string[];
	themaSubjectCodes?: string[]; // International subject classification
	deweyDecimal?: string;
	loc?: string; // Library of Congress Classification
	
	// Audience
	readingLevel?: 'children' | 'young-adult' | 'adult' | 'professional' | 'academic';
	ageRange?: string; // e.g., "8-12", "18+"
	gradeRange?: string; // e.g., "3-5"
	
	// Content warnings and ratings
	contentWarnings?: string[];
	contentRating?: string; // e.g., "PG-13", "Mature"
	
	// Subjects and keywords
	subjects?: string[];
	keywords?: string[];
	
	// Series
	series?: Series;
	
	// Additional metadata
	edition?: string; // e.g., "First Edition", "Revised"
	printingNumber?: number;
	publicationDate?: string; // ISO date
	territory?: string; // e.g., "World", "US and Canada"
	language: string; // ISO 639-1 code
	
	// Book descriptions
	shortDescription?: string; // 150-200 chars for catalogs
	longDescription?: string; // Full back cover copy
	marketingCopy?: string; // Promotional description
	
	// Endorsements and reviews
	endorsements?: Endorsement[];
	reviews?: Review[];
}

export interface Endorsement {
	quote: string;
	author: string;
	credentials?: string; // e.g., "New York Times bestselling author"
	source?: string;
}

export interface Review {
	quote: string;
	source: string; // e.g., "Publishers Weekly"
	rating?: number;
	url?: string;
}

/**
 * ISBN and product identifiers
 */
export interface ProductIdentifiers {
	isbn13?: string;
	isbn10?: string;
	eisbn?: string; // eBook ISBN
	asin?: string; // Amazon Standard Identification Number
	lccn?: string; // Library of Congress Control Number
	doi?: string; // Digital Object Identifier
	oclc?: string; // OCLC number
}

/**
 * Pricing information
 */
export interface Pricing {
	usd?: number;
	gbp?: number;
	eur?: number;
	cad?: number;
	aud?: number;
	currency?: string; // ISO 4217 currency code
	custom?: { [currencyCode: string]: number };
}

/**
 * Barcode configuration
 */
export interface BarcodeConfig {
	position: 'back-cover-bottom-right' | 'back-cover-bottom-left' | 'inside-back' | 'none';
	marginRight?: string;
	marginBottom?: string;
	includePrice?: boolean;
}

/**
 * Trim size and margins
 */
export interface TrimSize {
	name: string;
	width: string; // e.g., "6in"
	height: string; // e.g., "9in"
	margins: {
		top: string;
		bottom: string;
		outer: string;
		innerBase: string; // Base gutter width
		innerPerPage?: string; // Additional gutter per 100 pages
	};
}

/**
 * Edition configuration (different formats/versions)
 */
export interface Edition {
	name: string;
	identifiers: ProductIdentifiers;
	trimSize: string; // Reference to trim size ID
	binding: 'hardcover' | 'perfect' | 'saddle-stitch' | 'spiral' | 'digital' | 'audio';
	pricing: Pricing;
	template?: string; // LaTeX or CSS template name
	description?: string;
	barcode: BarcodeConfig;
	coverImage?: string; // Path to cover image file
	active?: boolean; // Whether this edition is currently in production
}

/**
 * Section types
 */
export type SectionType = 'frontmatter' | 'mainmatter' | 'backmatter';

/**
 * Section defaults
 */
export interface SectionDefaults {
	spacing: number; // Line spacing multiplier
	pagebreak: boolean; // Start on new page
	toc: boolean; // Include in table of contents
	numbered?: boolean; // Chapter/section numbering
	optional?: boolean; // Can be excluded in profiles
}

/**
 * Table of contents configuration
 */
export interface TocConfig {
	depth: {
		epigraph?: number; // -1 to hide
		frontmatter?: number; // 0 = chapters only, 1 = sections, 2 = subsections
		mainmatter?: number;
		backmatter?: number;
	};
	title?: string; // Custom ToC title
	pageNumbers?: boolean;
	links?: boolean; // Hyperlinks in digital editions
}

/**
 * Manuscript file entry
 */
export interface ManuscriptFile {
	file: string; // Path to markdown file
	title?: string; // Override title from file
	spacing?: number; // Override default spacing
	pagebreak?: boolean; // Override default pagebreak
	toc?: boolean; // Override default TOC inclusion
	numbered?: boolean; // Override default numbering
	optional?: boolean; // Can be excluded in profiles
	comment?: string; // Notes about this file
	
	// Advanced options
	headerTitle?: string; // Custom running header
	suppressHeader?: boolean; // Don't show header on this section
	suppressPageNumber?: boolean;
	startOnRecto?: boolean; // Start on right-hand page
	clearDoublePage?: boolean; // Clear to next recto page with blank verso
}

/**
 * Build profile (for creating different versions)
 */
export interface BuildProfile {
	name: string;
	comment?: string;
	frontmatter: 'all' | string[]; // Array of file names or "all"
	mainmatter: 'all' | string[]; // Array of file names or "all"
	backmatter: 'all' | string[]; // Array of file names or "all"
	edition?: string; // Which edition to build for
	outputFormats?: ('pdf' | 'epub' | 'mobi' | 'docx' | 'html')[]; // Target formats
}

/**
 * Version control entry
 */
export interface VersionEntry {
	version: string; // Semantic version (e.g., "1.0.2")
	date: string; // ISO date
	changes: string[];
	author?: string;
}

/**
 * Manuscript project configuration
 */
export interface ManuscriptProject {
	// Schema version for future compatibility
	schemaVersion: string;
	
	// Basic book information
	book: {
		title: string;
		subtitle?: string;
		version: string;
		authors: Author[];
		copyright: Copyright;
		metadata: PublishingMetadata;
	};
	
	// Physical specifications
	editions: { [editionId: string]: Edition };
	trimSizes: { [trimSizeId: string]: TrimSize };
	
	// Default behavior per section type
	defaults: {
		frontmatter: SectionDefaults;
		mainmatter: SectionDefaults;
		backmatter: SectionDefaults;
		tocDepth: TocConfig['depth'];
		toc?: Partial<TocConfig>;
	};
	
	// Manuscript structure
	frontmatter: ManuscriptFile[];
	mainmatter: ManuscriptFile[];
	backmatter: ManuscriptFile[];
	
	// Build profiles
	profiles: { [profileId: string]: BuildProfile };
	
	// Version history
	versionHistory?: VersionEntry[];
	
	// Plugin-specific settings
	settings?: {
		autoSave?: boolean;
		validateOnSave?: boolean;
		backupManifest?: boolean;
		wordCountGoals?: {
			daily?: number;
			total?: number;
		};
	};
}

/**
 * Validation result
 */
export interface ValidationResult {
	valid: boolean;
	errors: ValidationError[];
	warnings: ValidationWarning[];
}

export interface ValidationError {
	path: string; // JSON path to error
	message: string;
	severity: 'error';
}

export interface ValidationWarning {
	path: string;
	message: string;
	severity: 'warning';
}
