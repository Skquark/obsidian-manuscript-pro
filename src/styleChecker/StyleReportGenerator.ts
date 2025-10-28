import { App, TFile, Notice } from 'obsidian';
import { StyleCheckResult, StyleIssue, ReadabilityMetrics, TenseAnalysis, POVAnalysis } from './StyleCheckerInterfaces';
import { StyleChecker } from './StyleChecker';

/**
 * Style Report Generator
 * Creates comprehensive style analysis reports
 */
export class StyleReportGenerator {
	private app: App;
	private checker: StyleChecker;

	constructor(app: App, checker: StyleChecker) {
		this.app = app;
		this.checker = checker;
	}

	/**
	 * Generate comprehensive report for a file
	 */
	async generateReport(file: TFile, result: StyleCheckResult): Promise<string> {
		const content = await this.app.vault.read(file);

		// Get additional analyses
		const tenseAnalysis = this.checker.analyzeTense(content);
		const povAnalysis = this.checker.analyzePOV(content);
		const readabilityMetrics = this.checker.calculateReadability(content);

		// Build report
		let report = '';

		report += this.renderHeader(file, result);
		report += this.renderExecutiveSummary(result, readabilityMetrics);
		report += this.renderReadabilitySection(readabilityMetrics);
		report += this.renderTenseAnalysis(tenseAnalysis);
		report += this.renderPOVAnalysis(povAnalysis);
		report += this.renderIssuesByCategory(result);
		report += this.renderDetailedIssues(result);
		report += this.renderFooter();

		return report;
	}

	/**
	 * Generate HTML report
	 */
	async generateHTMLReport(file: TFile, result: StyleCheckResult): Promise<string> {
		const markdownReport = await this.generateReport(file, result);

		// Simple markdown to HTML conversion
		let html = `<!DOCTYPE html>
<html>
<head>
	<meta charset="UTF-8">
	<title>Style Report - ${file.basename}</title>
	<style>
		${this.getReportCSS()}
	</style>
</head>
<body>
	<div class="report-container">
`;

		// Convert markdown to HTML (basic conversion)
		html += this.markdownToHTML(markdownReport);

		html += `
	</div>
</body>
</html>`;

		return html;
	}

	/**
	 * Export report to file
	 */
	async exportReport(
		file: TFile,
		result: StyleCheckResult,
		format: 'markdown' | 'html'
	): Promise<void> {
		try {
			let content: string;
			let extension: string;

			if (format === 'html') {
				content = await this.generateHTMLReport(file, result);
				extension = 'html';
			} else {
				content = await this.generateReport(file, result);
				extension = 'md';
			}

			// Create report filename
			const reportName = `${file.basename}_style_report.${extension}`;
			const reportPath = file.parent ? `${file.parent.path}/${reportName}` : reportName;

			// Write report
			await this.app.vault.create(reportPath, content);

			new Notice(`Style report saved to ${reportName}`);
		} catch (error) {
			console.error('Failed to export report:', error);
			new Notice('Failed to export style report');
		}
	}

	/**
	 * Render report header
	 */
	private renderHeader(file: TFile, result: StyleCheckResult): string {
		const date = new Date(result.timestamp).toLocaleString();

		return `# Style Analysis Report

**File:** ${file.path}
**Generated:** ${date}
**Total Issues:** ${result.totalIssues}

---

`;
	}

	/**
	 * Render executive summary
	 */
	private renderExecutiveSummary(result: StyleCheckResult, metrics: ReadabilityMetrics): string {
		const gradeLevel = metrics.fleschKincaidGrade.toFixed(1);
		const readingEase = metrics.fleschReadingEase.toFixed(1);

		let easeDescription = '';
		if (metrics.fleschReadingEase >= 90) easeDescription = 'Very Easy';
		else if (metrics.fleschReadingEase >= 80) easeDescription = 'Easy';
		else if (metrics.fleschReadingEase >= 70) easeDescription = 'Fairly Easy';
		else if (metrics.fleschReadingEase >= 60) easeDescription = 'Standard';
		else if (metrics.fleschReadingEase >= 50) easeDescription = 'Fairly Difficult';
		else if (metrics.fleschReadingEase >= 30) easeDescription = 'Difficult';
		else easeDescription = 'Very Difficult';

		return `## Executive Summary

| Metric | Value |
|--------|-------|
| **Errors** | ${result.errors.length} |
| **Warnings** | ${result.warnings.length} |
| **Suggestions** | ${result.suggestions.length} |
| **Word Count** | ${result.wordCount} |
| **Reading Grade Level** | ${gradeLevel} |
| **Reading Ease** | ${readingEase}/100 (${easeDescription}) |
| **Avg Words/Sentence** | ${metrics.avgWordsPerSentence.toFixed(1)} |

---

`;
	}

	/**
	 * Render readability section
	 */
	private renderReadabilitySection(metrics: ReadabilityMetrics): string {
		return `## Readability Analysis

### Flesch-Kincaid Metrics
- **Grade Level:** ${metrics.fleschKincaidGrade.toFixed(1)} (${this.getGradeLevelDescription(metrics.fleschKincaidGrade)})
- **Reading Ease:** ${metrics.fleschReadingEase.toFixed(1)}/100
- **Complex Words:** ${metrics.complexWords} (3+ syllables)

### Sentence Variety
- **Short Sentences (<10 words):** ${metrics.shortSentences}
- **Medium Sentences (10-20 words):** ${metrics.mediumSentences}
- **Long Sentences (20-30 words):** ${metrics.longSentences}
- **Very Long Sentences (30+ words):** ${metrics.veryLongSentences}

### Paragraph Analysis
- **Avg Sentences/Paragraph:** ${metrics.avgSentencesPerParagraph.toFixed(1)}
- **Short Paragraphs (1-2 sentences):** ${metrics.shortParagraphs}
- **Long Paragraphs (8+ sentences):** ${metrics.longParagraphs}

---

`;
	}

	/**
	 * Render tense analysis
	 */
	private renderTenseAnalysis(analysis: TenseAnalysis): string {
		const confidencePercent = (analysis.confidence * 100).toFixed(1);

		return `## Tense Analysis

**Dominant Tense:** ${analysis.dominantTense} (${confidencePercent}% confidence)

| Tense | Count |
|-------|-------|
| Past | ${analysis.pastTenseCount} |
| Present | ${analysis.presentTenseCount} |
| Future | ${analysis.futureTenseCount} |

---

`;
	}

	/**
	 * Render POV analysis
	 */
	private renderPOVAnalysis(analysis: POVAnalysis): string {
		const confidencePercent = (analysis.confidence * 100).toFixed(1);

		return `## Point of View Analysis

**Dominant POV:** ${analysis.dominantPOV} person (${confidencePercent}% confidence)

| POV | Count |
|-----|-------|
| First Person | ${analysis.firstPersonCount} |
| Second Person | ${analysis.secondPersonCount} |
| Third Person | ${analysis.thirdPersonCount} |

---

`;
	}

	/**
	 * Render issues by category
	 */
	private renderIssuesByCategory(result: StyleCheckResult): string {
		let section = `## Issues by Category\n\n`;

		const categories = Object.entries(result.issuesByCategory)
			.filter(([_, count]) => count > 0)
			.sort((a, b) => b[1] - a[1]);

		if (categories.length === 0) {
			section += '*No issues found.*\n\n';
		} else {
			section += '| Category | Count |\n';
			section += '|----------|-------|\n';

			categories.forEach(([category, count]) => {
				section += `| ${category} | ${count} |\n`;
			});

			section += '\n';
		}

		section += '---\n\n';

		return section;
	}

	/**
	 * Render detailed issues
	 */
	private renderDetailedIssues(result: StyleCheckResult): string {
		let section = `## Detailed Issues\n\n`;

		// Group by severity
		const groups = [
			{ severity: 'error', issues: result.errors, icon: '❌' },
			{ severity: 'warning', issues: result.warnings, icon: '⚠️' },
			{ severity: 'info', issues: result.info, icon: 'ℹ️' },
			{ severity: 'suggestion', issues: result.suggestions, icon: '💡' }
		];

		groups.forEach(({ severity, issues, icon }) => {
			if (issues.length === 0) return;

			section += `### ${icon} ${severity.toUpperCase()} (${issues.length})\n\n`;

			issues.forEach((issue, index) => {
				section += `**${index + 1}. ${issue.ruleName}** (Line ${issue.line})\n`;
				section += `- **Message:** ${issue.message}\n`;
				section += `- **Category:** ${issue.category}\n`;

				if (issue.context) {
					section += `- **Context:** \`${issue.matchedText}\`\n`;
				}

				if (issue.suggestion) {
					section += `- **Suggestion:** ${issue.suggestion}\n`;
				}

				section += '\n';
			});

			section += '---\n\n';
		});

		return section;
	}

	/**
	 * Render footer
	 */
	private renderFooter(): string {
		return `\n---\n\n*Report generated by Manuscript Pro Style Checker*\n`;
	}

	/**
	 * Get grade level description
	 */
	private getGradeLevelDescription(grade: number): string {
		if (grade <= 6) return 'Elementary School';
		if (grade <= 8) return 'Middle School';
		if (grade <= 12) return 'High School';
		if (grade <= 16) return 'College';
		return 'Graduate Level';
	}

	/**
	 * Basic markdown to HTML conversion
	 */
	private markdownToHTML(markdown: string): string {
		let html = markdown;

		// Headers
		html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
		html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
		html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');

		// Bold
		html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

		// Italic
		html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

		// Code
		html = html.replace(/`(.+?)`/g, '<code>$1</code>');

		// Horizontal rules
		html = html.replace(/^---$/gm, '<hr>');

		// Tables
		html = this.convertTables(html);

		// Lists
		html = this.convertLists(html);

		// Paragraphs
		html = html.replace(/\n\n/g, '</p><p>');
		html = '<p>' + html + '</p>';

		// Clean up empty paragraphs
		html = html.replace(/<p><\/p>/g, '');
		html = html.replace(/<p>\s*<h/g, '<h');
		html = html.replace(/<\/h[1-6]>\s*<\/p>/g, '</h1>');
		html = html.replace(/<p>\s*<hr>/g, '<hr>');
		html = html.replace(/<\/hr>\s*<\/p>/g, '<hr>');

		return html;
	}

	/**
	 * Convert markdown tables to HTML
	 */
	private convertTables(html: string): string {
		const tableRegex = /\|(.+)\|\n\|[-:\s|]+\|\n((?:\|.+\|\n?)*)/g;

		return html.replace(tableRegex, (match, header, rows) => {
			const headers = header.split('|').map((h: string) => h.trim()).filter((h: string) => h);
			const rowsArr = rows.trim().split('\n').map((r: string) =>
				r.split('|').map((c: string) => c.trim()).filter((c: string) => c)
			);

			let table = '<table class="report-table">\n<thead>\n<tr>\n';
			headers.forEach((h: string) => {
				table += `<th>${h}</th>\n`;
			});
			table += '</tr>\n</thead>\n<tbody>\n';

			rowsArr.forEach((row: string[]) => {
				table += '<tr>\n';
				row.forEach((cell: string) => {
					table += `<td>${cell}</td>\n`;
				});
				table += '</tr>\n';
			});

			table += '</tbody>\n</table>\n';
			return table;
		});
	}

	/**
	 * Convert markdown lists to HTML
	 */
	private convertLists(html: string): string {
		// Simple unordered list conversion
		html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
		html = html.replace(/(<li>.+<\/li>\n)+/g, '<ul>$&</ul>');

		return html;
	}

	/**
	 * Get CSS for HTML reports
	 */
	private getReportCSS(): string {
		return `
			body {
				font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
				line-height: 1.6;
				color: #333;
				max-width: 900px;
				margin: 0 auto;
				padding: 20px;
				background: #f5f5f5;
			}

			.report-container {
				background: white;
				padding: 40px;
				border-radius: 8px;
				box-shadow: 0 2px 8px rgba(0,0,0,0.1);
			}

			h1 {
				color: #2c3e50;
				border-bottom: 3px solid #3498db;
				padding-bottom: 10px;
				margin-bottom: 20px;
			}

			h2 {
				color: #34495e;
				margin-top: 32px;
				margin-bottom: 16px;
				border-bottom: 2px solid #ecf0f1;
				padding-bottom: 8px;
			}

			h3 {
				color: #7f8c8d;
				margin-top: 24px;
				margin-bottom: 12px;
			}

			table.report-table {
				width: 100%;
				border-collapse: collapse;
				margin: 16px 0;
			}

			table.report-table th {
				background: #3498db;
				color: white;
				padding: 12px;
				text-align: left;
				font-weight: 600;
			}

			table.report-table td {
				padding: 10px 12px;
				border-bottom: 1px solid #ecf0f1;
			}

			table.report-table tr:hover {
				background: #f8f9fa;
			}

			code {
				background: #f4f4f4;
				padding: 2px 6px;
				border-radius: 3px;
				font-family: 'Courier New', monospace;
				font-size: 0.9em;
			}

			hr {
				border: none;
				border-top: 1px solid #ecf0f1;
				margin: 24px 0;
			}

			ul, ol {
				padding-left: 24px;
			}

			li {
				margin: 8px 0;
			}

			strong {
				color: #2c3e50;
			}

			.metric-value {
				color: #3498db;
				font-weight: 600;
			}

			@media print {
				body {
					background: white;
				}

				.report-container {
					box-shadow: none;
					padding: 0;
				}
			}
		`;
	}
}
