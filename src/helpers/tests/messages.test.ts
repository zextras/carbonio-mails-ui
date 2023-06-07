/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { generateConversation } from '../../tests/generators/generateConversation';
import { generateMessage } from '../../tests/generators/generateMessage';
import { isConversation, isSingleMessageConversation } from '../messages';

describe('Messages helpers', () => {
	describe('isConversation', () => {
		test('returns false when an undefined is passed as parameter', () => {
			expect(
				isConversation(
					// The undefined parameter is passed on purpose
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment
					// @ts-ignore
					undefined
				)
			).toBe(false);
		});

		test('returns false when a message is passed as parameter', () => {
			const msg = generateMessage({});
			expect(isConversation(msg)).toBe(false);
		});

		test('returns true when a conversation is passed as parameter', () => {
			const conv = generateConversation({});
			expect(isConversation(conv)).toBe(true);
		});

		test('returns true when a conversation with only one message is passed as parameter', () => {
			const conv = generateConversation({ messageGenerationCount: 1 });
			expect(isConversation(conv)).toBe(true);
		});
	});

	describe('isSingleMessageConversation', () => {
		test('returns false when an undefined is passed as parameter', () => {
			expect(
				isSingleMessageConversation(
					// The undefined parameter is passed on purpose
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment
					// @ts-ignore
					undefined
				)
			).toBe(false);
		});

		test('returns false when a message is passed as parameter', () => {
			const msg = generateMessage({});
			expect(isSingleMessageConversation(msg)).toBe(false);
		});

		test('returns false when a conversation with 2 messages is passed as parameter', () => {
			const conv = generateConversation({ messageGenerationCount: 2 });
			expect(isSingleMessageConversation(conv)).toBe(false);
		});

		test('returns false when a conversation with only one message is passed as parameter', () => {
			const conv = generateConversation({ messageGenerationCount: 1 });
			expect(isSingleMessageConversation(conv)).toBe(true);
		});
	});
});
