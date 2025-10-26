/**
 * Command Edit Engine (Phase A minimal)
 * Detect simple LaTeX commands at cursor and parse optional/positional args.
 */

import type { CommandSpec } from './command-spec';
import { COMMAND_SPECS } from './command-spec';

export interface DetectedCommand {
	spec: CommandSpec;
	from: { line: number; ch: number };
	to: { line: number; ch: number };
	text: string;
	// parsed values
	values: Record<string, string>;
}

/**
 * Try to detect a simple command on the current line around the cursor.
 * Supports: \\name[optional]{arg}{arg2} and \\name{arg}
 */
export function detectCommandOnLine(
	lineText: string,
	cursorCh: number,
): { match: RegExpMatchArray; index: number } | null {
	// Find all commands on line
	const re = /\\([A-Za-z]+)(\[[^\]]*\])?(\{[^}]*\})?(\{[^}]*\})?/g;
	let m: RegExpMatchArray | null;
	let idx = 0;
	while ((m = re.exec(lineText)) !== null) {
		const start = m.index;
		if (start === undefined) continue; // Safety check
		const end = re.lastIndex;
		if (cursorCh >= start && cursorCh <= end) {
			return { match: m, index: start };
		}
	}
	return null;
}

/**
 * Map a detected regex match to a spec and parsed values (best-effort).
 */
export function mapMatchToSpec(match: RegExpMatchArray): { spec?: CommandSpec; values: Record<string, string> } {
	const cmdName = match[1];
	const opt = match[2] || '';
	const arg1 = match[3] || '';
	const arg2 = match[4] || '';
	const spec = COMMAND_SPECS.find((s) => s.name.replace(/^\\/, '') === cmdName && s.kind !== 'environment');
	const values: Record<string, string> = {};
	if (!spec) return { spec: undefined, values };

	// naive mapping: optional -> first optional arg key; positional map in order
	const optKey =
		spec.args.find((a) => a.kind === 'optional')?.key || spec.args.find((a) => a.kind === 'optional')?.name;
	if (opt && optKey) {
		const inner = opt.slice(1, -1); // inside []
		// If key=val present use right side, else entire inner
		const eq = inner.indexOf('=');
		values[optKey] = eq > -1 ? inner.substring(eq + 1) : inner;
	}
	const posArgs = spec.args.filter((a) => a.kind === 'positional');
	const args = [arg1, arg2].filter(Boolean).map((s) => s.slice(1, -1));
	posArgs.forEach((a, i) => {
		if (args[i] !== undefined) values[a.name] = args[i];
	});
	return { spec, values };
}
