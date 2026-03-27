/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { ParticipantRole } from '@zextras/carbonio-ui-commons';

import {
	generateCompleteMessageFromAPI,
	generateConversationFromAPI,
	generateSoapConversationMessage
} from '__test__/generators/api';
import {
	mapToNormalizedConversation,
	normalizeConversations,
	normalizePartialConversations
} from 'normalizations/normalize-conversation';
import { Participant } from 'types/participant';
import { SoapConversation } from 'types/soap/soap-conversation';

describe('Normalize conversation', () => {
	it('returns normalized conversation with all fields', () => {
		const soapConversation = generateConversationFromAPI({
			id: '1',
			d: 123456789,
			su: 'Subject',
			fr: 'Fragment',
			f: 'uaf!',
			n: 5,
			e: [{ a: 'test@test.com', p: 'personal name', t: 't' }],
			t: 'tag1,tag2',
			tn: 'tag1,tag2'
		});

		const normalizedConversation = mapToNormalizedConversation({ conversation: soapConversation });

		const expectedParticipants: Participant[] = [
			{
				address: 'test@test.com',
				email: 'test@test.com',
				fullName: 'personal name',
				name: 'test@test.com',
				type: ParticipantRole.TO
			}
		];
		expect(normalizedConversation).toEqual({
			id: '1',
			date: 123456789,
			subject: 'Subject',
			fragment: 'Fragment',
			read: false,
			hasAttachment: true,
			flagged: true,
			urgent: true,
			messagesInConversation: 5,
			participants: expectedParticipants,
			tags: ['tag1', 'tag2'],
			messageIds: []
		});
	});

	it('handles conversation without tags', () => {
		const soapConversation = generateConversationFromAPI({
			id: '1',
			d: 123456789,
			su: 'Subject',
			fr: 'Fragment',
			f: 'uaf!',
			n: 5,
			e: [{ a: 'a', p: 'name', t: 't' }]
		});

		const normalizedConversation = mapToNormalizedConversation({ conversation: soapConversation });

		expect(normalizedConversation.tags).toEqual(['nil:tag names']);
	});

	it('handles conversation with messages', () => {
		const messages = [
			generateCompleteMessageFromAPI({ id: 'msg1', cid: '1' }),
			generateCompleteMessageFromAPI({ id: 'msg2', cid: '1' })
		];
		const soapConversation = generateConversationFromAPI({
			id: '1',
			d: 123456789,
			su: 'Subject',
			fr: 'Fragment',
			f: 'uaf!',
			n: 5,
			e: [{ a: 'a', p: 'name', t: 't' }],
			m: messages
		});

		const normalizedConversation = mapToNormalizedConversation({
			conversation: soapConversation
		});

		expect(normalizedConversation.messageIds).toEqual(['msg1', 'msg2']);
	});

	it('normalizes multiple conversations', () => {
		const soapConversations: SoapConversation[] = [
			generateConversationFromAPI({ id: '1' }),
			generateConversationFromAPI({ id: '2' })
		];

		const normalizedConversations = normalizeConversations(soapConversations);

		expect(normalizedConversations).toHaveLength(2);
		expect(normalizedConversations[0].id).toBe('1');
		expect(normalizedConversations[1].id).toBe('2');
	});

	it('handles conversation without participants', () => {
		const soapConversation = generateConversationFromAPI({
			id: '1',
			d: 123456789,
			su: 'Subject',
			fr: 'Fragment',
			f: 'uaf!',
			n: 5
		});

		const normalizedConversation = mapToNormalizedConversation({ conversation: soapConversation });

		expect(normalizedConversation.participants).toEqual([]);
	});

	it('handles conversation with tag IDs from t and tn', () => {
		const soapConversation = generateConversationFromAPI({
			id: '1',
			d: 123456789,
			t: 'tag1,tag2',
			tn: 'tag1,tag2'
		});

		const normalizedConversation = mapToNormalizedConversation({ conversation: soapConversation });

		expect(normalizedConversation.tags).toEqual(['tag1', 'tag2']);
	});

	it('handles conversation where only tn is present', () => {
		const soapConversation = generateConversationFromAPI({
			id: '1',
			d: 123456789,
			tn: 'tag3,tag4'
		});

		const normalizedConversation = mapToNormalizedConversation({ conversation: soapConversation });

		expect(normalizedConversation.tags).toEqual(['nil:tag3', 'nil:tag4']);
	});

	it('handles conversation without t or tn', () => {
		// @ts-expect-error - intentionally omitting t and tn
		const soapConversation: SoapConversation = {
			id: '1',
			n: 0,
			u: 0,
			f: '',
			d: 0,
			m: [],
			e: [],
			su: '',
			fr: ''
		};

		const normalizedConversation = mapToNormalizedConversation({ conversation: soapConversation });

		expect(normalizedConversation).not.toHaveProperty('tags');
	});

	it('ensures tags property is omitted when undefined', () => {
		const soapConversation: SoapConversation = {
			id: '1',
			n: 0,
			u: 0,
			f: '',
			d: 0,
			m: [],
			e: [],
			su: '',
			fr: '',
			t: undefined,
			tn: null as unknown as string
		};

		const normalizedConversation = mapToNormalizedConversation({ conversation: soapConversation });

		expect(normalizedConversation.tags).toBeUndefined();
	});
});

describe('Normalize partial conversation', () => {
	it('returns normalized partial conversation with all fields', () => {
		const msg1 = generateSoapConversationMessage('msg1', '123');
		const msg2 = generateSoapConversationMessage('msg2', '123');
		const isFlagged = 'f';
		const isUrgent = '!';
		const hasAttachment = 'a';
		const partialConversation = {
			id: '123',
			n: 2,
			u: 1,
			f: `${isFlagged}${isUrgent}${hasAttachment}`,
			t: '1,2,3',
			tn: 'tag1,tag2,tag3',
			d: 123,
			m: [msg1, msg2],
			e: [
				{ a: 'user1@example.com', t: ParticipantRole.FROM, p: '' },
				{ a: 'user2@example.com', t: ParticipantRole.TO, p: '' }
			],
			su: 'Subject',
			fr: 'fragment'
		};

		const result = normalizePartialConversations([partialConversation])[0];
		expect(result).toEqual({
			id: '123',
			tags: ['1', '2', '3'],
			date: 123,
			messageIds: ['msg1', 'msg2'],
			participants: [
				expect.objectContaining({ email: 'user1@example.com', type: 'f' }),
				expect.objectContaining({ email: 'user2@example.com', type: 't' })
			],
			subject: 'Subject',
			fragment: 'fragment',
			read: true,
			hasAttachment: true,
			flagged: true,
			urgent: true,
			messagesInConversation: 2
		});
	});

	it('should omit fields when not defined', () => {
		const partialConversation = {
			id: '123'
		};
		const result = normalizePartialConversations([partialConversation])[0];
		expect(result).toEqual({
			id: '123'
		});
	});

	it('returns normalized conversation with the correct flags value if the f field is empty', () => {
		const msg1 = generateSoapConversationMessage('msg1', '123');
		const msg2 = generateSoapConversationMessage('msg2', '456');
		const partialConversation = {
			id: '123',
			n: 2,
			u: 1,
			f: '',
			t: '1,2,3',
			tn: 'tag1,tag2,tag3',
			d: 123,
			m: [msg1, msg2],
			e: [
				{ a: 'user1@example.com', t: ParticipantRole.FROM, p: '' },
				{ a: 'user2@example.com', t: ParticipantRole.TO, p: '' }
			],
			su: 'Subject',
			fr: 'fragment'
		};

		const result = normalizePartialConversations([partialConversation])[0];
		expect(result).toEqual(
			expect.objectContaining({
				read: true,
				hasAttachment: false,
				flagged: false,
				urgent: false
			})
		);
	});
});
