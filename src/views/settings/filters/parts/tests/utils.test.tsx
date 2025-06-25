/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { findDefaultValue } from 'views/settings/filters/parts/utils';

type OptionalFlag = {
	flagName?: string;
};
type ComplexType = {
	label: string;
	value: { actionFlag: Array<OptionalFlag> };
};
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

		// This test just documents the current behavior, but I don't think it's desired
		it('should return first option even when no exact match', () => {
			const options: Array<ComplexType> = [
				{ label: 'label 1', value: { actionFlag: [{ flagName: '1' }] } },
				{ label: 'label 2', value: { actionFlag: [{ flagName: '2' }] } }
			];
			expect(findDefaultValue(options, { actionFlag: [{}] })).toBe(options[0]);
		});
	});
});
