import { Notice } from 'obsidian';
import type ManuscriptProPlugin from '../main';
import {
	License,
	LicenseTier,
	LicenseStatus,
	ActivationResult,
} from './types';
import { LicenseValidator } from './LicenseValidator';
import { LicenseStorage } from './LicenseStorage';

/**
 * Manages license state and validation
 */
export class LicenseManager {
	private plugin: ManuscriptProPlugin;
	private validator: LicenseValidator;
	private storage: LicenseStorage;
	private license: License | null = null;

	// Validation intervals (in milliseconds)
	private static readonly VALIDATION_INTERVAL = 30 * 24 * 60 * 60 * 1000; // 30 days
	private static readonly GRACE_PERIOD = 7 * 24 * 60 * 60 * 1000; // 7 days

	constructor(plugin: ManuscriptProPlugin) {
		this.plugin = plugin;
		this.validator = new LicenseValidator(plugin);
		this.storage = new LicenseStorage(plugin);
	}

	/**
	 * Load license from storage on plugin startup
	 */
	async load(): Promise<void> {
		this.license = await this.storage.load();

		// Check if validation is needed
		if (this.license && this.shouldValidate()) {
			await this.validateOnline();
		}
	}

	/**
	 * Get current license
	 */
	getLicense(): License | null {
		return this.license;
	}

	/**
	 * Check if user has Pro license
	 */
	hasProLicense(): boolean {
		return this.license?.tier === LicenseTier.PRO;
	}

	/**
	 * Check if license is valid and active
	 */
	isLicenseValid(): boolean {
		if (!this.license) {
			return false;
		}

		const now = Date.now();

		// Check expiration (for future subscription model)
		if (this.license.expiresAt && this.license.expiresAt < now) {
			// Check grace period
			if (this.license.gracePeriodEnds && this.license.gracePeriodEnds > now) {
				return true; // In grace period
			}
			return false; // Expired
		}

		// Check status
		if (this.license.status === LicenseStatus.INVALID) {
			return false;
		}

		// Active or in grace period
		return (
			this.license.status === LicenseStatus.ACTIVE ||
			this.license.status === LicenseStatus.GRACE_PERIOD
		);
	}

	/**
	 * Activate license with key and email
	 */
	async activate(email: string, key: string): Promise<ActivationResult> {
		try {
			// Validate format
			if (!this.isValidKeyFormat(key)) {
				return {
					success: false,
					error: 'Invalid license key format',
				};
			}

			// Generate instance ID
			const instanceId = await this.storage.generateInstanceId();

			// Validate with Aeionix
			const validation = await this.validator.validateLicense(key, email);

			if (!validation.valid) {
				return {
					success: false,
					error: validation.error || 'License validation failed',
				};
			}

			// Activate instance with Aeionix
			const activation = await this.validator.activateInstance(
				key,
				email,
				instanceId
			);

			if (!activation.success) {
				return {
					success: false,
					error: activation.error || 'Instance activation failed',
				};
			}

			// Create license object
			const license: License = {
				key,
				email,
				tier: validation.tier,
				activatedAt: Date.now(),
				expiresAt: validation.expiresAt,
				status: LicenseStatus.ACTIVE,
				instanceId,
				validated: true,
				lastChecked: Date.now(),
			};

			// Save license
			await this.storage.save(license);
			this.license = license;

			// Notify success
			new Notice('✅ ManuScript Pro activated successfully!');

			// Trigger license activation event
			this.plugin.app.workspace.trigger('manuscript:license-activated');

			return {
				success: true,
				license,
			};
		} catch (error) {
			console.error('License activation error:', error);
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
			};
		}
	}

	/**
	 * Deactivate current license
	 */
	async deactivate(): Promise<void> {
		if (!this.license) {
			return;
		}

		try {
			// Deactivate instance with Aeionix
			await this.validator.deactivateInstance(
				this.license.key,
				this.license.instanceId
			);

			// Clear local storage
			await this.storage.clear();
			this.license = null;

			new Notice('License deactivated');

			// Trigger deactivation event
			this.plugin.app.workspace.trigger('manuscript:license-deactivated');
		} catch (error) {
			console.error('License deactivation error:', error);
			new Notice('⚠ Error deactivating license');
		}
	}

	/**
	 * Validate license online
	 */
	async validateOnline(): Promise<boolean> {
		if (!this.license) {
			return false;
		}

		try {
			// Check instance status with Aeionix
			const status = await this.validator.checkInstance(
				this.license.key,
				this.license.instanceId
			);

			if (status.active) {
				// Update license status
				this.license.status = LicenseStatus.ACTIVE;
				this.license.validated = true;
				this.license.lastChecked = Date.now();

				// Clear grace period if it was set
				delete this.license.gracePeriodEnds;

				await this.storage.save(this.license);
				return true;
			} else {
				// License no longer active
				this.license.status = LicenseStatus.INVALID;
				await this.storage.save(this.license);
				new Notice('⚠ License is no longer valid');
				return false;
			}
		} catch (error) {
			console.error('Online validation error:', error);

			// Enter grace period if not already in one
			if (!this.license.gracePeriodEnds) {
				this.license.gracePeriodEnds =
					Date.now() + LicenseManager.GRACE_PERIOD;
				this.license.status = LicenseStatus.GRACE_PERIOD;
				await this.storage.save(this.license);

				new Notice(
					'⚠ Could not validate license online. Grace period: 7 days'
				);
			}

			return false;
		}
	}

	/**
	 * Check if license needs online validation
	 */
	private shouldValidate(): boolean {
		if (!this.license) {
			return false;
		}

		// Always validate if never validated
		if (!this.license.validated) {
			return true;
		}

		// Check if validation interval has passed
		const timeSinceCheck = Date.now() - this.license.lastChecked;
		if (timeSinceCheck > LicenseManager.VALIDATION_INTERVAL) {
			return true;
		}

		// Check if in grace period and grace period expired
		if (this.license.gracePeriodEnds) {
			if (Date.now() > this.license.gracePeriodEnds) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Validate license key format
	 */
	private isValidKeyFormat(key: string): boolean {
		// Expected format: MANU-XXXX-XXXX-XXXX
		const pattern = /^MANU-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
		return pattern.test(key);
	}

	/**
	 * Get license status message
	 */
	getStatusMessage(): string {
		if (!this.license) {
			return 'ManuScript Free';
		}

		if (this.license.tier === LicenseTier.PRO) {
			switch (this.license.status) {
				case LicenseStatus.ACTIVE:
					return 'ManuScript Pro (Active)';
				case LicenseStatus.GRACE_PERIOD:
					const daysLeft = Math.ceil(
						((this.license.gracePeriodEnds || 0) - Date.now()) /
							(24 * 60 * 60 * 1000)
					);
					return `ManuScript Pro (Grace Period: ${daysLeft} days)`;
				case LicenseStatus.EXPIRED:
					return 'ManuScript Pro (Expired)';
				case LicenseStatus.INVALID:
					return 'ManuScript Pro (Invalid)';
			}
		}

		return 'ManuScript Free';
	}

	/**
	 * Check if feature requires validation warning
	 */
	shouldShowValidationWarning(): boolean {
		if (!this.license || !this.license.gracePeriodEnds) {
			return false;
		}

		// Show warning if in grace period
		return this.license.status === LicenseStatus.GRACE_PERIOD;
	}
}
