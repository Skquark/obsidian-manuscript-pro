import { createHash } from 'crypto';
import type ManuscriptProPlugin from '../main';
import { License } from './types';

/**
 * Handles encrypted storage and retrieval of license data
 */
export class LicenseStorage {
	private plugin: ManuscriptProPlugin;

	constructor(plugin: ManuscriptProPlugin) {
		this.plugin = plugin;
	}

	/**
	 * Load license from plugin settings
	 */
	async load(): Promise<License | null> {
		const stored = this.plugin.settings._lic;
		if (!stored) {
			return null;
		}

		try {
			const decrypted = this.decrypt(stored);
			const license: License = JSON.parse(decrypted);

			// Validate instance ID matches
			const currentInstanceId = await this.generateInstanceId();
			if (license.instanceId !== currentInstanceId) {
				console.warn('License instance ID mismatch - vault may have moved');
				// Don't invalidate immediately, but flag for revalidation
			}

			return license;
		} catch (error) {
			console.error('Failed to load license:', error);
			return null;
		}
	}

	/**
	 * Save license to plugin settings
	 */
	async save(license: License): Promise<void> {
		try {
			const json = JSON.stringify(license);
			const encrypted = this.encrypt(json);

			this.plugin.settings._lic = encrypted;
			this.plugin.settings._inst = license.instanceId;
			await this.plugin.saveSettings();
		} catch (error) {
			console.error('Failed to save license:', error);
			throw error;
		}
	}

	/**
	 * Clear license from storage
	 */
	async clear(): Promise<void> {
		delete this.plugin.settings._lic;
		delete this.plugin.settings._inst;
		await this.plugin.saveSettings();
	}

	/**
	 * Generate unique instance ID for this vault
	 */
	async generateInstanceId(): Promise<string> {
		// Check if we already have an instance ID stored
		if (this.plugin.settings._inst) {
			return this.plugin.settings._inst;
		}

		// Generate new instance ID based on vault path + timestamp
		const vaultName = this.plugin.app.vault.getName();
		const timestamp = Date.now();
		const data = `${vaultName}-${timestamp}`;

		const hash = createHash('sha256').update(data).digest('hex');
		const instanceId = hash.substring(0, 16);

		// Store for future use
		this.plugin.settings._inst = instanceId;
		await this.plugin.saveSettings();

		return instanceId;
	}

	/**
	 * Simple XOR encryption for license data
	 * Note: This is obfuscation, not cryptographic security
	 */
	private encrypt(data: string): string {
		const key = this.getEncryptionKey();
		const buffer = Buffer.from(data);
		const encrypted = new Uint8Array(buffer.length);
		for (let i = 0; i < buffer.length; i++) {
			encrypted[i] = buffer[i] ^ key.charCodeAt(i % key.length);
		}
		return Buffer.from(encrypted).toString('base64');
	}

	/**
	 * Simple XOR decryption for license data
	 */
	private decrypt(data: string): string {
		const key = this.getEncryptionKey();
		const buffer = Buffer.from(data, 'base64');
		const decrypted = new Uint8Array(buffer.length);
		for (let i = 0; i < buffer.length; i++) {
			decrypted[i] = buffer[i] ^ key.charCodeAt(i % key.length);
		}
		return Buffer.from(decrypted).toString('utf8');
	}

	/**
	 * Get encryption key (derived from vault name)
	 */
	private getEncryptionKey(): string {
		const vaultName = this.plugin.app.vault.getName();
		// Use vault name + static salt as key
		return createHash('sha256')
			.update(vaultName + 'manuscript-pro-v1')
			.digest('hex')
			.substring(0, 32);
	}
}
