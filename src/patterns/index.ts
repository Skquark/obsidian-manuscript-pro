import { PatternGroup } from '../interfaces/plugin-settings';
import { createMathDelimitersGroup } from './mathDelimiters';
import { createCitationsGroup } from './citations';
import { createLatexCommandsGroup } from './latexCommands';
import { createPandocMarkupGroup } from './pandocMarkup';
import { createIndexingMetaGroup } from './indexingMeta';

/**
 * Get all pattern groups
 */
export function getAllPatternGroups(): PatternGroup[] {
	return [
		createMathDelimitersGroup(),
		createCitationsGroup(),
		createLatexCommandsGroup(),
		createPandocMarkupGroup(),
		createIndexingMetaGroup()
	];
}

/**
 * Get a specific pattern group by ID
 */
export function getPatternGroupById(id: string): PatternGroup | undefined {
	const groups = getAllPatternGroups();
	return groups.find(group => group.id === id);
}

export {
	createMathDelimitersGroup,
	createCitationsGroup,
	createLatexCommandsGroup,
	createPandocMarkupGroup,
	createIndexingMetaGroup
};
