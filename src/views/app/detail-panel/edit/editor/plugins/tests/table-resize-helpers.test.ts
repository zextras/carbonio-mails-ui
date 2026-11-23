/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { scaleSizes, withTableWidth } from '../table-resize-helpers';

describe('scaleSizes', () => {
	it('scales every size by the same ratio so that they add up to the total', () => {
		expect(scaleSizes([80, 160], 360, 40)).toEqual([120, 240]);
	});

	it('holds a size at the minimum when the ratio would make it smaller', () => {
		expect(scaleSizes([80, 160], 90, 40)).toEqual([40, 60]);
	});

	it('does not go below the minimum of every size, whatever the total', () => {
		expect(scaleSizes([150, 150], -500, 40)).toEqual([40, 40]);
	});

	it('scales a size so large that multiplying it first would overflow', () => {
		expect(scaleSizes([1e308, 1], 1000, 40)).toEqual([1000, 40]);
	});

	it.each([
		['add up to nothing', [0, 0], 100],
		['include an infinite size', [Number.POSITIVE_INFINITY, 160], 100],
		['include a size that is not a number', [Number.NaN, 160], 100],
		['are scaled to a total that is not a finite number', [80, 160], Number.POSITIVE_INFINITY]
	])('does not scale sizes that %s', (_case, sizes, total) => {
		expect(scaleSizes(sizes, total, 40)).toBeNull();
	});
});

describe('withTableWidth', () => {
	it('replaces the width and the layout of the table and keeps the other declarations', () => {
		expect(withTableWidth('width: 100%; border: 1px solid red; table-layout: auto', 360)).toBe(
			'border: 1px solid red;width: 360px;table-layout: fixed;'
		);
	});

	it('keeps a declaration whose value holds a quoted semicolon as a single declaration', () => {
		const style = withTableWidth('background-image: url("a;width:1px"); width: 10px', 360);

		expect(style).toBe('background-image: url("a;width:1px");width: 360px;table-layout: fixed;');
	});
});
