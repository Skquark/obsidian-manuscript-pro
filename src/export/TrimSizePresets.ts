/**
 * Trim Size Presets
 * Industry-standard book trim sizes with smart margin calculations
 */

export interface TrimSize {
	id: string;
	name: string;
	width: string; // e.g., "6in"
	height: string; // e.g., "9in"
	margins: {
		top: string;
		bottom: string;
		outer: string;
		innerBase: string; // Base inner margin
		innerPer100Pages: string; // Additional margin per 100 pages
	};
	description: string;
	commonUse: string;
}

/**
 * Industry-standard trim size presets
 */
export const TRIM_SIZE_PRESETS: TrimSize[] = [
	{
		id: '6x9',
		name: '6" × 9" (Trade Paperback)',
		width: '6in',
		height: '9in',
		margins: {
			top: '0.75in',
			bottom: '0.875in',
			outer: '0.625in',
			innerBase: '0.75in',
			innerPer100Pages: '0.0625in',
		},
		description: 'Standard fiction and non-fiction',
		commonUse: 'Most common size for novels and trade books',
	},
	{
		id: '7x10',
		name: '7" × 10" (Large Format)',
		width: '7in',
		height: '10in',
		margins: {
			top: '0.875in',
			bottom: '1in',
			outer: '0.75in',
			innerBase: '0.875in',
			innerPer100Pages: '0.0625in',
		},
		description: 'Textbooks, technical manuals, cookbooks',
		commonUse: 'Non-fiction requiring larger text area',
	},
	{
		id: '8x10',
		name: '8" × 10" (Workbook)',
		width: '8in',
		height: '10in',
		margins: {
			top: '0.875in',
			bottom: '1in',
			outer: '0.75in',
			innerBase: '1in',
			innerPer100Pages: '0.0625in',
		},
		description: 'Workbooks, journals, activity books',
		commonUse: 'Interactive content requiring writing space',
	},
	{
		id: '8.5x11',
		name: '8.5" × 11" (US Letter)',
		width: '8.5in',
		height: '11in',
		margins: {
			top: '1in',
			bottom: '1in',
			outer: '0.75in',
			innerBase: '1in',
			innerPer100Pages: '0.0625in',
		},
		description: 'Reports, manuals, course materials',
		commonUse: 'Business documents and academic papers',
	},
	{
		id: '5.5x8.5',
		name: '5.5" × 8.5" (Digest)',
		width: '5.5in',
		height: '8.5in',
		margins: {
			top: '0.625in',
			bottom: '0.75in',
			outer: '0.5in',
			innerBase: '0.625in',
			innerPer100Pages: '0.0625in',
		},
		description: 'Mass market paperbacks, pocket books',
		commonUse: 'Compact fiction, travel guides',
	},
	{
		id: '5x8',
		name: '5" × 8" (Mass Market)',
		width: '5in',
		height: '8in',
		margins: {
			top: '0.5in',
			bottom: '0.625in',
			outer: '0.5in',
			innerBase: '0.5in',
			innerPer100Pages: '0.05in',
		},
		description: 'Mass market paperbacks',
		commonUse: 'Genre fiction, airport books',
	},
];

/**
 * Get trim size preset by ID
 */
export function getTrimSizeById(id: string): TrimSize | undefined {
	return TRIM_SIZE_PRESETS.find((size) => size.id === id);
}

/**
 * Calculate inner margin based on estimated page count
 * Formula: innerBase + (pageCount / 100) * innerPer100Pages
 *
 * Example: 300-page book with 6x9 trim
 * - Base: 0.75in
 * - Per 100: 0.0625in
 * - Total: 0.75 + (300/100) * 0.0625 = 0.9375in
 */
export function calculateInnerMargin(pageCount: number, trimSize: TrimSize): string {
	const base = parseFloat(trimSize.margins.innerBase);
	const per100 = parseFloat(trimSize.margins.innerPer100Pages);
	const additional = (pageCount / 100) * per100;
	const total = base + additional;
	return `${total.toFixed(4)}in`;
}

/**
 * Count words in markdown text
 * Strips YAML frontmatter and code blocks
 */
export function countWords(text: string): number {
	// Remove YAML frontmatter
	text = text.replace(/^---\n[\s\S]*?\n---\n/, '');

	// Remove code blocks
	text = text.replace(/```[\s\S]*?```/g, '');

	// Remove inline code
	text = text.replace(/`[^`]+`/g, '');

	// Remove markdown formatting
	text = text.replace(/[#*_~\[\]()]/g, '');

	// Split by whitespace and count non-empty words
	const words = text.split(/\s+/).filter((word) => word.length > 0);
	return words.length;
}

/**
 * Estimate page count from manuscript text
 * Uses empirical data: ~250 words per page for standard 6x9 trim
 */
export function estimatePageCount(manuscriptText: string, trimSize: TrimSize): number {
	const wordCount = countWords(manuscriptText);

	// Adjust words-per-page based on trim size
	const wordsPerPage: Record<string, number> = {
		'6x9': 250,
		'7x10': 350,
		'8x10': 400,
		'8.5x11': 450,
		'5.5x8.5': 200,
		'5x8': 180,
	};

	const wpp = wordsPerPage[trimSize.id] || 250;
	return Math.ceil(wordCount / wpp);
}

/**
 * Format page count with commas (e.g., 1,234)
 */
export function formatPageCount(count: number): string {
	return count.toLocaleString();
}

/**
 * Build geometry string for Pandoc from trim size and page count
 * Returns geometry value suitable for Pandoc's --variable geometry option
 */
export function buildGeometry(trimSize: TrimSize, pageCount: number): string {
	const innerMargin = calculateInnerMargin(pageCount, trimSize);

	const parts = [
		`paperwidth=${trimSize.width}`,
		`paperheight=${trimSize.height}`,
		`top=${trimSize.margins.top}`,
		`bottom=${trimSize.margins.bottom}`,
		`inner=${innerMargin}`,
		`outer=${trimSize.margins.outer}`,
	];

	return parts.join(',');
}
