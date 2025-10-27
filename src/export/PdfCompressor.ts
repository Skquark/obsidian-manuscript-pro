/**
 * PDF Compressor
 * Uses Ghostscript to compress PDF files at different quality levels
 */

import { Notice } from 'obsidian';
import { execFile } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import type LatexPandocConcealerPlugin from '../main';

const execFileAsync = promisify(execFile);

export type CompressionLevel = 'none' | 'screen' | 'ebook' | 'printer' | 'prepress';

export interface CompressionSettings {
	level: CompressionLevel;
	detectDuplicateImages: boolean;
	downsampleImages: boolean;
	embedFonts: boolean;
}

export interface CompressionResult {
	success: boolean;
	originalSize: number;
	compressedSize: number;
	reduction: number; // Percentage
	error?: string;
}

export class PdfCompressor {
	private gsVersion: string | null = null;

	constructor(private plugin: LatexPandocConcealerPlugin) {}

	/**
	 * Check if Ghostscript is available
	 */
	async checkGhostscriptAvailable(): Promise<boolean> {
		try {
			const gsPath = this.getGhostscriptPath();
			const { stdout } = await execFileAsync(gsPath, ['--version']);

			// Parse version from output
			const versionMatch = stdout.match(/(\d+\.\d+\.\d+)/);
			if (versionMatch) {
				this.gsVersion = versionMatch[1];
				return true;
			}

			return false;
		} catch (error) {
			return false;
		}
	}

	/**
	 * Get Ghostscript executable path
	 * Handles different OS conventions (gs, gswin64c, etc.)
	 */
	private getGhostscriptPath(): string {
		// Check for custom path in settings
		const customPath = this.plugin.settings.export?.ghostscriptPath;
		if (customPath) {
			const sanitized = customPath.trim();
			// Validate that path doesn't contain dangerous characters
			if (/[;&|`$()<>]/.test(sanitized)) {
				console.error('Invalid Ghostscript path detected:', customPath);
				new Notice('Invalid Ghostscript path configuration. Using system default.');
				return this.getDefaultGsPath();
			}
			return sanitized;
		}

		return this.getDefaultGsPath();
	}

	/**
	 * Get default Ghostscript path based on platform
	 */
	private getDefaultGsPath(): string {
		const platform = process.platform;

		if (platform === 'win32') {
			// Windows: Try gswin64c first, fallback to gswin32c
			return 'gswin64c';
		} else if (platform === 'darwin') {
			// macOS: Usually just 'gs'
			return 'gs';
		} else {
			// Linux: Usually 'gs'
			return 'gs';
		}
	}

	/**
	 * Compress a PDF file
	 */
	async compress(inputPdf: string, outputPdf: string, settings: CompressionSettings): Promise<CompressionResult> {
		// Check Ghostscript availability
		const gsAvailable = await this.checkGhostscriptAvailable();
		if (!gsAvailable) {
			return {
				success: false,
				originalSize: 0,
				compressedSize: 0,
				reduction: 0,
				error: 'Ghostscript not found. Please install Ghostscript to enable PDF compression.',
			};
		}

		// Skip compression if level is 'none'
		if (settings.level === 'none') {
			return {
				success: true,
				originalSize: 0,
				compressedSize: 0,
				reduction: 0,
			};
		}

		try {
			// Get original file size
			const originalStats = await fs.promises.stat(inputPdf);
			const originalSize = originalStats.size;

			// Build Ghostscript arguments
			const args = this.buildGhostscriptArgs(settings);
			args.push(`-sOutputFile=${outputPdf}`, inputPdf);

			// Execute Ghostscript
			const gsPath = this.getGhostscriptPath();
			await execFileAsync(gsPath, args, {
				maxBuffer: 10 * 1024 * 1024, // 10MB buffer
			});

			// Get compressed file size
			const compressedStats = await fs.promises.stat(outputPdf);
			const compressedSize = compressedStats.size;

			// Calculate reduction percentage
			const reduction = Math.round(((originalSize - compressedSize) / originalSize) * 100);

			if (this.plugin.settings.export?.verboseLogging) {
				console.log(
					`PDF Compression: ${this.formatBytes(originalSize)} → ${this.formatBytes(compressedSize)} (${reduction}% reduction)`,
				);
			}

			return {
				success: true,
				originalSize,
				compressedSize,
				reduction,
			};
		} catch (error: any) {
			return {
				success: false,
				originalSize: 0,
				compressedSize: 0,
				reduction: 0,
				error: error.message || 'Unknown error during PDF compression',
			};
		}
	}

	/**
	 * Build Ghostscript command arguments
	 */
	private buildGhostscriptArgs(settings: CompressionSettings): string[] {
		const args = [
			'-sDEVICE=pdfwrite',
			'-dCompatibilityLevel=1.5',
			'-dNOPAUSE',
			'-dQUIET',
			'-dBATCH',
		];

		// Compression level
		if (settings.level !== 'none') {
			args.push(`-dPDFSETTINGS=/${settings.level}`);
		}

		// Duplicate image detection
		if (settings.detectDuplicateImages) {
			args.push('-dDetectDuplicateImages=true');
		}

		// Image downsampling
		if (settings.downsampleImages) {
			args.push('-dColorImageDownsampleType=/Bicubic');
			args.push('-dGrayImageDownsampleType=/Bicubic');
			args.push('-dMonoImageDownsampleType=/Bicubic');
		}

		// Font embedding
		if (settings.embedFonts) {
			args.push('-dEmbedAllFonts=true');
			args.push('-dSubsetFonts=true');
		}

		return args;
	}

	/**
	 * Format bytes to human-readable string
	 */
	private formatBytes(bytes: number): string {
		if (bytes === 0) return '0 B';

		const k = 1024;
		const sizes = ['B', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));

		return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
	}

	/**
	 * Get compression level description
	 */
	static getCompressionLevelDescription(level: CompressionLevel): string {
		const descriptions: Record<CompressionLevel, string> = {
			none: 'No compression (fastest, largest file)',
			screen: 'Screen preview (~72 DPI, smallest file)',
			ebook: 'E-book distribution (~150 DPI, good for web/email)',
			printer: 'Print-on-demand (~300 DPI, high quality)',
			prepress: 'Offset printing (maximum quality, large file)',
		};

		return descriptions[level];
	}

	/**
	 * Get recommended compression level for use case
	 */
	static getRecommendedLevel(useCase: 'preview' | 'distribution' | 'pod' | 'offset'): CompressionLevel {
		const recommendations = {
			preview: 'screen' as CompressionLevel,
			distribution: 'ebook' as CompressionLevel,
			pod: 'printer' as CompressionLevel,
			offset: 'prepress' as CompressionLevel,
		};

		return recommendations[useCase];
	}

	/**
	 * Get Ghostscript version
	 */
	getGhostscriptVersion(): string | null {
		return this.gsVersion;
	}
}
