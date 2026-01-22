/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { INJECTED_DESCRIPTION_DECORATOR } from '../../../../../constants';
import { showFragment } from '../utils/utils';

describe('Utils', () => {
	describe('show fragment', () => {
		test('return true if fragment is available', () => {
			const result = showFragment('test fragment');

			expect(result).toBe(true);
		});

		test('return false if fragment is undefined', () => {
			const result = showFragment(undefined);

			expect(result).toBe(false);
		});

		test('return false if fragment is empty', () => {
			const result = showFragment('');

			expect(result).toBe(false);
		});

		test('return false if fragment contains injected decorator', () => {
			const result = showFragment(INJECTED_DESCRIPTION_DECORATOR);

			expect(result).toBe(false);
		});
	});
});
