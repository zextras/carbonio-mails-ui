/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { fitTagsInLines } from '../fit-tags-in-lines';

// Line of 300px: with the 18px kept free for the "×" of a hovered pill, 282px are usable.
const LINE = 300;
const counterWidth = (): number => 20;

describe('fitTagsInLines', () => {
	test('shows every tag when they fit in one line', () => {
		expect(fitTagsInLines({ lineWidth: LINE, pillWidths: [60, 70, 80], counterWidth })).toBe(3);
	});

	test('shows every tag when they need exactly two lines', () => {
		// line 1: 130 + 6 + 130 = 266; line 2: 130 + 6 + 130 = 266
		expect(
			fitTagsInLines({ lineWidth: LINE, pillWidths: [130, 130, 130, 130], counterWidth })
		).toBe(4);
	});

	test('keeps the 18px line end free: a pill that would end inside it wraps', () => {
		// 140 + 6 + 140 = 286 > 282: the second pill goes to line 2, the third does not fit
		expect(fitTagsInLines({ lineWidth: LINE, pillWidths: [140, 140, 140], counterWidth })).toBe(2);
	});

	test('when the tags need more than two lines, leaves room for "+N" on the second line', () => {
		// line 1: 130, 130; line 2: 130, 130 would be 266 + 6 + 20 = 292 > 282 with "+N"
		expect(
			fitTagsInLines({ lineWidth: LINE, pillWidths: [130, 130, 130, 130, 130], counterWidth })
		).toBe(3);
	});

	test('measures "+N" for the number of tags it hides', () => {
		const widthOf = vi.fn((hidden: number) => (hidden > 9 ? 40 : 20));
		const visible = fitTagsInLines({
			lineWidth: LINE,
			pillWidths: Array(14).fill(60),
			counterWidth: widthOf
		});
		// 4 pills of 60 per line; "+7" does not fit after 4 pills on line 2, it does after 3
		expect(visible).toBe(7);
		expect(widthOf).toHaveBeenLastCalledWith(7);
	});

	test('a pill wider than a line takes a whole line, truncated', () => {
		expect(fitTagsInLines({ lineWidth: LINE, pillWidths: [500, 60], counterWidth })).toBe(2);
		expect(fitTagsInLines({ lineWidth: LINE, pillWidths: [500, 500, 60], counterWidth })).toBe(1);
	});

	test('always shows the first tag', () => {
		expect(fitTagsInLines({ lineWidth: 10, pillWidths: [60, 60, 60], counterWidth })).toBe(1);
	});

	test('shows nothing without tags', () => {
		expect(fitTagsInLines({ lineWidth: LINE, pillWidths: [], counterWidth })).toBe(0);
	});

	test('shows every tag before the line is measured', () => {
		expect(fitTagsInLines({ lineWidth: 0, pillWidths: [60, 60, 60], counterWidth })).toBe(3);
	});
});
