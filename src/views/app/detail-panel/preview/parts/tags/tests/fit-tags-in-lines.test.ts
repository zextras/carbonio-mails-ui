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

	test('shows every tag when they fill exactly one line', () => {
		// 130 + 6 + 146 = 282
		expect(fitTagsInLines({ lineWidth: LINE, pillWidths: [130, 146], counterWidth })).toBe(2);
	});

	test('keeps the 18px line end free: a pill that would end inside it goes behind "+N"', () => {
		// 140 + 6 + 140 = 286 > 282: the second pill goes, "+1" takes its place
		expect(fitTagsInLines({ lineWidth: LINE, pillWidths: [140, 140], counterWidth })).toBe(1);
	});

	test('when the tags need more than one line, leaves room for "+N" on it', () => {
		// 130 + 6 + 130 = 266, + 6 + 20 for "+N" = 292 > 282: one pill and "+2"
		expect(fitTagsInLines({ lineWidth: LINE, pillWidths: [130, 130, 130], counterWidth })).toBe(1);
		// four pills: 258, + 6 + 20 = 284 > 282; three: 192 + 26 = 218, so three pills and "+2"
		expect(
			fitTagsInLines({ lineWidth: LINE, pillWidths: [60, 60, 60, 60, 60], counterWidth })
		).toBe(3);
	});

	test('measures "+N" for the number of tags it hides', () => {
		const widthOf = vi.fn((hidden: number) => (hidden > 9 ? 40 : 20));
		const visible = fitTagsInLines({
			lineWidth: LINE,
			pillWidths: Array(14).fill(60),
			counterWidth: widthOf
		});
		// 4 pills of 60 fit on the line (258); "+10" (40) does not fit after 4, nor after 3 (238 + 46)
		expect(visible).toBe(3);
		expect(widthOf).toHaveBeenLastCalledWith(11);
	});

	test('a first pill wider than the line is shown alone, truncated, with "+N"', () => {
		expect(fitTagsInLines({ lineWidth: LINE, pillWidths: [500, 60], counterWidth })).toBe(1);
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
