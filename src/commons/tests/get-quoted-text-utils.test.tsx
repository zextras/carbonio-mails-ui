/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { trim } from '../get-quoted-text-util';

describe('Get Quoted Test Utils', () => {
	describe('trim', () => {
		it('should remove only edge spaces', () => {
			const text = ' My word ';
			expect(trim(text)).toBe('My word');
		});
	});
});
