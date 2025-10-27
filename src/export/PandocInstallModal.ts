import { App, Modal, Notice, Platform } from 'obsidian';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Modal to help users install Pandoc with guided instructions
 */
export class PandocInstallModal extends Modal {
	private checking: boolean = false;

	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass('manuscript-pandoc-install-modal');

		// Header
		const header = contentEl.createDiv({ cls: 'manuscript-modal-header' });
		header.createEl('h2', { text: '📦 Pandoc Required' });
		header.createEl('p', {
			text: "Pandoc is required for exporting to PDF, DOCX, and ePub formats. Let's get it installed!",
		});

		// Important note about restarting
		const noteBox = contentEl.createDiv({ cls: 'manuscript-install-note' });
		noteBox.createEl('strong', { text: '⚠️ Important: ' });
		noteBox.createSpan({ text: 'After installing Pandoc, you must ' });
		noteBox.createEl('strong', { text: 'restart Obsidian (Ctrl+R)' });
		noteBox.createSpan({ text: ' for the changes to take effect.' });

		// Platform-specific instructions
		const platform =
			Platform.isWin ? 'windows'
			: Platform.isMacOS ? 'macos'
			: 'linux';

		if (platform === 'windows') {
			this.renderWindowsInstructions(contentEl);
		} else if (platform === 'macos') {
			this.renderMacInstructions(contentEl);
		} else {
			this.renderLinuxInstructions(contentEl);
		}

		// Check installation button
		const buttonContainer = contentEl.createDiv({ cls: 'manuscript-modal-buttons' });

		const checkButton = buttonContainer.createEl('button', {
			text: 'Check if Pandoc is Installed',
			cls: 'mod-cta',
		});
		checkButton.addEventListener('click', () => this.checkPandocInstallation());

		const cancelButton = buttonContainer.createEl('button', {
			text: 'Cancel',
		});
		cancelButton.addEventListener('click', () => this.close());
	}

	private renderWindowsInstructions(container: HTMLElement) {
		const section = container.createDiv({ cls: 'manuscript-install-section' });

		section.createEl('h3', { text: 'Installation Options for Windows' });

		// Option 1: Direct Download
		const option1 = section.createDiv({ cls: 'manuscript-install-option' });
		option1.createEl('h4', { text: '1. Direct Download (Recommended)' });
		option1.createEl('p', {
			text: 'Download and run the official Windows installer:',
		});

		const downloadLink = option1.createEl('a', {
			text: 'Download Pandoc for Windows',
			href: 'https://github.com/jgm/pandoc/releases/latest',
		});
		downloadLink.setAttr('target', '_blank');
		downloadLink.addClass('manuscript-download-link');

		option1.createEl('p', {
			text: '• Download the .msi file for your system (usually pandoc-x.xx-windows-x86_64.msi)',
			cls: 'manuscript-install-step',
		});
		option1.createEl('p', {
			text: '• Run the installer and follow the prompts',
			cls: 'manuscript-install-step',
		});
		option1.createEl('p', {
			text: '• Restart Obsidian after installation',
			cls: 'manuscript-install-step',
		});

		// Option 2: Winget
		const option2 = section.createDiv({ cls: 'manuscript-install-option' });
		option2.createEl('h4', { text: '2. Windows Package Manager (winget)' });
		option2.createEl('p', {
			text: 'If you have winget installed, open PowerShell or Command Prompt and run:',
		});

		const codeBlock = option2.createEl('pre');
		const code = codeBlock.createEl('code', {
			text: 'winget install --id JohnMacFarlane.Pandoc',
		});

		const copyButton = option2.createEl('button', {
			text: 'Copy Command',
			cls: 'manuscript-copy-button',
		});
		copyButton.addEventListener('click', () => {
			navigator.clipboard.writeText('winget install --id JohnMacFarlane.Pandoc');
			new Notice('Command copied to clipboard!');
		});

		// Option 3: Chocolatey
		const option3 = section.createDiv({ cls: 'manuscript-install-option' });
		option3.createEl('h4', { text: '3. Chocolatey' });
		option3.createEl('p', {
			text: 'If you have Chocolatey installed, run:',
		});

		const chocoCode = option3.createEl('pre');
		chocoCode.createEl('code', {
			text: 'choco install pandoc',
		});

		const copyChoco = option3.createEl('button', {
			text: 'Copy Command',
			cls: 'manuscript-copy-button',
		});
		copyChoco.addEventListener('click', () => {
			navigator.clipboard.writeText('choco install pandoc');
			new Notice('Command copied to clipboard!');
		});
	}

	private renderMacInstructions(container: HTMLElement) {
		const section = container.createDiv({ cls: 'manuscript-install-section' });

		section.createEl('h3', { text: 'Installation Options for macOS' });

		// Option 1: Homebrew
		const option1 = section.createDiv({ cls: 'manuscript-install-option' });
		option1.createEl('h4', { text: '1. Homebrew (Recommended)' });
		option1.createEl('p', {
			text: 'If you have Homebrew installed, open Terminal and run:',
		});

		const codeBlock = option1.createEl('pre');
		codeBlock.createEl('code', {
			text: 'brew install pandoc',
		});

		const copyButton = option1.createEl('button', {
			text: 'Copy Command',
			cls: 'manuscript-copy-button',
		});
		copyButton.addEventListener('click', () => {
			navigator.clipboard.writeText('brew install pandoc');
			new Notice('Command copied to clipboard!');
		});

		// Option 2: Direct Download
		const option2 = section.createDiv({ cls: 'manuscript-install-option' });
		option2.createEl('h4', { text: '2. Direct Download' });
		option2.createEl('p', {
			text: 'Download the official macOS installer:',
		});

		const downloadLink = option2.createEl('a', {
			text: 'Download Pandoc for macOS',
			href: 'https://github.com/jgm/pandoc/releases/latest',
		});
		downloadLink.setAttr('target', '_blank');
		downloadLink.addClass('manuscript-download-link');
	}

	private renderLinuxInstructions(container: HTMLElement) {
		const section = container.createDiv({ cls: 'manuscript-install-section' });

		section.createEl('h3', { text: 'Installation Options for Linux' });

		// Ubuntu/Debian
		const option1 = section.createDiv({ cls: 'manuscript-install-option' });
		option1.createEl('h4', { text: 'Ubuntu/Debian' });
		const ubuntuCode = option1.createEl('pre');
		ubuntuCode.createEl('code', {
			text: 'sudo apt-get update\nsudo apt-get install pandoc',
		});

		const copyUbuntu = option1.createEl('button', {
			text: 'Copy Command',
			cls: 'manuscript-copy-button',
		});
		copyUbuntu.addEventListener('click', () => {
			navigator.clipboard.writeText('sudo apt-get update && sudo apt-get install pandoc');
			new Notice('Command copied to clipboard!');
		});

		// Fedora
		const option2 = section.createDiv({ cls: 'manuscript-install-option' });
		option2.createEl('h4', { text: 'Fedora' });
		const fedoraCode = option2.createEl('pre');
		fedoraCode.createEl('code', {
			text: 'sudo dnf install pandoc',
		});

		const copyFedora = option2.createEl('button', {
			text: 'Copy Command',
			cls: 'manuscript-copy-button',
		});
		copyFedora.addEventListener('click', () => {
			navigator.clipboard.writeText('sudo dnf install pandoc');
			new Notice('Command copied to clipboard!');
		});

		// Arch
		const option3 = section.createDiv({ cls: 'manuscript-install-option' });
		option3.createEl('h4', { text: 'Arch Linux' });
		const archCode = option3.createEl('pre');
		archCode.createEl('code', {
			text: 'sudo pacman -S pandoc',
		});

		const copyArch = option3.createEl('button', {
			text: 'Copy Command',
			cls: 'manuscript-copy-button',
		});
		copyArch.addEventListener('click', () => {
			navigator.clipboard.writeText('sudo pacman -S pandoc');
			new Notice('Command copied to clipboard!');
		});
	}

	private async checkPandocInstallation() {
		if (this.checking) return;

		this.checking = true;
		new Notice('Checking for Pandoc...');

		try {
			const { stdout } = await execAsync('pandoc --version');

			if (stdout.includes('pandoc')) {
				new Notice('✅ Pandoc is installed! Restart Obsidian (Ctrl+R) to use export features.', 8000);
				this.close();
			} else {
				new Notice(
					'❌ Pandoc not found. If you just installed it, please restart Obsidian (Ctrl+R) and try again.',
					6000,
				);
			}
		} catch (error) {
			// Check if Pandoc was just installed but PATH hasn't refreshed yet
			new Notice(
				'❌ Pandoc not detected. If you just installed it, please restart Obsidian (Ctrl+R) to refresh the system PATH, then try exporting again.',
				8000,
			);
		} finally {
			this.checking = false;
		}
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
