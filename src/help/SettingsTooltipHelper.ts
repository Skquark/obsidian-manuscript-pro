import { Setting } from 'obsidian';
import { TooltipHelper, TooltipConfig } from './TooltipHelper';

/**
 * Extends the Setting class with tooltip support
 */
export function addTooltipToSetting(setting: Setting, config: TooltipConfig): Setting {
	// Add help icon to the setting name
	const nameEl = setting.nameEl;
	if (nameEl) {
		TooltipHelper.addHelpIcon(nameEl, config);
	}

	return setting;
}

/**
 * Add a help icon to any element with a tooltip
 */
export function addHelpIconToElement(element: HTMLElement, config: TooltipConfig): void {
	TooltipHelper.addHelpIcon(element, config);
}
