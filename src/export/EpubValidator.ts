/**
 * EPUB Validator
 * Validates EPUB files using EPUBCheck to ensure compliance with standards
 */

import { Notice } from 'obsidian';
import { execFile } from 'child_process';
import { promisify } from 'util';
import type LatexPandocConcealerPlugin from '../main';

const execFileAsync = promisify(execFile);

export type ValidationSeverity = 'error' | 'fatal' | 'warning' | 'info';

export interface ValidationIssue {
	severity: ValidationSeverity;
	message: string;
	location?: string; // File and line number
	type?: string; // Issue type/code
}

export interface ValidationResult {
	available: boolean;
	valid?: boolean;
	errors?: ValidationIssue[];
	warnings?: ValidationIssue[];
	info?: ValidationIssue[];
	summary?: ValidationSummary;
	rawOutput?: string;
	message?: string; // For unavailable case
}

export interface ValidationSummary {
	errorCount: number;
	warningCount: number;
	infoCount: number;
	epubVersion?: string;
	checkerVersion?: string;
}

export class EpubValidator {
	private epubCheckVersion: string | null = null;

	constructor(private plugin: LatexPandocConcealerPlugin) {}

	/**
	 * Check if EPUBCheck is available
	 */
	async checkEpubCheckAvailable(): Promise<boolean> {
		try {
			const epubCheckPath = this.getEpubCheckPath();
			const { stdout } = await execFileAsync('java', ['-jar', epubCheckPath, '--version']);

			// Parse version from output
			const versionMatch = stdout.match(/EPUBCheck\s+v?([\d.]+)/i);
			if (versionMatch) {
				this.epubCheckVersion = versionMatch[1];
				return true;
			}

			return false;
		} catch (error) {
			// Check if Java is available
			try {
				await execFileAsync('java', ['-version']);
				// Java is available, but EPUBCheck might not be
				return false;
			} catch {
				// Java is not available
				return false;
			}
		}
	}

	/**
	 * Get EPUBCheck JAR path
	 */
	private getEpubCheckPath(): string {
		// Check for custom path in settings
		const customPath = this.plugin.settings.export?.epubCheckPath;
		if (customPath) {
			const sanitized = customPath.trim();
			// Validate that path doesn't contain dangerous characters
			if (/[;&|`$()<>]/.test(sanitized)) {
				console.error('Invalid EPUBCheck path detected:', customPath);
				new Notice('Invalid EPUBCheck path configuration. Using default.');
				return 'epubcheck.jar';
			}
			return sanitized;
		}

		// Try common locations
		const commonPaths = [
			'epubcheck.jar',
			'./epubcheck.jar',
			'/usr/local/bin/epubcheck.jar',
			'/usr/share/java/epubcheck.jar',
			'C:\\Program Files\\EPUBCheck\\epubcheck.jar',
		];

		// Return first path (will try all during validation)
		return commonPaths[0];
	}

	/**
	 * Validate an EPUB file
	 */
	async validate(epubPath: string): Promise<ValidationResult> {
		// Check if EPUBCheck is available
		const epubCheckAvailable = await this.checkEpubCheckAvailable();

		if (!epubCheckAvailable) {
			return {
				available: false,
				message: 'EPUBCheck not found. Install EPUBCheck to validate EPUB files.',
			};
		}

		try {
			const epubCheckPath = this.getEpubCheckPath();

			// Run EPUBCheck with JSON output for easier parsing
			const args = ['-jar', epubCheckPath, epubPath, '--json', '-'];

			const { stdout, stderr } = await execFileAsync('java', args, {
				maxBuffer: 10 * 1024 * 1024, // 10MB buffer
			});

			// Parse JSON output
			const result = this.parseJsonOutput(stdout);
			result.available = true;

			return result;
		} catch (error: any) {
			// If JSON parsing fails, try parsing text output
			if (error.stdout || error.stderr) {
				const result = this.parseTextOutput(error.stdout || error.stderr);
				result.available = true;
				return result;
			}

			return {
				available: true,
				valid: false,
				errors: [
					{
						severity: 'error',
						message: `Validation failed: ${error.message}`,
					},
				],
				warnings: [],
				info: [],
			};
		}
	}

	/**
	 * Parse JSON output from EPUBCheck
	 */
	private parseJsonOutput(output: string): ValidationResult {
		try {
			const data = JSON.parse(output);

			const errors: ValidationIssue[] = [];
			const warnings: ValidationIssue[] = [];
			const info: ValidationIssue[] = [];

			// Parse messages
			if (data.messages && Array.isArray(data.messages)) {
				for (const msg of data.messages) {
					const issue: ValidationIssue = {
						severity: msg.severity?.toLowerCase() || 'info',
						message: msg.message || '',
						location: msg.locations?.[0] ? `${msg.locations[0].path}:${msg.locations[0].line || ''}` : undefined,
						type: msg.id || undefined,
					};

					switch (issue.severity) {
						case 'error':
						case 'fatal':
							errors.push(issue);
							break;
						case 'warning':
							warnings.push(issue);
							break;
						default:
							info.push(issue);
							break;
					}
				}
			}

			// Build summary
			const summary: ValidationSummary = {
				errorCount: errors.length,
				warningCount: warnings.length,
				infoCount: info.length,
				epubVersion: data.publication?.epubVersion || undefined,
				checkerVersion: data.checkerVersion || this.epubCheckVersion || undefined,
			};

			return {
				available: true,
				valid: errors.length === 0,
				errors,
				warnings,
				info,
				summary,
				rawOutput: output,
			};
		} catch (error) {
			// Fallback to text parsing
			return this.parseTextOutput(output);
		}
	}

	/**
	 * Parse text output from EPUBCheck (fallback)
	 */
	private parseTextOutput(output: string): ValidationResult {
		const errors: ValidationIssue[] = [];
		const warnings: ValidationIssue[] = [];
		const info: ValidationIssue[] = [];

		const lines = output.split('\n');

		for (const line of lines) {
			// Parse lines like: ERROR(RSC-005): file.xhtml(12,34): message text
			const errorMatch = line.match(/^ERROR(\([^)]+\))?:\s*([^:]+):?\s*(.+)$/i);
			if (errorMatch) {
				errors.push({
					severity: 'error',
					message: errorMatch[3] || errorMatch[2],
					location: errorMatch[2]?.includes('(') ? errorMatch[2] : undefined,
					type: errorMatch[1]?.replace(/[()]/g, '') || undefined,
				});
				continue;
			}

			// Parse warnings
			const warningMatch = line.match(/^WARNING(\([^)]+\))?:\s*([^:]+):?\s*(.+)$/i);
			if (warningMatch) {
				warnings.push({
					severity: 'warning',
					message: warningMatch[3] || warningMatch[2],
					location: warningMatch[2]?.includes('(') ? warningMatch[2] : undefined,
					type: warningMatch[1]?.replace(/[()]/g, '') || undefined,
				});
				continue;
			}

			// Parse info
			const infoMatch = line.match(/^INFO(\([^)]+\))?:\s*(.+)$/i);
			if (infoMatch) {
				info.push({
					severity: 'info',
					message: infoMatch[2],
					type: infoMatch[1]?.replace(/[()]/g, '') || undefined,
				});
			}
		}

		// Build summary from parsed issues
		const summary: ValidationSummary = {
			errorCount: errors.length,
			warningCount: warnings.length,
			infoCount: info.length,
			checkerVersion: this.epubCheckVersion || undefined,
		};

		return {
			available: true,
			valid: errors.length === 0,
			errors,
			warnings,
			info,
			summary,
			rawOutput: output,
		};
	}

	/**
	 * Get EPUBCheck version
	 */
	getEpubCheckVersion(): string | null {
		return this.epubCheckVersion;
	}

	/**
	 * Format validation result as human-readable text
	 */
	formatValidationResult(result: ValidationResult): string {
		if (!result.available) {
			return result.message || 'EPUBCheck not available';
		}

		const lines: string[] = [];

		// Header
		if (result.valid) {
			lines.push('✓ EPUB Validation Passed');
		} else {
			lines.push('✗ EPUB Validation Failed');
		}

		lines.push('');

		// Summary
		if (result.summary) {
			lines.push(`Errors: ${result.summary.errorCount}`);
			lines.push(`Warnings: ${result.summary.warningCount}`);
			if (result.summary.infoCount > 0) {
				lines.push(`Info: ${result.summary.infoCount}`);
			}
			if (result.summary.epubVersion) {
				lines.push(`EPUB Version: ${result.summary.epubVersion}`);
			}
			lines.push('');
		}

		// Errors
		if (result.errors && result.errors.length > 0) {
			lines.push('ERRORS:');
			for (const error of result.errors) {
				let line = `  • ${error.message}`;
				if (error.location) {
					line += ` (${error.location})`;
				}
				lines.push(line);
			}
			lines.push('');
		}

		// Warnings (limit to first 10)
		if (result.warnings && result.warnings.length > 0) {
			lines.push('WARNINGS:');
			const displayWarnings = result.warnings.slice(0, 10);
			for (const warning of displayWarnings) {
				let line = `  • ${warning.message}`;
				if (warning.location) {
					line += ` (${warning.location})`;
				}
				lines.push(line);
			}
			if (result.warnings.length > 10) {
				lines.push(`  ... and ${result.warnings.length - 10} more warnings`);
			}
		}

		return lines.join('\n');
	}
}
