import { useTagStore } from '@zextras/carbonio-ui-commons';
/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { getTagIds } from 'normalizations/utils';

describe('getTagIds utility function', () => {
	beforeEach(() => {
		useTagStore.setState({
			tags: {
				1: { id: '1', name: 'tag1' },
				2: { id: '2', name: 'tag2' }
			}
		});
	});

	it('returns undefined when both t and tn are undefined', () => {
		expect(getTagIds(undefined, undefined)).toBeUndefined();
	});

	it('returns an empty array when both t and tn are empty strings', () => {
		expect(getTagIds('', '')).toEqual([]);
	});

	it('returns tag ids from t when t is not nil', () => {
		expect(getTagIds('tag1,tag2', undefined)).toEqual(['tag1', 'tag2']);
	});

	it('returns tag ids from tn when tn is not nil', () => {
		expect(getTagIds(undefined, 'tag1,tag2')).toEqual(['1', '2']);
	});

	it('returns tag ids from tn with unknown tags', () => {
		expect(getTagIds(undefined, 'tag1,unknown')).toEqual(['1', 'nil:unknown']);
	});

	it('returns undefined when both t and tn are nil', () => {
		// @ts-expect-error Testing with null even though it's not in the function's type
		expect(getTagIds(null, null)).toBeUndefined();
	});

	it('returns tag ids from t when tn is nil', () => {
		// @ts-expect-error Testing with null even though it's not in the function's type
		expect(getTagIds('tag1,tag2', null)).toEqual(['tag1', 'tag2']);
	});

	it('returns tag ids from tn when t is nil', () => {
		// @ts-expect-error Testing with null even though it's not in the function's type
		expect(getTagIds(null, 'tag1,tag2')).toEqual(['1', '2']);
	});
});
