import {
	nextSessionNumber,
	formatSessionNumber,
	formatDateString,
	buildNotePath,
	applyTemplateVariables,
	CARRYFORWARD_KEYS,
} from '../sessionUtils';

// ---------------------------------------------------------------------------
// CARRYFORWARD_KEYS
// ---------------------------------------------------------------------------
describe('CARRYFORWARD_KEYS', () => {
	it('includes adventure so it pre-populates from the most recent session', () => {
		expect(CARRYFORWARD_KEYS).toContain('adventure');
	});

	it('includes all taxonomy and calendar fields', () => {
		const required = ['world', 'thread', 'chapter', 'adventure', 'location', 'fc-date', 'fc-category'];
		required.forEach(key => expect(CARRYFORWARD_KEYS).toContain(key));
	});

	it('preserves order: adventure sits after chapter and before location', () => {
		const keys = [...CARRYFORWARD_KEYS];
		expect(keys.indexOf('adventure')).toBeGreaterThan(keys.indexOf('chapter'));
		expect(keys.indexOf('adventure')).toBeLessThan(keys.indexOf('location'));
	});
});

// ---------------------------------------------------------------------------
// nextSessionNumber
// ---------------------------------------------------------------------------
describe('nextSessionNumber', () => {
	it('returns 1 when no sessions exist yet', () => {
		expect(nextSessionNumber([])).toBe(1);
	});

	it('returns one more than the current maximum', () => {
		expect(nextSessionNumber([1, 2, 3])).toBe(4);
	});

	it('handles a sparse sequence with gaps', () => {
		// e.g. session 63 was never created (see test vault gap between 062 and 064)
		expect(nextSessionNumber([60, 61, 62, 64, 65])).toBe(66);
	});

	it('handles a single existing session', () => {
		expect(nextSessionNumber([91])).toBe(92);
	});
});

// ---------------------------------------------------------------------------
// formatSessionNumber
// ---------------------------------------------------------------------------
describe('formatSessionNumber', () => {
	it('pads single-digit numbers to 3 digits', () => {
		expect(formatSessionNumber(1)).toBe('001');
	});

	it('pads double-digit numbers to 3 digits', () => {
		expect(formatSessionNumber(42)).toBe('042');
	});

	it('leaves triple-digit numbers unchanged', () => {
		expect(formatSessionNumber(100)).toBe('100');
	});

	// Regression: the original modal used padStart(2) in the auto-fill path
	// and padStart(3) on submit, causing a mismatch with the 3-digit naming
	// convention used by every existing session file.
	it('always produces 3-digit padding to match the existing NNN_ file convention', () => {
		expect(formatSessionNumber(2).length).toBe(3);
		expect(formatSessionNumber(9).length).toBe(3);
	});
});

// ---------------------------------------------------------------------------
// formatDateString
// ---------------------------------------------------------------------------
describe('formatDateString', () => {
	it('converts YYYY-MM-DD to YYYYMMDD', () => {
		expect(formatDateString('2020-07-26')).toBe('20200726');
	});

	it('preserves leading zeros in month and day', () => {
		expect(formatDateString('2023-01-05')).toBe('20230105');
	});

	// Regression: constructing `new Date("2020-07-26")` parses as UTC midnight,
	// so `date.getDate()` returns the previous calendar day in any timezone
	// behind UTC (e.g. US Central, US Eastern). Splitting the string directly
	// avoids this entirely.
	it('returns the correct day regardless of local timezone offset', () => {
		// Simulate the former Date-based approach to show the difference
		const isoDate = '2020-07-26';
		const safeResult = formatDateString(isoDate);

		// The safe path always returns the literal values in the string
		expect(safeResult).toBe('20200726');
		expect(safeResult.slice(6, 8)).toBe('26'); // day portion is always correct
	});
});

// ---------------------------------------------------------------------------
// buildNotePath
// ---------------------------------------------------------------------------
describe('buildNotePath', () => {
	it('assembles the expected vault-relative path', () => {
		expect(
			buildNotePath('ttrpgs', 'Quarantine Qohort', '092', '20240421', 'The Final Battle'),
		).toBe('ttrpgs/Quarantine Qohort/092_20240421 - The Final Battle.md');
	});

	it('uses the provided baseFolder, not a hardcoded ttrpgs prefix', () => {
		const path = buildNotePath('campaigns', 'My Campaign', '001', '20240101', 'Session One');
		expect(path.startsWith('campaigns/')).toBe(true);
		expect(path.startsWith('ttrpgs/')).toBe(false);
	});

	it('produces a .md extension', () => {
		const path = buildNotePath('ttrpgs', 'Campaign', '001', '20240101', 'Title');
		expect(path.endsWith('.md')).toBe(true);
	});
});

// ---------------------------------------------------------------------------
// applyTemplateVariables
// ---------------------------------------------------------------------------
describe('applyTemplateVariables', () => {
	const template = `---
campaign: {{campaign}}
sessionNum: {{sessionNum}}
world: {{world}}
---`;

	it('replaces all matching placeholders', () => {
		const result = applyTemplateVariables(template, {
			'{{campaign}}': 'Quarantine Qohort',
			'{{sessionNum}}': '092',
			'{{world}}': 'Faerûn',
		});
		expect(result).toContain('campaign: Quarantine Qohort');
		expect(result).toContain('sessionNum: 092');
		expect(result).toContain('world: Faerûn');
	});

	it('replaces all occurrences of a placeholder, not just the first', () => {
		const multiTemplate = '{{campaign}} is the best. Play {{campaign}} today.';
		const result = applyTemplateVariables(multiTemplate, { '{{campaign}}': 'D&D' });
		expect(result).toBe('D&D is the best. Play D&D today.');
	});

	it('leaves unknown placeholders untouched', () => {
		const result = applyTemplateVariables(template, { '{{campaign}}': 'Test' });
		expect(result).toContain('{{sessionNum}}');
		expect(result).toContain('{{world}}');
	});

	it('handles an empty variables map without throwing', () => {
		expect(() => applyTemplateVariables(template, {})).not.toThrow();
	});

	it('handles values that contain regex special characters', () => {
		// Campaign names can contain parentheses, dots, etc.
		const result = applyTemplateVariables('Campaign: {{campaign}}', {
			'{{campaign}}': 'Fire & Ice (Redux)',
		});
		expect(result).toBe('Campaign: Fire & Ice (Redux)');
	});

	it('handles empty string values', () => {
		const result = applyTemplateVariables('world: {{world}}', { '{{world}}': '' });
		expect(result).toBe('world: ');
	});
});
