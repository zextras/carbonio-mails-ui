/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { FOLDERS } from '../../carbonio-ui-commons/test/mocks/carbonio-shell-ui-constants';
import { haveReadReceipt } from '../normalize-message';

describe('Have Read Receipt', () => {
	test('returns false if participants and flag undefined', () => {
		expect(haveReadReceipt(undefined, undefined, FOLDERS.INBOX)).toBe(false);
	});

	test('returns false if no participants notify and flag not NIL than accept to not show notify', () => {
		expect(
			haveReadReceipt(
				[
					{ a: 'test@domain.com', d: 'User Name', p: 'Title', t: 'f' },
					{ a: 'test1@domain.com', d: 'User Name1', p: 'Title', t: 't' }
				],
				'u',
				FOLDERS.INBOX
			)
		).toBe(false);
	});

	test('returns false if the flags is NOT NIL and it has “n“ inside flag than accept to not show notify', () => {
		expect(
			haveReadReceipt(
				[
					{ a: 'test@domain.com', d: 'User Name', p: 'Title', t: 'n' },
					{ a: 'test1@domain.com', d: 'User Name1', p: 'Title', t: 't' }
				],
				'un',
				FOLDERS.INBOX
			)
		).toBe(false);
	});

	test('returns true if the flags is NIL accept to show notify', () => {
		expect(
			haveReadReceipt(
				[
					{ a: 'test@domain.com', d: 'User Name', p: 'Title', t: 'n' },
					{ a: 'test1@domain.com', d: 'User Name1', p: 'Title', t: 't' }
				],
				undefined,
				FOLDERS.INBOX
			)
		).toBe(true);
	});

	test('returns true if the flags is NOT NIL and it doesn’t have “n“ inside flag than accept to show notify', () => {
		expect(
			haveReadReceipt(
				[
					{ a: 'test@domain.com', d: 'User Name', p: 'Title', t: 'n' },
					{ a: 'test1@domain.com', d: 'User Name1', p: 'Title', t: 't' }
				],
				'u',
				FOLDERS.INBOX
			)
		).toBe(true);
	});
});
