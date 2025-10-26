/**
 * Citation Hover Extension
 * CodeMirror 6 extension for showing citation tooltips on hover
 */

import { EditorView, hoverTooltip, Tooltip } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import type LatexPandocConcealerPlugin from '../main';
import { BibTeXParser } from './BibTeXParser';

/**
 * Extract citation key at position
 */
function getCitationAtPos(state: EditorState, pos: number): { key: string; from: number; to: number } | null {
	const line = state.doc.lineAt(pos);
	const lineText = line.text;
	const lineStart = line.from;
	const relativePos = pos - lineStart;

	// Pattern for Pandoc citations: [@key], @key, [-@key]
	const citationPattern = /(?:\[@?-?)([a-zA-Z0-9_\-:]+)(?:\]|(?=[\s,;]))/g;
	let match;

	while ((match = citationPattern.exec(lineText)) !== null) {
		const keyStart = match.index + match[0].indexOf(match[1]);
		const keyEnd = keyStart + match[1].length;

		// Check if cursor is over the citation key
		if (relativePos >= keyStart && relativePos <= keyEnd) {
			return {
				key: match[1],
				from: lineStart + keyStart,
				to: lineStart + keyEnd,
			};
		}
	}

	return null;
}

/**
 * Create citation tooltip DOM
 */
function createCitationTooltip(plugin: LatexPandocConcealerPlugin, key: string): HTMLElement {
	const container = document.createElement('div');
	container.className = 'citation-tooltip';

	const entry = plugin.bibliographyManager.getCitation(key);

	if (!entry) {
		// Undefined citation
		container.addClass('citation-undefined');

		const header = container.createDiv({ cls: 'citation-header' });
		header.createEl('span', { cls: 'citation-status citation-status-error', text: '✗' });
		header.createEl('span', { cls: 'citation-key', text: key });

		container.createEl('p', {
			cls: 'citation-message',
			text: 'Citation not found in bibliography',
		});

		const hint = container.createEl('p', { cls: 'citation-hint' });
		hint.textContent = 'Check that your .bib file contains this entry.';

		return container;
	}

	// Valid citation
	container.addClass('citation-valid');

	// Header
	const header = container.createDiv({ cls: 'citation-header' });

	const typeBadge = header.createEl('span', {
		cls: 'citation-type-badge',
		text: entry.type,
	});
	typeBadge.setAttribute('data-type', entry.type);

	header.createEl('span', { cls: 'citation-key', text: entry.key });

	// Validation status
	const validation = BibTeXParser.validate(entry);
	if (validation.valid) {
		header.createEl('span', { cls: 'citation-status citation-status-valid', text: '✓' });
	} else {
		const warning = header.createEl('span', {
			cls: 'citation-status citation-status-warning',
			text: '⚠',
		});
		warning.title = `Missing fields: ${validation.missing.join(', ')}`;
	}

	// Formatted citation
	const formatted = plugin.citationFormatter.format(entry);
	const formattedDiv = container.createDiv({ cls: 'citation-formatted' });
	formattedDiv.innerHTML = formatted;

	// Key fields
	const fields = container.createDiv({ cls: 'citation-fields' });

	// DOI/URL
	const doi = entry.fields.get('doi');
	const url = entry.fields.get('url');

	if (doi) {
		const doiDiv = fields.createDiv({ cls: 'citation-field' });
		doiDiv.createEl('strong', { text: 'DOI: ' });
		const doiLink = doiDiv.createEl('a', {
			text: doi,
			href: `https://doi.org/${doi}`,
		});
		doiLink.target = '_blank';
		doiLink.rel = 'noopener noreferrer';
	} else if (url) {
		const urlDiv = fields.createDiv({ cls: 'citation-field' });
		urlDiv.createEl('strong', { text: 'URL: ' });
		const urlLink = urlDiv.createEl('a', {
			text: url.length > 50 ? url.substring(0, 47) + '...' : url,
			href: url,
		});
		urlLink.target = '_blank';
		urlLink.rel = 'noopener noreferrer';
	}

	// Abstract (expandable)
	const abstract = entry.fields.get('abstract');
	if (abstract && abstract.length > 0) {
		const abstractDiv = fields.createDiv({ cls: 'citation-field citation-abstract' });
		const abstractToggle = abstractDiv.createEl('strong', {
			text: 'Abstract ▼',
			cls: 'citation-abstract-toggle',
		});
		const abstractText = abstractDiv.createEl('p', {
			text: abstract,
			cls: 'citation-abstract-text',
		});
		abstractText.style.display = 'none';

		abstractToggle.addEventListener('click', () => {
			const isHidden = abstractText.style.display === 'none';
			abstractText.style.display = isHidden ? 'block' : 'none';
			abstractToggle.textContent = isHidden ? 'Abstract ▲' : 'Abstract ▼';
		});
	}

	// Quick actions
    const actions = container.createDiv({ cls: 'citation-actions' });

	const copyKeyBtn = actions.createEl('button', {
		text: '📋 Copy Key',
		cls: 'citation-action-button',
	});
	copyKeyBtn.addEventListener('click', () => {
		navigator.clipboard.writeText(entry.key);
		copyKeyBtn.textContent = '✓ Copied!';
		setTimeout(() => {
			copyKeyBtn.textContent = '📋 Copy Key';
		}, 2000);
	});

	const copyCitationBtn = actions.createEl('button', {
		text: '📝 Copy Citation',
		cls: 'citation-action-button',
	});
    copyCitationBtn.addEventListener('click', () => {
        // Copy plain text version (strip HTML)
        const plainText = formatted.replace(/<[^>]*>/g, '');
        navigator.clipboard.writeText(plainText);
        copyCitationBtn.textContent = '✓ Copied!';
        setTimeout(() => {
            copyCitationBtn.textContent = '📝 Copy Citation';
        }, 2000);
    });

    const copyBibBtn = actions.createEl('button', {
        text: '📚 Copy BibTeX',
        cls: 'citation-action-button',
    });
    copyBibBtn.addEventListener('click', () => {
        try {
            const bib = plugin.bibliographyManager.toBibTeX(entry);
            navigator.clipboard.writeText(bib);
            copyBibBtn.textContent = '✓ Copied!';
            setTimeout(() => (copyBibBtn.textContent = '📚 Copy BibTeX'), 2000);
        } catch (e) {
            copyBibBtn.textContent = '✗ Error';
            setTimeout(() => (copyBibBtn.textContent = '📚 Copy BibTeX'), 2000);
        }
    });

    // Open DOI/URL action
    const openBtn = actions.createEl('button', {
        text: '🔗 Open DOI/URL',
        cls: 'citation-action-button',
    });
    const targetUrl = doi ? `https://doi.org/${doi}` : (url || '');
    if (!targetUrl) {
        openBtn.setAttr('disabled', 'true');
        openBtn.title = 'No DOI or URL available';
    }
    openBtn.addEventListener('click', async () => {
        if (!targetUrl) return;
        try {
            // Prefer electron shell when available
            const electron = require('electron');
            const shell = electron?.shell || electron?.remote?.shell;
            if (shell?.openExternal) {
                await shell.openExternal(targetUrl);
            } else {
                window.open(targetUrl, '_blank', 'noopener');
            }
        } catch (e) {
            try {
                window.open(targetUrl, '_blank', 'noopener');
            } catch (_) {
                openBtn.textContent = '✗ Failed to open';
                setTimeout(() => (openBtn.textContent = '🔗 Open DOI/URL'), 2000);
            }
        }
    });

	// Citation style indicator
	const styleIndicator = container.createDiv({ cls: 'citation-style-indicator' });
	styleIndicator.textContent = `Style: ${plugin.citationFormatter.getActiveStyle()}`;

    return container;
}

/**
 * Create hover tooltip extension
 */
export function createCitationHoverExtension(plugin: LatexPandocConcealerPlugin) {
	return hoverTooltip(
		(view: EditorView, pos: number): Tooltip | null => {
			// Only show if citations are enabled
			if (!plugin.settings.citations.enabled || !plugin.settings.citations.showTooltip) {
				return null;
			}

			const citation = getCitationAtPos(view.state, pos);
			if (!citation) {
				return null;
			}

			return {
				pos: citation.from,
				end: citation.to,
				above: true,
				create: () => {
					const dom = createCitationTooltip(plugin, citation.key);
					return { dom };
				},
			};
		},
		{
			// Hover delay in milliseconds
			hoverTime: 300,
		},
	);
}

/**
 * Load bibliography for active file
 */
export async function loadBibliographyForActiveFile(plugin: LatexPandocConcealerPlugin) {
	const activeFile = plugin.app.workspace.getActiveFile();
	if (!activeFile) return;

	try {
		const bibPaths = await plugin.bibliographyManager.discoverBibliography(activeFile);
		await plugin.bibliographyManager.loadBibliography(bibPaths);

		if (plugin.settings.debugMode) {
			const stats = plugin.bibliographyManager.getStats();
			console.log(
				`Manuscript Pro: Citation Preview: Loaded ${stats.totalEntries} entries from ${stats.filesLoaded} files`,
			);
		}
	} catch (error) {
		if (plugin.settings.debugMode) {
			console.error('Manuscript Pro: Failed to load bibliography:', error);
		}
	}
}
