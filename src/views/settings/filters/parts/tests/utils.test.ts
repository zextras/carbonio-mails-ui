/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { findDefaultValue } from '../utils';

describe('Utils', () => {
	describe('findDefaultValue', () => {
		it('returns default value', () => {
			const items = [
				{ label: 'A', value: '1' },
				{ label: 'B', value: '2' }
			];
			expect(findDefaultValue(items, '1')).toBe(items[0]);
		});

		it('returns undefined when no match', () => {
			const items = [
				{ label: 'A', value: '1' },
				{ label: 'B', value: '2' }
			];
			expect(findDefaultValue(items, '3')).toBeUndefined();
		});

		it('returns match when complex object', () => {
			const items = [
				{ label: 'A', value: { test: 'a' } },
				{ label: 'B', value: { test: 'b' } }
			];
			expect(findDefaultValue(items, { test: 'a' })).toEqual({ label: 'A', value: { test: 'a' } });
		});

		it('returns undefined when no match and complex object', () => {
			const items = [
				{ label: 'A', value: { test: 'a' } },
				{ label: 'B', value: { test: 'b' } }
			];
			expect(findDefaultValue(items, { test: 'c' })).toBeUndefined();
		});

		it('returns undefined when target undefined', () => {
			const items = [
				{ label: 'A', value: { test: 'a' } },
				{ label: 'B', value: { test: 'b' } }
			];
			expect(findDefaultValue(items, undefined)).toBeUndefined();
		});
	});
});
