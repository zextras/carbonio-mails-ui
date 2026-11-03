/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import {
	findDefaultValue,
	firstRowTest,
	mergeRowsByKind
} from 'views/settings/filters/parts/utils';

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

	describe('mergeRowsByKind', () => {
		it('joins the rows of the same kind and keeps the others apart', () => {
			const rows = [
				{ headerTest: [{ header: 'subject', value: 'a' }] },
				{ bodyTest: [{ value: 'b' }] },
				{ headerTest: [{ header: 'subject', value: 'c' }], condition: 'anyof' }
			];
			expect(mergeRowsByKind(rows, 'condition')).toEqual({
				headerTest: [
					{ header: 'subject', value: 'a' },
					{ header: 'subject', value: 'c' }
				],
				bodyTest: [{ value: 'b' }]
			});
		});

		it('drops the row id when a kind is joined', () => {
			const rows = [
				{ actionTag: [{ tagName: 't1' }], id: '1' },
				{ actionTag: [{ tagName: 't2' }], id: '2' }
			];
			expect(mergeRowsByKind(rows, 'id')).toEqual({
				actionTag: [{ tagName: 't1' }, { tagName: 't2' }]
			});
		});
	});

	describe('firstRowTest', () => {
		it('returns the first test of the row, or undefined without tests', () => {
			expect(firstRowTest({ meTest: [{ header: 'to', negative: true }] })).toEqual({
				header: 'to',
				negative: true
			});
			expect(firstRowTest(undefined)).toBeUndefined();
		});
	});
});
