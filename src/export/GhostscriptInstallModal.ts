/**
 * Ghostscript Installation Modal
 * Provides platform-specific installation instructions for Ghostscript
 */

import { App, Modal } from 'obsidian';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

export class GhostscriptInstallModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass('manuscript-ghostscript-install-modal');

		// Title
		contentEl.createEl('h2', { text: 'Ghostscript Not Found' });

		// Description
		const desc = contentEl.createDiv({ cls: 'manuscript-install-description' });
		desc.createEl('p', {
			text: 'PDF compression requires Ghostscript, a powerful PDF processing tool. Install Ghostscript to enable compression features.',
		});

		// Platform-specific instructions
		const platform = process.platform;
		if (platform === 'win32') {
			this.renderWindowsInstructions(contentEl);
		} else if (platform === 'darwin') {
			this.renderMacOSInstructions(contentEl);
		} else {
			this.renderLinuxInstructions(contentEl);
		}

		// Important note about restart
		const noteBox = contentEl.createDiv({ cls: 'manuscript-install-note' });
		noteBox.createEl('strong', { text: '⚠️ Important: ' });
		noteBox.createSpan({ text: 'After installing Ghostscript, you must ' });
		noteBox.createEl('strong', { text: 'restart Obsidian (Ctrl+R or Cmd+R)' });
		noteBox.createSpan({
			text: ' for the changes to take effect. Windows users may need to restart their computer.',
		});

		// Check installation button
		const buttonContainer = contentEl.createDiv({ cls: 'manuscript-install-buttons' });
		const checkButton = buttonContainer.createEl('button', {
			text: 'Check if Ghostscript is Installed',
			cls: 'mod-cta',
		});
		checkButton.addEventListener('click', async () => {
			await this.checkGhostscriptInstalled();
		});

		const closeButton = buttonContainer.createEl('button', { text: 'Close' });
		closeButton.addEventListener('click', () => {
			this.close();
		});
	}

	private renderWindowsInstructions(container: HTMLElement): void {
		container.createEl('h3', { text: 'Installation Options for Windows' });

		// Option 1: Direct Download
		const option1 = container.createDiv({ cls: 'manuscript-install-option' });
		option1.createEl('h4', { text: 'Option 1: Direct Download (Recommended)' });
		option1.createEl('p', { text: '1. Download Ghostscript for Windows:' });
		const downloadLink = option1.createEl('a', {
			text: 'Download Ghostscript for Windows',
			href: 'https://ghostscript.com/releases/gsdnld.html',
		});
		downloadLink.style.display = 'block';
		downloadLink.style.marginBottom = '0.5rem';

		option1.createEl('p', { text: '2. Download the GPL Release (e.g., gs10.03.1 for Windows 64-bit)' });
		option1.createEl('p', { text: '3. Run the installer and follow the prompts' });
		option1.createEl('p', { text: '4. Restart Obsidian after installation' });

		// Option 2: Winget
		const option2 = container.createDiv({ cls: 'manuscript-install-option' });
		option2.createEl('h4', { text: 'Option 2: Windows Package Manager (winget)' });
		option2.createEl('p', { text: 'Open PowerShell or Command Prompt and run:' });

		const codeBlock = option2.createEl('pre');
		codeBlock.style.background = 'var(--background-primary-alt)';
		codeBlock.style.padding = '1rem';
		codeBlock.style.borderRadius = '6px';
		codeBlock.style.overflowX = 'auto';
		codeBlock.createEl('code', {
			text: 'winget install --id Artifex.Ghostscript',
		});

		// Option 3: Chocolatey
		const option3 = container.createDiv({ cls: 'manuscript-install-option' });
		option3.createEl('h4', { text: 'Option 3: Chocolatey Package Manager' });
		option3.createEl('p', { text: 'If you have Chocolatey installed, run:' });

		const chocoCode = option3.createEl('pre');
		chocoCode.style.background = 'var(--background-primary-alt)';
		chocoCode.style.padding = '1rem';
		chocoCode.style.borderRadius = '6px';
		chocoCode.style.overflowX = 'auto';
		chocoCode.createEl('code', {
			text: 'choco install ghostscript',
		});
	}

	private renderMacOSInstructions(container: HTMLElement): void {
		container.createEl('h3', { text: 'Installation Options for macOS' });

		// Option 1: Homebrew
		const option1 = container.createDiv({ cls: 'manuscript-install-option' });
		option1.createEl('h4', { text: 'Option 1: Homebrew (Recommended)' });
		option1.createEl('p', { text: 'Open Terminal and run:' });

		const codeBlock = option1.createEl('pre');
		codeBlock.style.background = 'var(--background-primary-alt)';
		codeBlock.style.padding = '1rem';
		codeBlock.style.borderRadius = '6px';
		codeBlock.style.overflowX = 'auto';
		codeBlock.createEl('code', {
			text: 'brew install ghostscript',
		});

		// Option 2: Direct Download
		const option2 = container.createDiv({ cls: 'manuscript-install-option' });
		option2.createEl('h4', { text: 'Option 2: Direct Download' });
		option2.createEl('p', { text: '1. Visit the Ghostscript download page:' });
		const downloadLink = option2.createEl('a', {
			text: 'Download Ghostscript for macOS',
			href: 'https://ghostscript.com/releases/gsdnld.html',
		});
		downloadLink.style.display = 'block';
		downloadLink.style.marginBottom = '0.5rem';

		option2.createEl('p', { text: '2. Download the macOS package' });
		option2.createEl('p', { text: '3. Install the .pkg file' });
		option2.createEl('p', { text: '4. Restart Obsidian after installation' });
	}

	private renderLinuxInstructions(container: HTMLElement): void {
		container.createEl('h3', { text: 'Installation Options for Linux' });

		// Debian/Ubuntu
		const option1 = container.createDiv({ cls: 'manuscript-install-option' });
		option1.createEl('h4', { text: 'Debian/Ubuntu/Mint' });
		option1.createEl('p', { text: 'Open Terminal and run:' });

		const aptCode = option1.createEl('pre');
		aptCode.style.background = 'var(--background-primary-alt)';
		aptCode.style.padding = '1rem';
		aptCode.style.borderRadius = '6px';
		aptCode.style.overflowX = 'auto';
		aptCode.createEl('code', {
			text: 'sudo apt update\nsudo apt install ghostscript',
		});

		// Fedora/RHEL
		const option2 = container.createDiv({ cls: 'manuscript-install-option' });
		option2.createEl('h4', { text: 'Fedora/RHEL/CentOS' });
		option2.createEl('p', { text: 'Open Terminal and run:' });

		const dnfCode = option2.createEl('pre');
		dnfCode.style.background = 'var(--background-primary-alt)';
		dnfCode.style.padding = '1rem';
		dnfCode.style.borderRadius = '6px';
		dnfCode.style.overflowX = 'auto';
		dnfCode.createEl('code', {
			text: 'sudo dnf install ghostscript',
		});

		// Arch Linux
		const option3 = container.createDiv({ cls: 'manuscript-install-option' });
		option3.createEl('h4', { text: 'Arch Linux/Manjaro' });
		option3.createEl('p', { text: 'Open Terminal and run:' });

		const pacmanCode = option3.createEl('pre');
		pacmanCode.style.background = 'var(--background-primary-alt)';
		pacmanCode.style.padding = '1rem';
		pacmanCode.style.borderRadius = '6px';
		pacmanCode.style.overflowX = 'auto';
		pacmanCode.createEl('code', {
			text: 'sudo pacman -S ghostscript',
		});
	}

	private async checkGhostscriptInstalled(): Promise<void> {
		const resultEl = this.contentEl.querySelector('.manuscript-install-result');
		if (resultEl) {
			resultEl.remove();
		}

		const result = this.contentEl.createDiv({ cls: 'manuscript-install-result' });
		result.style.marginTop = '1rem';
		result.style.padding = '1rem';
		result.style.borderRadius = '6px';

		try {
			// Try to execute Ghostscript
			const gsPath = process.platform === 'win32' ? 'gswin64c' : 'gs';
			const { stdout } = await execFileAsync(gsPath, ['--version']);

			result.style.background = 'var(--background-modifier-success)';
			result.style.color = 'var(--text-success)';
			result.createEl('strong', { text: '✓ Ghostscript is installed!' });
			result.createEl('p', { text: `Version: ${stdout.trim()}` });
			result.createEl('p', {
				text: 'You can now close this window and use PDF compression features.',
			});
		} catch (error) {
			result.style.background = 'var(--background-modifier-error)';
			result.style.color = 'var(--text-error)';
			result.createEl('strong', { text: '✗ Ghostscript not found' });
			result.createEl('p', {
				text: 'Please install Ghostscript using one of the methods above, then restart Obsidian.',
			});
			result.createEl('p', {
				text: 'Note: If you just installed Ghostscript, you need to restart Obsidian (Ctrl+R or Cmd+R) or restart your computer for the PATH changes to take effect.',
			});
		}
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
