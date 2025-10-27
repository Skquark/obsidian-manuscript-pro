import { Command, Notice } from 'obsidian';
import type ManuscriptProPlugin from '../main';
import { ProFeature, FeatureInfo } from './types';

/**
 * Feature gating system for Pro features
 */
export class FeatureGate {
	private plugin: ManuscriptProPlugin;

	constructor(plugin: ManuscriptProPlugin) {
		this.plugin = plugin;
	}

	/**
	 * Check if user has access to a Pro feature (simple boolean)
	 */
	hasProFeature(feature: ProFeature): boolean {
		return this.plugin.licenseManager.hasProLicense() && this.plugin.licenseManager.isLicenseValid();
	}

	/**
	 * Get Pro indicator string - shows ⭐ for free users, empty for Pro users
	 * Use this for menu items, command names, etc.
	 */
	getProIndicator(): string {
		return this.plugin.licenseManager.hasProLicense() && this.plugin.licenseManager.isLicenseValid() ? '' : ' ⭐';
	}

	/**
	 * Check feature access and show upgrade prompt if needed
	 * @returns true if user has access, false otherwise
	 */
	checkFeatureAccess(feature: ProFeature, context?: string): boolean {
		if (this.hasProFeature(feature)) {
			return true;
		}

		// Show upgrade modal
		this.showUpgradePrompt(feature, context);
		return false;
	}

	/**
	 * Show upgrade prompt for a specific feature
	 */
	private showUpgradePrompt(feature: ProFeature, context?: string): void {
		// Import dynamically to avoid circular dependency
		import('./modals/UpgradeModal').then(({ UpgradeModal }) => {
			new UpgradeModal(this.plugin.app, this.plugin, feature, context).open();
		});
	}

	/**
	 * Register command with Pro gating
	 */
	registerProCommand(command: Command, feature: ProFeature): void {
		const originalCallback = command.callback;

		// Wrap callback with feature gate
		command.callback = () => {
			if (this.checkFeatureAccess(feature, command.name)) {
				originalCallback?.();
			}
		};

		// Add Pro badge to command name (only for free users)
		const proIndicator = this.getProIndicator();
		if (proIndicator && !command.name.includes(proIndicator.trim())) {
			command.name = `${command.name}${proIndicator}`;
		}

		this.plugin.addCommand(command);
	}

	/**
	 * Get feature information for display
	 */
	getFeatureInfo(feature: ProFeature): FeatureInfo {
		const featureMap: Record<ProFeature, FeatureInfo> = {
			[ProFeature.CHECKLIST_PANEL]: {
				feature: ProFeature.CHECKLIST_PANEL,
				name: 'Pre-Publication Checklist',
				icon: '✅',
				description:
					'Interactive checklist to ensure your manuscript is ready for submission with automated validation and progress tracking.',
				benefits: [
					'6 organized categories (Manuscript, Citations, Format, etc.)',
					'Automatic citation validation',
					'Progress tracking with visual indicators',
					'Notes section with auto-save',
					'Export checklist reports',
					'Type-specific checklists',
				],
			},
			[ProFeature.PROGRESS_PANEL]: {
				feature: ProFeature.PROGRESS_PANEL,
				name: 'Progress Statistics',
				icon: '📊',
				description:
					'Track your writing progress with goals, streaks, detailed statistics, and session history across multiple time ranges.',
				benefits: [
					'Real-time statistics with auto-refresh',
					'Writing goals with progress bars',
					'Streak tracking (current and longest)',
					'Session history with achievements',
					'Multiple time ranges (Today/Week/Month/All)',
					'Export statistics to CSV',
				],
			},
			[ProFeature.RESEARCH_FACT_MODAL]: {
				feature: ProFeature.RESEARCH_FACT_MODAL,
				name: 'Research Fact Entry',
				icon: '📝',
				description:
					'Structured entry form for organizing research facts, terminology, entities, and source information in your Research Bible.',
				benefits: [
					'5-field structured form',
					'Category organization',
					'Tag support for cross-referencing',
					'Source tracking',
					'Save & New for batch entry',
					'Keyboard shortcuts',
				],
			},
			[ProFeature.RESEARCH_SEARCH_MODAL]: {
				feature: ProFeature.RESEARCH_SEARCH_MODAL,
				name: 'Research Bible Search',
				icon: '🔍',
				description:
					'Advanced search interface for your Research Bible with live filtering, category browsing, and quick insertion.',
				benefits: [
					'Live search across all research content',
					'8 category filters',
					'Split view (results + details)',
					'Insert directly into document',
					'Copy term or definition',
					'Searches facts, terminology, acronyms, and entities',
				],
			},
			[ProFeature.CITATION_VALIDATION]: {
				feature: ProFeature.CITATION_VALIDATION,
				name: 'Citation Validation',
				icon: '📚',
				description:
					'Comprehensive citation validation with three methods to ensure bibliography accuracy and completeness.',
				benefits: [
					'Validate citations exist in bibliography',
					'Detect unused bibliography entries',
					'Find orphaned citations',
					'Multi-format support (Pandoc, LaTeX, Markdown)',
					'Console warnings with details',
					'Automatic checklist integration',
				],
			},
			[ProFeature.ADVANCED_STATS]: {
				feature: ProFeature.ADVANCED_STATS,
				name: 'Advanced Statistics',
				icon: '📈',
				description:
					'Detailed manuscript statistics including inline equations, reading time, and comprehensive structure analysis.',
				benefits: [
					'Inline equation counting',
					'Display and numbered equations',
					'Figure and table counts',
					'Heading depth analysis',
					'Index entry tracking',
					'Reading time estimates',
				],
			},
			[ProFeature.PROGRESS_TRACKING]: {
				feature: ProFeature.PROGRESS_TRACKING,
				name: 'Progress Tracking',
				icon: '🎯',
				description: 'Set writing goals, track sessions, monitor streaks, and view detailed progress over time.',
				benefits: [
					'Custom writing goals',
					'Automatic session tracking',
					'Streak calculation',
					'Daily/weekly/monthly views',
					'Achievement badges',
					'Historical data analysis',
				],
			},
			[ProFeature.MANUSCRIPT_EDITOR]: {
				feature: ProFeature.MANUSCRIPT_EDITOR,
				name: 'Manuscript Editor',
				icon: '📄',
				description:
					'Full-featured manuscript editor with validation, edition management, and unsaved changes protection.',
				benefits: [
					'Complete metadata management',
					'Edition tracking and comparison',
					'Validation before save',
					'Unsaved changes confirmation',
					'Author and contributor management',
					'ISBN and publisher details',
				],
			},
			[ProFeature.ADVANCED_EXPORT]: {
				feature: ProFeature.ADVANCED_EXPORT,
				name: 'Advanced Export',
				icon: '💾',
				description: 'Publisher-ready export with custom pipelines, presets, and batch processing capabilities.',
				benefits: [
					'20+ publisher-specific presets',
					'Custom export pipelines',
					'Batch export multiple formats',
					'Auto-formatting rules',
					'Template-based generation',
					'Professional output quality',
				],
			},
			[ProFeature.PREMIUM_TEMPLATES]: {
				feature: ProFeature.PREMIUM_TEMPLATES,
				name: 'Premium Templates',
				icon: '📋',
				description: 'Access 15+ publisher-specific templates with advanced variable support and customization.',
				benefits: [
					'15+ professional templates',
					'Publisher-specific formatting',
					'Advanced variable system',
					'Custom template creation',
					'Template marketplace access (future)',
					'Regular template updates',
				],
			},
			[ProFeature.PUBLISHER_PRESETS]: {
				feature: ProFeature.PUBLISHER_PRESETS,
				name: 'Publisher Presets',
				icon: '🏢',
				description: 'Export presets configured for specific publishers and academic journals.',
				benefits: [
					'Major publisher formats (Springer, Elsevier, etc.)',
					'Academic journal styles',
					'One-click export',
					'Formatting rules included',
					'Citation style matching',
					'Regular preset updates',
				],
			},

			// Additional features with basic info
			[ProFeature.RESEARCH_PANEL]: this.createBasicFeatureInfo(
				ProFeature.RESEARCH_PANEL,
				'Research Bible Panel',
				'🗂️',
				'Dedicated panel for browsing and managing your Research Bible.',
			),
			[ProFeature.RESEARCH_BULK_OPERATIONS]: this.createBasicFeatureInfo(
				ProFeature.RESEARCH_BULK_OPERATIONS,
				'Research Bulk Operations',
				'⚡',
				'Bulk import, export, and management of research entries.',
			),
			[ProFeature.CUSTOM_CITATION_STYLES]: this.createBasicFeatureInfo(
				ProFeature.CUSTOM_CITATION_STYLES,
				'Custom Citation Styles',
				'🎨',
				'Create and save unlimited custom citation styles.',
			),
			[ProFeature.DUPLICATE_DETECTION]: this.createBasicFeatureInfo(
				ProFeature.DUPLICATE_DETECTION,
				'Duplicate Detection',
				'🔎',
				'Automatically detect duplicate citations and entries.',
			),
			[ProFeature.PUBLISHER_ADDRESS]: this.createBasicFeatureInfo(
				ProFeature.PUBLISHER_ADDRESS,
				'Publisher Addresses',
				'📍',
				'Include publisher location in citations (Chicago style).',
			),
			[ProFeature.INLINE_EQUATIONS]: this.createBasicFeatureInfo(
				ProFeature.INLINE_EQUATIONS,
				'Inline Equation Counting',
				'➕',
				'Count inline equations in manuscript statistics.',
			),
			[ProFeature.STATS_EXPORT]: this.createBasicFeatureInfo(
				ProFeature.STATS_EXPORT,
				'Statistics Export',
				'📤',
				'Export statistics and progress data to CSV.',
			),
			[ProFeature.MANUSCRIPT_VALIDATION]: this.createBasicFeatureInfo(
				ProFeature.MANUSCRIPT_VALIDATION,
				'Manuscript Validation',
				'✓',
				'Validate manuscript metadata before export.',
			),
			[ProFeature.EDITION_COMPARISON]: this.createBasicFeatureInfo(
				ProFeature.EDITION_COMPARISON,
				'Edition Comparison',
				'🔄',
				'Compare different editions of your manuscript.',
			),
			[ProFeature.BATCH_EXPORT]: this.createBasicFeatureInfo(
				ProFeature.BATCH_EXPORT,
				'Batch Export',
				'📦',
				'Export multiple formats simultaneously.',
			),
			[ProFeature.CUSTOM_VARIABLES]: this.createBasicFeatureInfo(
				ProFeature.CUSTOM_VARIABLES,
				'Custom Template Variables',
				'🔧',
				'Advanced custom variables in templates.',
			),
		};

		return featureMap[feature];
	}

	/**
	 * Helper to create basic feature info
	 */
	private createBasicFeatureInfo(feature: ProFeature, name: string, icon: string, description: string): FeatureInfo {
		return {
			feature,
			name,
			icon,
			description,
			benefits: [
				'Professional-grade functionality',
				'Time-saving automation',
				'Priority support included',
				'All future updates',
			],
		};
	}

	/**
	 * Check if any Pro features are being used (for status bar)
	 */
	isUsingProFeatures(): boolean {
		return this.plugin.licenseManager.hasProLicense();
	}

	/**
	 * Get user-friendly license status
	 */
	getLicenseStatusText(): string {
		return this.plugin.licenseManager.getStatusMessage();
	}
}
