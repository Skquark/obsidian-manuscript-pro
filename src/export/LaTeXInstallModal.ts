import { App, Modal, Notice, Platform } from 'obsidian';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Modal to help users install LaTeX (required for PDF exports)
 */
export class LaTeXInstallModal extends Modal {
	private checking: boolean = false;

	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass('manuscript-latex-install-modal');

		// Header
		const header = contentEl.createDiv({ cls: 'manuscript-modal-header' });
		header.createEl('h2', { text: '📄 LaTeX Required for PDF Export' });
		header.createEl('p', {
			text: 'Pandoc uses LaTeX to generate PDFs. You need to install a LaTeX distribution to export to PDF format.',
		});

		// Important note about restarting
		const noteBox = contentEl.createDiv({ cls: 'manuscript-install-note' });
		noteBox.createEl('strong', { text: '⚠️ Important: ' });
		noteBox.createSpan({ text: 'After installing LaTeX, you must ' });
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

		// Alternative note
		const altNote = contentEl.createDiv({ cls: 'manuscript-install-alternative' });
		altNote.createEl('h4', { text: '💡 Alternative: Export to DOCX instead' });
		altNote.createEl('p', {
			text: "If you don't want to install LaTeX, you can export to DOCX format which doesn't require it. You can then convert DOCX to PDF using Microsoft Word or other tools.",
		});

		// Check installation button
		const buttonContainer = contentEl.createDiv({ cls: 'manuscript-modal-buttons' });

		const checkButton = buttonContainer.createEl('button', {
			text: 'Check if LaTeX is Installed',
			cls: 'mod-cta',
		});
		checkButton.addEventListener('click', () => this.checkLaTeXInstallation());

		const cancelButton = buttonContainer.createEl('button', {
			text: 'Cancel',
		});
		cancelButton.addEventListener('click', () => this.close());
	}

	private renderWindowsInstructions(container: HTMLElement) {
		const section = container.createDiv({ cls: 'manuscript-install-section' });

		section.createEl('h3', { text: 'Installation Options for Windows' });

		// Option 1: MiKTeX (Recommended)
		const option1 = section.createDiv({ cls: 'manuscript-install-option' });
		option1.createEl('h4', { text: '1. MiKTeX (Recommended - Smaller Download)' });
		option1.createEl('p', {
			text: 'MiKTeX is a compact LaTeX distribution that downloads packages on-demand:',
		});

		const miktexLink = option1.createEl('a', {
			text: 'Download MiKTeX for Windows',
			href: 'https://miktex.org/download',
		});
		miktexLink.setAttr('target', '_blank');
		miktexLink.addClass('manuscript-download-link');

		option1.createEl('p', {
			text: '• Download the installer (recommended: Basic MiKTeX Installer)',
			cls: 'manuscript-install-step',
		});
		option1.createEl('p', {
			text: '• Run the installer and follow the prompts',
			cls: 'manuscript-install-step',
		});
		option1.createEl('p', {
			text: '• Choose "Install missing packages on-the-fly: Yes" during installation',
			cls: 'manuscript-install-step',
		});
		option1.createEl('p', {
			text: '• Restart Obsidian after installation',
			cls: 'manuscript-install-step',
		});

		// Important MiKTeX note
		const miktexNote = option1.createDiv({ cls: 'manuscript-miktex-note' });
		miktexNote.createEl('strong', { text: '📝 After Installation: ' });
		miktexNote.createSpan({
			text: 'Open MiKTeX Console and ensure "Install missing packages on-the-fly" is set to "Yes" in Settings → General. This allows MiKTeX to automatically download packages as needed.',
		});

		// Option 2: TeX Live
		const option2 = section.createDiv({ cls: 'manuscript-install-option' });
		option2.createEl('h4', { text: '2. TeX Live (Full Distribution - Large Download ~4GB)' });
		option2.createEl('p', {
			text: 'TeX Live is a comprehensive LaTeX distribution:',
		});

		const texliveLink = option2.createEl('a', {
			text: 'Download TeX Live',
			href: 'https://tug.org/texlive/acquire-netinstall.html',
		});
		texliveLink.setAttr('target', '_blank');
		texliveLink.addClass('manuscript-download-link');

		option2.createEl('p', {
			text: '⚠️ Note: TeX Live is a large download (~4GB) and installation may take significant time.',
			cls: 'manuscript-warning-text',
		});
	}

	private renderMacInstructions(container: HTMLElement) {
		const section = container.createDiv({ cls: 'manuscript-install-section' });

		section.createEl('h3', { text: 'Installation Options for macOS' });

		// Option 1: MacTeX
		const option1 = section.createDiv({ cls: 'manuscript-install-option' });
		option1.createEl('h4', { text: '1. MacTeX (Recommended)' });
		option1.createEl('p', {
			text: 'MacTeX is the standard LaTeX distribution for macOS:',
		});

		const mactexLink = option1.createEl('a', {
			text: 'Download MacTeX',
			href: 'https://www.tug.org/mactex/mactex-download.html',
		});
		mactexLink.setAttr('target', '_blank');
		mactexLink.addClass('manuscript-download-link');

		option1.createEl('p', {
			text: '⚠️ Note: MacTeX is a large download (~4GB) and installation may take significant time.',
			cls: 'manuscript-warning-text',
		});

		// Option 2: Homebrew
		const option2 = section.createDiv({ cls: 'manuscript-install-option' });
		option2.createEl('h4', { text: '2. BasicTeX via Homebrew (Smaller Alternative)' });
		option2.createEl('p', {
			text: 'If you have Homebrew installed, you can install BasicTeX (smaller version):',
		});

		const codeBlock = option2.createEl('pre');
		codeBlock.createEl('code', {
			text: 'brew install --cask basictex',
		});

		const copyButton = option2.createEl('button', {
			text: 'Copy Command',
			cls: 'manuscript-copy-button',
		});
		copyButton.addEventListener('click', () => {
			navigator.clipboard.writeText('brew install --cask basictex');
			new Notice('Command copied to clipboard!');
		});
	}

	private renderLinuxInstructions(container: HTMLElement) {
		const section = container.createDiv({ cls: 'manuscript-install-section' });

		section.createEl('h3', { text: 'Installation Options for Linux' });

		// Ubuntu/Debian
		const option1 = section.createDiv({ cls: 'manuscript-install-option' });
		option1.createEl('h4', { text: 'Ubuntu/Debian' });
		const ubuntuCode = option1.createEl('pre');
		ubuntuCode.createEl('code', {
			text: 'sudo apt-get update\nsudo apt-get install texlive',
		});

		const copyUbuntu = option1.createEl('button', {
			text: 'Copy Command',
			cls: 'manuscript-copy-button',
		});
		copyUbuntu.addEventListener('click', () => {
			navigator.clipboard.writeText('sudo apt-get update && sudo apt-get install texlive');
			new Notice('Command copied to clipboard!');
		});

		option1.createEl('p', {
			text: 'For a more complete installation with additional packages:',
		});
		const ubuntuFullCode = option1.createEl('pre');
		ubuntuFullCode.createEl('code', {
			text: 'sudo apt-get install texlive-full',
		});

		// Fedora
		const option2 = section.createDiv({ cls: 'manuscript-install-option' });
		option2.createEl('h4', { text: 'Fedora' });
		const fedoraCode = option2.createEl('pre');
		fedoraCode.createEl('code', {
			text: 'sudo dnf install texlive-scheme-basic',
		});

		const copyFedora = option2.createEl('button', {
			text: 'Copy Command',
			cls: 'manuscript-copy-button',
		});
		copyFedora.addEventListener('click', () => {
			navigator.clipboard.writeText('sudo dnf install texlive-scheme-basic');
			new Notice('Command copied to clipboard!');
		});

		// Arch
		const option3 = section.createDiv({ cls: 'manuscript-install-option' });
		option3.createEl('h4', { text: 'Arch Linux' });
		const archCode = option3.createEl('pre');
		archCode.createEl('code', {
			text: 'sudo pacman -S texlive-core',
		});

		const copyArch = option3.createEl('button', {
			text: 'Copy Command',
			cls: 'manuscript-copy-button',
		});
		copyArch.addEventListener('click', () => {
			navigator.clipboard.writeText('sudo pacman -S texlive-core');
			new Notice('Command copied to clipboard!');
		});
	}

	private async checkLaTeXInstallation() {
		if (this.checking) return;

		this.checking = true;
		new Notice('Checking for LaTeX...');

		try {
			const { stdout } = await execAsync('pdflatex --version');

			if (stdout.includes('pdfTeX') || stdout.includes('TeX')) {
				new Notice('✅ LaTeX is installed! Restart Obsidian (Ctrl+R) to use PDF export.', 8000);
				this.close();
			} else {
				new Notice(
					'❌ LaTeX not found. If you just installed it, please restart Obsidian (Ctrl+R) and try again.',
					6000,
				);
			}
		} catch (error) {
			// Check if LaTeX was just installed but PATH hasn't refreshed yet
			new Notice(
				'❌ LaTeX not detected. If you just installed it, please restart Obsidian (Ctrl+R) to refresh the system PATH, then try exporting again.',
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
