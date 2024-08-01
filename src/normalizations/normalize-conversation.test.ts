/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { normalizeConversation, normalizeConversationOld } from './normalize-conversation';
import { SoapConversation } from '../types';

describe('normalize conversation', () => {
	describe('normalizeConversationOld', () => {
		it('should return a conversation with undefined parent if no messages', () => {
			const soapConversation: SoapConversation = {
				d: 0,
				e: [],
				f: 'aaa',
				fr: 'bbb',
				id: 'ccc',
				m: [],
				n: 0,
				su: 'subject',
				tn: 'tn',
				u: 0
			};

			const normalized = normalizeConversationOld({ c: soapConversation, tags: {} });

			expect(normalized.parent).toBeUndefined();
		});

		it('should return a conversation with undefined even if it has messages', () => {
			const soapConversation: SoapConversation = {
				d: 0,
				e: [],
				f: 'aaa',
				fr: 'bbb',
				id: 'ccc',
				m: [
					{
						cid: 'ccc',
						d: 0,
						e: [],
						fr: 'asd',
						id: 'asd',
						l: 'parent folder',
						mp: [],
						s: 0,
						tn: 'asdsa',
						su: 'asdas'
					}
				],
				n: 0,
				su: 'subject',
				tn: 'tn',
				u: 0
			};

			const normalized = normalizeConversationOld({ c: soapConversation, tags: {} });

			expect(normalized.parent).toBeUndefined();
		});
	});

	describe('normalizeConversation', () => {
		it('should return a conversation with undefined parent if no messages', () => {
			const soapConversation: SoapConversation = {
				d: 0,
				e: [],
				f: 'aaa',
				fr: 'bbb',
				id: 'ccc',
				m: [],
				n: 0,
				su: 'subject',
				tn: 'tn',
				u: 0
			};

			const normalized = normalizeConversation({ c: soapConversation, tags: {} });

			expect(normalized.parent).toBeUndefined();
		});

		it('should return a conversation with parent equal to first message parent', () => {
			const soapConversation: SoapConversation = {
				d: 0,
				e: [],
				f: 'aaa',
				fr: 'bbb',
				id: 'ccc',
				m: [
					{
						cid: 'ccc',
						d: 0,
						e: [],
						fr: 'asd',
						id: '1',
						l: 'first parent',
						mp: [],
						s: 0,
						tn: 'asdsa',
						su: 'asdas'
					},
					{
						cid: 'ccc',
						d: 0,
						e: [],
						fr: 'asd',
						id: '2',
						l: 'second parent',
						mp: [],
						s: 0,
						tn: 'asdsa',
						su: 'asdas'
					}
				],
				n: 0,
				su: 'subject',
				tn: 'tn',
				u: 0
			};

			const normalized = normalizeConversation({ c: soapConversation, tags: {} });

			expect(normalized.parent).toBe('first parent');
		});
	});
});
