/**
 * Citation Importer
 * Auto-fetch citations from DOI, arXiv, PubMed, etc.
 */

import { Notice, requestUrl } from 'obsidian';
import type LatexPandocConcealerPlugin from '../main';
import type {
	CitationImportRequest,
	CitationImportResult,
	BibEntryEnhanced,
	DOIMetadata,
	ArXivMetadata,
	PubMedMetadata,
} from './EnhancedBibInterfaces';

export class CitationImporter {
	private lastRequestTime: number = 0;
	private readonly MIN_REQUEST_INTERVAL = 1000; // 1 second between requests

	constructor(private plugin: LatexPandocConcealerPlugin) {}

	/**
	 * Import citation from any supported source
	 */
	async importCitation(request: CitationImportRequest): Promise<CitationImportResult> {
		// Rate limiting
		await this.respectRateLimit();

		try {
			switch (request.source) {
				case 'doi':
					return await this.importFromDOI(request.identifier);
				case 'arxiv':
					return await this.importFromArXiv(request.identifier);
				case 'pubmed':
					return await this.importFromPubMed(request.identifier);
				default:
					return {
						success: false,
						error: `Unsupported citation source: ${request.source}`,
					};
			}
		} catch (error: any) {
			return {
				success: false,
				error: error.message || 'Unknown error during import',
			};
		}
	}

	/**
	 * Import citation from DOI using CrossRef API
	 */
	private async importFromDOI(doi: string): Promise<CitationImportResult> {
		// Clean DOI (remove https://doi.org/ prefix if present)
		const cleanDOI = doi.replace(/^https?:\/\/doi\.org\//i, '').trim();

		// Validate DOI format (basic validation)
		if (!cleanDOI || cleanDOI.length === 0) {
			return {
				success: false,
				error: 'Invalid DOI: DOI cannot be empty',
				source: 'doi',
				identifier: doi,
			};
		}

		// DOI should contain at least one slash and valid characters
		if (!/^10\.\d{4,}[\d.]*\/\S+$/.test(cleanDOI)) {
			return {
				success: false,
				error: 'Invalid DOI format. DOI should start with "10." followed by a registration agency code and a suffix',
				source: 'doi',
				identifier: cleanDOI,
			};
		}

		try {
			// Fetch metadata from CrossRef
			const url = `https://api.crossref.org/works/${encodeURIComponent(cleanDOI)}`;
			const headers: Record<string, string> = {
				Accept: 'application/json',
			};

			// Add polite API usage (recommended by CrossRef)
			const email = this.plugin.settings.enhancedBib?.apiConfig?.crossrefEmail;
			if (email) {
				headers['User-Agent'] = `ObsidianLatexPandoc/1.0 (mailto:${email})`;
			}

			const response = await requestUrl({
				url,
				method: 'GET',
				headers,
			});

			if (response.status !== 200) {
				throw new Error(`CrossRef API returned status ${response.status}`);
			}

			const data = response.json;
			const metadata: DOIMetadata = data.message;

			// Convert to BibTeX entry
			const entry = this.convertDOIToBibTeX(cleanDOI, metadata);

			return {
				success: true,
				entry,
				source: 'doi',
				identifier: cleanDOI,
			};
		} catch (error: any) {
			return {
				success: false,
				error: `Failed to import DOI: ${error.message}`,
				source: 'doi',
				identifier: cleanDOI,
			};
		}
	}

	/**
	 * Import citation from arXiv ID
	 */
	private async importFromArXiv(arxivId: string): Promise<CitationImportResult> {
		// Clean arXiv ID (e.g., "2301.12345" or "arXiv:2301.12345")
		const cleanId = arxivId.replace(/^arxiv:/i, '').trim();

		// Validate arXiv ID format (YYMM.NNNNN or YYMM.NNNNNN or old format)
		if (!cleanId || cleanId.length === 0) {
			return {
				success: false,
				error: 'Invalid arXiv ID: ID cannot be empty',
				source: 'arxiv',
				identifier: arxivId,
			};
		}

		// arXiv IDs: new format (YYMM.NNNNN) or old format (arch-ive/YYMMNNN)
		if (!/^\d{4}\.\d{4,5}(v\d+)?$/.test(cleanId) && !/^[a-z-]+\/\d{7}$/.test(cleanId)) {
			return {
				success: false,
				error: 'Invalid arXiv ID format. Expected format: YYMM.NNNNN or arch-ive/YYMMNNN',
				source: 'arxiv',
				identifier: cleanId,
			};
		}

		try {
			// Fetch metadata from arXiv API (use HTTPS)
			const url = `https://export.arxiv.org/api/query?id_list=${encodeURIComponent(cleanId)}`;

			const response = await requestUrl({
				url,
				method: 'GET',
			});

			if (response.status !== 200) {
				throw new Error(`arXiv API returned status ${response.status}`);
			}

			// Parse XML response
			const xmlText = response.text;
			const entry = this.parseArXivXML(cleanId, xmlText);

			if (!entry) {
				throw new Error('No entry found in arXiv response');
			}

			return {
				success: true,
				entry,
				source: 'arxiv',
				identifier: cleanId,
			};
		} catch (error: any) {
			return {
				success: false,
				error: `Failed to import arXiv: ${error.message}`,
				source: 'arxiv',
				identifier: cleanId,
			};
		}
	}

	/**
	 * Import citation from PubMed ID
	 */
	private async importFromPubMed(pmid: string): Promise<CitationImportResult> {
		const cleanPMID = pmid.replace(/^PMID:/i, '').trim();

		// Validate PubMed ID (should be numeric)
		if (!cleanPMID || cleanPMID.length === 0) {
			return {
				success: false,
				error: 'Invalid PubMed ID: ID cannot be empty',
				source: 'pubmed',
				identifier: pmid,
			};
		}

		if (!/^\d+$/.test(cleanPMID)) {
			return {
				success: false,
				error: 'Invalid PubMed ID format. PubMed IDs should be numeric',
				source: 'pubmed',
				identifier: cleanPMID,
			};
		}

		try {
			// Use NCBI E-utilities API
			const baseUrl = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';
			const apiKey = this.plugin.settings.enhancedBib?.apiConfig?.pubmedApiKey;
			const apiKeyParam = apiKey ? `&api_key=${apiKey}` : '';

			// Fetch summary
			const url = `${baseUrl}/esummary.fcgi?db=pubmed&id=${cleanPMID}&retmode=json${apiKeyParam}`;

			const response = await requestUrl({
				url,
				method: 'GET',
			});

			if (response.status !== 200) {
				throw new Error(`PubMed API returned status ${response.status}`);
			}

			const data = response.json;
			const result = data.result[cleanPMID];

			if (!result) {
				throw new Error('PubMed ID not found');
			}

			// Convert to BibTeX entry
			const entry = this.convertPubMedToBibTeX(cleanPMID, result);

			return {
				success: true,
				entry,
				source: 'pubmed',
				identifier: cleanPMID,
			};
		} catch (error: any) {
			return {
				success: false,
				error: `Failed to import PubMed: ${error.message}`,
				source: 'pubmed',
				identifier: cleanPMID,
			};
		}
	}

	/**
	 * Convert DOI metadata to BibTeX entry
	 */
	private convertDOIToBibTeX(doi: string, metadata: DOIMetadata): BibEntryEnhanced {
		const type = this.mapCrossRefType(metadata.type);

		// Generate citation key from first author + year
		const firstAuthor = metadata.author?.[0]?.family || 'unknown';
		const year = metadata.published?.['date-parts']?.[0]?.[0] || new Date().getFullYear();
		const key = `${firstAuthor.toLowerCase()}${year}`;

		const fields: Record<string, string> = {
			doi,
		};

		// Title
		if (metadata.title && metadata.title.length > 0) {
			fields.title = metadata.title[0];
		}

		// Authors
		if (metadata.author && metadata.author.length > 0) {
			fields.author = metadata.author.map((a) => `${a.family}, ${a.given}`).join(' and ');
		}

		// Journal
		if (metadata['container-title'] && metadata['container-title'].length > 0) {
			fields.journal = metadata['container-title'][0];
		}

		// Year
		if (year) {
			fields.year = year.toString();
		}

		// Volume, issue, pages
		if (metadata.volume) fields.volume = metadata.volume;
		if (metadata.issue) fields.number = metadata.issue;
		if (metadata.page) fields.pages = metadata.page;

		// Publisher
		if (metadata.publisher) fields.publisher = metadata.publisher;

		// URL
		if (metadata.URL) fields.url = metadata.URL;

		return {
			key,
			type,
			fields,
			metadata: {
				imported: true,
				importSource: 'doi',
				importDate: Date.now(),
				verified: false,
			},
		};
	}

	/**
	 * Parse arXiv XML response and convert to BibTeX
	 */
	private parseArXivXML(arxivId: string, xmlText: string): BibEntryEnhanced | null {
		// Simple XML parsing (would use proper XML parser in production)
		const titleMatch = xmlText.match(/<title>([^<]+)<\/title>/);
		const summaryMatch = xmlText.match(/<summary>([^<]+)<\/summary>/);
		const publishedMatch = xmlText.match(/<published>([^<]+)<\/published>/);
		const authorMatches = xmlText.matchAll(/<name>([^<]+)<\/name>/g);

		if (!titleMatch) return null;

		// Extract authors
		const authors: string[] = [];
		for (const match of authorMatches) {
			authors.push(match[1]);
		}

		// Generate key
		const firstAuthor = authors[0]?.split(' ').pop() || 'unknown';
		const year = publishedMatch ? new Date(publishedMatch[1]).getFullYear() : new Date().getFullYear();
		const key = `${firstAuthor.toLowerCase()}${year}arxiv`;

		const fields: Record<string, string> = {
			title: titleMatch[1],
			author: authors.join(' and '),
			year: year.toString(),
			eprint: arxivId,
			archivePrefix: 'arXiv',
		};

		if (summaryMatch) {
			fields.abstract = summaryMatch[1].trim();
		}

		return {
			key,
			type: 'article',
			fields,
			metadata: {
				imported: true,
				importSource: 'arxiv',
				importDate: Date.now(),
				verified: false,
			},
		};
	}

	/**
	 * Convert PubMed metadata to BibTeX
	 */
	private convertPubMedToBibTeX(pmid: string, data: any): BibEntryEnhanced {
		// Extract fields from PubMed data
		const title = data.title || '';
		const authors = data.authors?.map((a: any) => a.name).join(' and ') || '';
		const journal = data.fulljournalname || data.source || '';
		const year = data.pubdate?.split(' ')[0] || new Date().getFullYear().toString();
		const volume = data.volume || '';
		const issue = data.issue || '';
		const pages = data.pages || '';

		// Generate key
		const firstAuthor = authors.split(' and ')[0]?.split(',')[0] || 'unknown';
		const key = `${firstAuthor.toLowerCase()}${year}`;

		const fields: Record<string, string> = {
			title,
			author: authors,
			journal,
			year,
			pmid,
		};

		if (volume) fields.volume = volume;
		if (issue) fields.number = issue;
		if (pages) fields.pages = pages;
		if (data.doi) fields.doi = data.doi;

		return {
			key,
			type: 'article',
			fields,
			metadata: {
				imported: true,
				importSource: 'pubmed',
				importDate: Date.now(),
				verified: false,
			},
		};
	}

	/**
	 * Map CrossRef type to BibTeX type
	 */
	private mapCrossRefType(crossrefType: string): string {
		const typeMap: Record<string, string> = {
			'journal-article': 'article',
			'book-chapter': 'inbook',
			'posted-content': 'misc',
			'proceedings-article': 'inproceedings',
			monograph: 'book',
			'edited-book': 'book',
			'reference-entry': 'inbook',
		};

		return typeMap[crossrefType] || 'article';
	}

	/**
	 * Rate limiting helper
	 */
	private async respectRateLimit(): Promise<void> {
		const now = Date.now();
		const elapsed = now - this.lastRequestTime;
		const delay = this.plugin.settings.enhancedBib?.apiConfig?.rateLimitDelay || this.MIN_REQUEST_INTERVAL;

		if (elapsed < delay) {
			await new Promise((resolve) => setTimeout(resolve, delay - elapsed));
		}

		this.lastRequestTime = Date.now();
	}
}
