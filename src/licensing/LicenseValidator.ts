import type ManuscriptProPlugin from '../main';
import {
	LicenseValidationResponse,
	LicenseTier,
	ActivationResult,
} from './types';

/**
 * Validates licenses with Aeionix backend
 * Currently stubbed for development - will integrate with real API later
 */
export class LicenseValidator {
	private plugin: ManuscriptProPlugin;

	// TODO: Replace with actual Aeionix endpoint
	private static readonly AEIONIX_API_URL = 'https://your-site.com/wp-json/aeionix/v1';

	constructor(plugin: ManuscriptProPlugin) {
		this.plugin = plugin;
	}

	/**
	 * Validate license key with Aeionix backend
	 * STUB: Currently validates format only, will connect to Aeionix later
	 */
	async validateLicense(
		key: string,
		email: string
	): Promise<LicenseValidationResponse> {
		// For development: Accept any valid format key
		if (this.isValidFormat(key)) {
			return {
				valid: true,
				tier: LicenseTier.PRO,
				expiresAt: null, // Lifetime license
				maxInstances: 2,
				activeInstances: 0,
			};
		}

		return {
			valid: false,
			tier: LicenseTier.FREE,
			expiresAt: null,
			maxInstances: 0,
			activeInstances: 0,
			error: 'Invalid license key format',
		};

		/* TODO: Implement real Aeionix validation
		try {
			const response = await fetch(
				`${LicenseValidator.AEIONIX_API_URL}/validate`,
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({ key, email }),
				}
			);

			if (!response.ok) {
				throw new Error(`API error: ${response.status}`);
			}

			const data = await response.json();
			return {
				valid: data.valid,
				tier: data.tier === 'pro' ? LicenseTier.PRO : LicenseTier.FREE,
				expiresAt: data.expires_at ? Number(data.expires_at) : null,
				maxInstances: data.max_instances || 2,
				activeInstances: data.active_instances || 0,
				error: data.error,
			};
		} catch (error) {
			console.error('License validation error:', error);
			return {
				valid: false,
				tier: LicenseTier.FREE,
				expiresAt: null,
				maxInstances: 0,
				activeInstances: 0,
				error: error instanceof Error ? error.message : 'Validation failed',
			};
		}
		*/
	}

	/**
	 * Activate instance with Aeionix backend
	 * STUB: Currently always succeeds, will connect to Aeionix later
	 */
	async activateInstance(
		key: string,
		email: string,
		instanceId: string
	): Promise<ActivationResult> {
		// For development: Always succeed
		return {
			success: true,
		};

		/* TODO: Implement real Aeionix activation
		try {
			const vaultName = this.plugin.app.vault.getName();
			const platform = process.platform;

			const response = await fetch(
				`${LicenseValidator.AEIONIX_API_URL}/activate`,
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						key,
						email,
						instance_id: instanceId,
						metadata: {
							vault_name: vaultName,
							platform: platform,
						},
					}),
				}
			);

			if (!response.ok) {
				throw new Error(`API error: ${response.status}`);
			}

			const data = await response.json();
			return {
				success: data.success,
				error: data.error,
			};
		} catch (error) {
			console.error('Instance activation error:', error);
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Activation failed',
			};
		}
		*/
	}

	/**
	 * Deactivate instance with Aeionix backend
	 * STUB: Currently always succeeds, will connect to Aeionix later
	 */
	async deactivateInstance(
		key: string,
		instanceId: string
	): Promise<{ success: boolean }> {
		// For development: Always succeed
		return { success: true };

		/* TODO: Implement real Aeionix deactivation
		try {
			const response = await fetch(
				`${LicenseValidator.AEIONIX_API_URL}/deactivate`,
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						key,
						instance_id: instanceId,
					}),
				}
			);

			if (!response.ok) {
				throw new Error(`API error: ${response.status}`);
			}

			const data = await response.json();
			return { success: data.success };
		} catch (error) {
			console.error('Instance deactivation error:', error);
			return { success: false };
		}
		*/
	}

	/**
	 * Check instance status with Aeionix backend
	 * STUB: Currently always returns active, will connect to Aeionix later
	 */
	async checkInstance(
		key: string,
		instanceId: string
	): Promise<{ active: boolean; lastSeen: number }> {
		// For development: Always return active
		return {
			active: true,
			lastSeen: Date.now(),
		};

		/* TODO: Implement real Aeionix status check
		try {
			const response = await fetch(
				`${LicenseValidator.AEIONIX_API_URL}/check-instance`,
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						key,
						instance_id: instanceId,
					}),
				}
			);

			if (!response.ok) {
				throw new Error(`API error: ${response.status}`);
			}

			const data = await response.json();
			return {
				active: data.active,
				lastSeen: data.last_seen ? Number(data.last_seen) : Date.now(),
			};
		} catch (error) {
			console.error('Instance check error:', error);
			throw error; // Propagate error to trigger grace period
		}
		*/
	}

	/**
	 * Validate license key format
	 */
	private isValidFormat(key: string): boolean {
		// Expected format: MANU-XXXX-XXXX-XXXX
		const pattern = /^MANU-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
		return pattern.test(key);
	}
}
