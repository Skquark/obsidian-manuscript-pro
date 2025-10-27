/**
 * EPUBCheck Installation Modal
 * Provides platform-specific installation instructions for EPUBCheck
 */

import { App, Modal } from 'obsidian';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

export class EpubCheckInstallModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass('manuscript-epubcheck-install-modal');

		// Title
		contentEl.createEl('h2', { text: 'EPUBCheck Not Found' });

		// Description
		const desc = contentEl.createDiv({ cls: 'manuscript-install-description' });
		desc.createEl('p', {
			text: 'EPUB validation requires EPUBCheck, a tool from the W3C for validating EPUB files against industry standards. Install EPUBCheck to catch formatting errors before uploading to retailers.',
		});

		// Requirements
		contentEl.createEl('h3', { text: 'Requirements' });
		const reqList = contentEl.createEl('ul');
		reqList.createEl('li', { text: 'Java Runtime Environment (JRE) 8 or higher' });
		reqList.createEl('li', { text: 'EPUBCheck JAR file' });

		// Check Java first
		const javaSection = contentEl.createDiv({ cls: 'manuscript-install-section' });
		javaSection.createEl('h3', { text: 'Step 1: Verify Java Installation' });
		javaSection.createEl('p', { text: 'EPUBCheck requires Java. Check if you have Java installed:' });

		const javaCheckButton = javaSection.createEl('button', {
			text: 'Check Java Installation',
			cls: 'mod-cta',
		});
		javaCheckButton.addEventListener('click', async () => {
			await this.checkJavaInstalled();
		});

		const javaResult = javaSection.createDiv({ cls: 'manuscript-check-result' });

		// EPUBCheck installation
		contentEl.createEl('h3', { text: 'Step 2: Install EPUBCheck' });

		const platform = process.platform;
		if (platform === 'win32') {
			this.renderWindowsInstructions(contentEl);
		} else if (platform === 'darwin') {
			this.renderMacOSInstructions(contentEl);
		} else {
			this.renderLinuxInstructions(contentEl);
		}

		// Important note
		const noteBox = contentEl.createDiv({ cls: 'manuscript-install-note' });
		noteBox.createEl('strong', { text: '💡 Tip: ' });
		noteBox.createSpan({
			text: 'After installing EPUBCheck, configure the path to the JAR file in ManuScript Pro settings under Export → EPUBCheck Path.',
		});

		// Check EPUBCheck button
		const buttonContainer = contentEl.createDiv({ cls: 'manuscript-install-buttons' });
		const checkButton = buttonContainer.createEl('button', {
			text: 'Check if EPUBCheck is Installed',
			cls: 'mod-cta',
		});
		checkButton.addEventListener('click', async () => {
			await this.checkEpubCheckInstalled();
		});

		const closeButton = buttonContainer.createEl('button', { text: 'Close' });
		closeButton.addEventListener('click', () => {
			this.close();
		});
	}

	private renderWindowsInstructions(container: HTMLElement): void {
		// Option 1: Direct Download
		const option1 = container.createDiv({ cls: 'manuscript-install-option' });
		option1.createEl('h4', { text: 'Download EPUBCheck' });
		option1.createEl('p', { text: '1. Download EPUBCheck from GitHub:' });
		const downloadLink = option1.createEl('a', {
			text: 'Download EPUBCheck',
			href: 'https://github.com/w3c/epubcheck/releases/latest',
		});
		downloadLink.style.display = 'block';
		downloadLink.style.marginBottom = '0.5rem';

		option1.createEl('p', {
			text: '2. Download the epubcheck-X.X.X.zip file (e.g., epubcheck-5.1.0.zip)',
		});
		option1.createEl('p', { text: '3. Extract the ZIP file to a folder (e.g., C:\\Program Files\\EPUBCheck)' });
		option1.createEl('p', {
			text: '4. Note the path to epubcheck.jar (e.g., C:\\Program Files\\EPUBCheck\\epubcheck.jar)',
		});
		option1.createEl('p', { text: '5. Configure the path in ManuScript Pro settings' });

		// Java installation info
		const javaInfo = container.createDiv({ cls: 'manuscript-install-option' });
		javaInfo.createEl('h4', { text: 'Install Java (if needed)' });
		javaInfo.createEl('p', { text: 'If you don\'t have Java installed:' });

		const javaLink = javaInfo.createEl('a', {
			text: 'Download Java from Oracle',
			href: 'https://www.java.com/download/',
		});
		javaLink.style.display = 'block';
		javaLink.style.marginBottom = '0.5rem';

		javaInfo.createEl('p', { text: 'Or use a package manager:' });
		const javaCode = javaInfo.createEl('pre');
		javaCode.style.background = 'var(--background-primary-alt)';
		javaCode.style.padding = '1rem';
		javaCode.style.borderRadius = '6px';
		javaCode.createEl('code', {
			text: 'winget install --id Oracle.JavaRuntimeEnvironment',
		});
	}

	private renderMacOSInstructions(container: HTMLElement): void {
		// Option 1: Homebrew (Recommended)
		const option1 = container.createDiv({ cls: 'manuscript-install-option' });
		option1.createEl('h4', { text: 'Option 1: Homebrew (Recommended)' });
		option1.createEl('p', { text: 'If you have Homebrew installed, run:' });

		const codeBlock = option1.createEl('pre');
		codeBlock.style.background = 'var(--background-primary-alt)';
		codeBlock.style.padding = '1rem';
		codeBlock.style.borderRadius = '6px';
		codeBlock.createEl('code', {
			text: 'brew install epubcheck',
		});

		option1.createEl('p', {
			text: 'This will install both Java (if needed) and EPUBCheck automatically.',
		});

		// Option 2: Manual Download
		const option2 = container.createDiv({ cls: 'manuscript-install-option' });
		option2.createEl('h4', { text: 'Option 2: Manual Download' });
		option2.createEl('p', { text: '1. Download EPUBCheck from GitHub:' });
		const downloadLink = option2.createEl('a', {
			text: 'Download EPUBCheck',
			href: 'https://github.com/w3c/epubcheck/releases/latest',
		});
		downloadLink.style.display = 'block';
		downloadLink.style.marginBottom = '0.5rem';

		option2.createEl('p', { text: '2. Extract the ZIP file' });
		option2.createEl('p', { text: '3. Move to /usr/local/bin or another location in your PATH' });
		option2.createEl('p', { text: '4. Configure the path in ManuScript Pro settings' });
	}

	private renderLinuxInstructions(container: HTMLElement): void {
		// Debian/Ubuntu
		const option1 = container.createDiv({ cls: 'manuscript-install-option' });
		option1.createEl('h4', { text: 'Debian/Ubuntu/Mint' });
		option1.createEl('p', { text: 'Install from package manager:' });

		const aptCode = option1.createEl('pre');
		aptCode.style.background = 'var(--background-primary-alt)';
		aptCode.style.padding = '1rem';
		aptCode.style.borderRadius = '6px';
		aptCode.createEl('code', {
			text: 'sudo apt update\nsudo apt install default-jre\n\n# Then download EPUBCheck manually or use snap\nsudo snap install epubcheck',
		});

		// Fedora/RHEL
		const option2 = container.createDiv({ cls: 'manuscript-install-option' });
		option2.createEl('h4', { text: 'Fedora/RHEL/CentOS' });

		const dnfCode = option2.createEl('pre');
		dnfCode.style.background = 'var(--background-primary-alt)';
		dnfCode.style.padding = '1rem';
		dnfCode.style.borderRadius = '6px';
		dnfCode.createEl('code', {
			text: 'sudo dnf install java-latest-openjdk\n\n# Download EPUBCheck manually from GitHub',
		});

		// Manual download option
		const option3 = container.createDiv({ cls: 'manuscript-install-option' });
		option3.createEl('h4', { text: 'Manual Installation (All Distributions)' });
		option3.createEl('p', { text: '1. Install Java (if not already installed)' });
		option3.createEl('p', { text: '2. Download EPUBCheck from:' });
		const downloadLink = option3.createEl('a', {
			text: 'https://github.com/w3c/epubcheck/releases',
			href: 'https://github.com/w3c/epubcheck/releases/latest',
		});
		downloadLink.style.display = 'block';
		downloadLink.style.marginBottom = '0.5rem';

		option3.createEl('p', { text: '3. Extract and place in /usr/local/share/java or ~/.local/share/java' });
		option3.createEl('p', { text: '4. Configure the path in ManuScript Pro settings' });
	}

	private async checkJavaInstalled(): Promise<void> {
		const resultEl = this.contentEl.querySelector('.manuscript-check-result');
		if (!resultEl) return;

		resultEl.empty();

		const result = resultEl.createDiv();
		result.style.marginTop = '1rem';
		result.style.padding = '1rem';
		result.style.borderRadius = '6px';

		try {
			const { stdout } = await execFileAsync('java', ['-version']);

			result.style.background = 'var(--background-modifier-success)';
			result.style.color = 'var(--text-success)';
			result.createEl('strong', { text: '✓ Java is installed!' });
			result.createEl('p', { text: stdout.split('\n')[0] || 'Java detected' });
			result.createEl('p', { text: 'You can now install EPUBCheck.' });
		} catch (error: any) {
			result.style.background = 'var(--background-modifier-error)';
			result.style.color = 'var(--text-error)';
			result.createEl('strong', { text: '✗ Java not found' });
			result.createEl('p', {
				text: 'Please install Java Runtime Environment (JRE) before installing EPUBCheck.',
			});

			const javaLink = result.createEl('a', {
				text: 'Download Java',
				href: 'https://www.java.com/download/',
			});
			javaLink.style.display = 'block';
			javaLink.style.marginTop = '0.5rem';
		}
	}

	private async checkEpubCheckInstalled(): Promise<void> {
		const resultEl = this.contentEl.querySelector('.manuscript-install-result');
		if (resultEl) {
			resultEl.remove();
		}

		const result = this.contentEl.createDiv({ cls: 'manuscript-install-result' });
		result.style.marginTop = '1rem';
		result.style.padding = '1rem';
		result.style.borderRadius = '6px';

		try {
			// Try to run EPUBCheck
			const { stdout } = await execFileAsync('java', ['-jar', 'epubcheck.jar', '--version']);

			result.style.background = 'var(--background-modifier-success)';
			result.style.color = 'var(--text-success)';
			result.createEl('strong', { text: '✓ EPUBCheck is installed!' });
			result.createEl('p', { text: `Version: ${stdout.trim()}` });
			result.createEl('p', {
				text: 'You can now close this window and use EPUB validation features.',
			});
		} catch (error) {
			result.style.background = 'var(--background-modifier-error)';
			result.style.color = 'var(--text-error)';
			result.createEl('strong', { text: '✗ EPUBCheck not found' });
			result.createEl('p', {
				text: 'Please install EPUBCheck using one of the methods above, then configure the path to epubcheck.jar in ManuScript Pro settings.',
			});
		}
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
