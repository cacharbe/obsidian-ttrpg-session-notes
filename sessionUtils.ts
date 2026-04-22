/**
 * Pure utility functions extracted from CreateSessionModal.
 * No Obsidian API dependencies — safe to unit test in Node.
 */

/** Returns the next sequential session number given all existing ones. */
export function nextSessionNumber(existingNums: number[]): number {
	if (existingNums.length === 0) return 1;
	return Math.max(...existingNums) + 1;
}

/** Zero-pads a session number to 3 digits, matching the existing file naming convention. */
export function formatSessionNumber(num: number): string {
	return num.toString().padStart(3, '0');
}

/**
 * Converts an HTML date-input value (YYYY-MM-DD) to a compact YYYYMMDD string.
 *
 * Splits the string directly rather than constructing a Date object, which
 * would parse the value as UTC midnight and return the wrong local day in
 * any timezone behind UTC.
 */
export function formatDateString(isoDate: string): string {
	const [year, month, day] = isoDate.split('-');
	return `${year}${month}${day}`;
}

/** Builds the vault-relative path for a new session note. */
export function buildNotePath(
	baseFolder: string,
	campaign: string,
	sessionNum: string,
	formattedDate: string,
	title: string,
): string {
	return `${baseFolder}/${campaign}/${sessionNum}_${formattedDate} - ${title}.md`;
}

/**
 * Replaces all `{{variable}}` placeholders in a template string.
 * Keys in the map should include the braces, e.g. `'{{campaign}}'`.
 *
 * Special regex characters in keys are escaped so that the double-braces
 * are treated literally rather than as quantifiers.
 */
export function applyTemplateVariables(
	template: string,
	variables: Record<string, string>,
): string {
	let result = template;
	for (const [key, value] of Object.entries(variables)) {
		result = result.replace(new RegExp(escapeRegex(key), 'g'), value);
	}
	return result;
}

function escapeRegex(str: string): string {
	return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
