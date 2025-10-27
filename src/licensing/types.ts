/**
 * License and feature gating type definitions
 */

export enum LicenseTier {
	FREE = 'free',
	PRO = 'pro',
}

export enum LicenseStatus {
	ACTIVE = 'active',
	EXPIRED = 'expired',
	INVALID = 'invalid',
	GRACE_PERIOD = 'grace_period',
}

export interface License {
	/** License key from Aeionix */
	key: string;

	/** User email associated with purchase */
	email: string;

	/** License tier */
	tier: LicenseTier;

	/** Timestamp when license was activated */
	activatedAt: number;

	/** Expiration timestamp (null for lifetime licenses) */
	expiresAt: number | null;

	/** Current license status */
	status: LicenseStatus;

	/** Unique instance ID (vault-specific) */
	instanceId: string;

	/** Whether license has been validated online */
	validated: boolean;

	/** Last online validation timestamp */
	lastChecked: number;

	/** Grace period end timestamp (if in grace period) */
	gracePeriodEnds?: number;
}

export interface LicenseValidationResponse {
	/** Whether license is valid */
	valid: boolean;

	/** License tier */
	tier: LicenseTier;

	/** Expiration timestamp (null for lifetime) */
	expiresAt: number | null;

	/** Maximum allowed instances */
	maxInstances: number;

	/** Currently active instances */
	activeInstances: number;

	/** Error message if validation failed */
	error?: string;
}

export interface ActivationResult {
	/** Whether activation succeeded */
	success: boolean;

	/** Error message if activation failed */
	error?: string;

	/** License data if successful */
	license?: License;
}

export enum ProFeature {
	// UI Panels
	CHECKLIST_PANEL = 'checklist_panel',
	PROGRESS_PANEL = 'progress_panel',
	RESEARCH_PANEL = 'research_panel',

	// Research Bible
	RESEARCH_FACT_MODAL = 'research_fact_modal',
	RESEARCH_SEARCH_MODAL = 'research_search_modal',
	RESEARCH_BULK_OPERATIONS = 'research_bulk_operations',

	// Citations
	CITATION_VALIDATION = 'citation_validation',
	CUSTOM_CITATION_STYLES = 'custom_citation_styles',
	DUPLICATE_DETECTION = 'duplicate_detection',
	PUBLISHER_ADDRESS = 'publisher_address',

	// Statistics
	ADVANCED_STATS = 'advanced_stats',
	PROGRESS_TRACKING = 'progress_tracking',
	INLINE_EQUATIONS = 'inline_equations',
	STATS_EXPORT = 'stats_export',

	// Manuscript
	MANUSCRIPT_EDITOR = 'manuscript_editor',
	MANUSCRIPT_VALIDATION = 'manuscript_validation',
	EDITION_COMPARISON = 'edition_comparison',

	// Export
	ADVANCED_EXPORT = 'advanced_export',
	PUBLISHER_PRESETS = 'publisher_presets',
	BATCH_EXPORT = 'batch_export',

	// Templates
	PREMIUM_TEMPLATES = 'premium_templates',
	CUSTOM_VARIABLES = 'custom_variables',
}

export interface FeatureInfo {
	/** Feature identifier */
	feature: ProFeature;

	/** Display name */
	name: string;

	/** Short description */
	description: string;

	/** Benefits list */
	benefits: string[];

	/** Icon emoji */
	icon: string;
}

export interface AeionixConfig {
	/** Aeionix API endpoint */
	apiUrl: string;

	/** WordPress site URL */
	siteUrl: string;

	/** Product ID in Aeionix */
	productId: string;
}

/**
 * Storage interface for encrypted license data
 */
export interface LicenseStorage {
	/** Obfuscated license data */
	_lic?: string;

	/** Instance ID */
	_inst?: string;
}
