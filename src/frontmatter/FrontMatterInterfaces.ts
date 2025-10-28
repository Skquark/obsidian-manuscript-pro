/**
 * Front Matter Interfaces
 * Data models for professional manuscript front matter generation
 */

export interface FrontMatterData {
	// Title Page
	title: string;
	subtitle?: string;
	author: string;
	authorCredentials?: string; // e.g., "PhD, MD"
	publisher?: string;
	publisherLogo?: string; // Path to logo image
	publisherLocation?: string; // e.g., "New York, NY"

	// Copyright Page
	copyright: {
		year: number;
		holder: string;
		isbn?: string;
		eisbn?: string; // Electronic ISBN for ebooks
		edition?: string; // "First Edition", "Second Edition", etc.
		printingNumber?: number; // 1, 2, 3, etc.
		lccn?: string; // Library of Congress Control Number
		additionalNotices?: string[]; // "All rights reserved", custom notices
		permissions?: string; // Permissions text
		disclaimer?: string; // Legal disclaimers
	};

	// Publication Details
	publication?: {
		publishDate?: string; // "January 2025"
		printedIn?: string; // "United States of America"
		catalogData?: string; // Library cataloging info
		websiteUrl?: string;
		contactEmail?: string;
	};

	// Front Matter Sections
	dedication?: string;
	epigraph?: {
		text: string;
		attribution: string;
		source?: string; // Book title, article, etc.
	};
	foreword?: {
		text: string;
		author?: string;
	};
	preface?: string;
	acknowledgments?: string;
	introduction?: string;

	// Back Matter Sections
	aboutAuthor?: {
		bio: string;
		photo?: string; // Path to author photo
		website?: string;
		socialMedia?: {
			twitter?: string;
			instagram?: string;
			facebook?: string;
			linkedin?: string;
		};
	};
	alsoBy?: {
		title: string;
		books: string[]; // List of book titles
	};
}

export type FrontMatterStyle = 'classic' | 'modern' | 'minimalist' | 'academic';

export interface StyleTemplate {
	name: string;
	id: FrontMatterStyle;
	description: string;

	// LaTeX template configuration
	latex: {
		titlePageTemplate: string;
		copyrightPageTemplate: string;
		fonts: {
			title: string;
			author: string;
			body: string;
		};
		spacing: {
			titleSize: string; // e.g., "\\Huge"
			subtitleSize: string;
			authorSize: string;
		};
		alignment: 'left' | 'center' | 'right';
		useGeometry?: boolean; // Custom page geometry
		customPreamble?: string; // Additional LaTeX commands
	};

	// Markdown template
	markdown: {
		useHorizontalRules: boolean;
		centerText: boolean;
		blankLinesBetweenSections: number;
	};
}

export interface FrontMatterOutput {
	// Separate markdown files
	markdownFiles?: {
		[filename: string]: string; // e.g., "01-title.md": "content..."
	};

	// LaTeX preamble for export
	latexPreamble?: string;

	// EPUB metadata
	epubMetadata?: {
		dcTitle: string;
		dcCreator: string;
		dcPublisher?: string;
		dcDate?: string;
		dcRights?: string;
		dcIdentifier?: string; // ISBN
	};
}

export interface FrontMatterPreferences {
	style: FrontMatterStyle;
	includeTitlePage: boolean;
	includeCopyrightPage: boolean;
	includeDedication: boolean;
	includeEpigraph: boolean;
	includeForeword: boolean;
	includePreface: boolean;
	includeAcknowledgments: boolean;
	includeAboutAuthor: boolean;
	includeAlsoBy: boolean;

	// Export preferences
	exportAsFiles: boolean; // Create separate .md files
	exportFormat: 'markdown' | 'latex' | 'both';
	outputDirectory?: string;

	// Numbering
	useRomanNumeralsForFrontMatter: boolean;
	startChapterNumberingAfterIntro: boolean;
}
