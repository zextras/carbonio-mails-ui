/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { FOLDER_VIEW } from '../../carbonio-ui-commons/constants';
import { getFolder, getLinksArray } from '../../carbonio-ui-commons/store/zustand/folder';
import { FOLDERS } from '../../carbonio-ui-commons/test/mocks/carbonio-shell-ui-constants';
import { populateFoldersStore } from '../../carbonio-ui-commons/test/mocks/store/folders';
import { getMocksContext } from '../../carbonio-ui-commons/test/mocks/utils/mocks-context';
import { FOLDERS_DESCRIPTORS } from '../../tests/constants';
import { generateConversation } from '../../tests/generators/generateConversation';
import { generateMessage } from '../../tests/generators/generateMessage';
import {
	getConversationMostRecentMessage,
	getParentFolderId,
	isConversation,
	isSingleMessageConversation
} from '../messages';

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
			const conv = generateConversation({ messagesGenerationCount: 1 });
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
			const conv = generateConversation({ messagesGenerationCount: 2 });
			expect(isSingleMessageConversation(conv)).toBe(false);
		});

		test('returns false when a conversation with only one message is passed as parameter', () => {
			const conv = generateConversation({ messagesGenerationCount: 1 });
			expect(isSingleMessageConversation(conv)).toBe(true);
		});
	});

	describe('getConversationMostRecentMessage', () => {
		const conversation = generateConversation({
			messages: [
				generateMessage({
					id: '10',
					folderId: FOLDERS_DESCRIPTORS.INBOX.id,
					receiveDate: Date.UTC(2024, 2, 29, 12, 7, 3)
				}),
				generateMessage({
					id: '20',
					folderId: FOLDERS_DESCRIPTORS.SENT.id,
					isSentByMe: true,
					receiveDate: Date.UTC(2024, 2, 29, 14, 10, 8)
				}),
				generateMessage({
					id: '50',
					folderId: FOLDERS_DESCRIPTORS.DRAFTS.id,
					isDraft: true,
					receiveDate: Date.UTC(2024, 2, 29, 14, 33, 11)
				}),
				generateMessage({
					id: '30',
					folderId: FOLDERS_DESCRIPTORS.INBOX.id,
					receiveDate: Date.UTC(2024, 2, 29, 15, 11, 23)
				}),
				generateMessage({
					id: '40',
					folderId: FOLDERS_DESCRIPTORS.DRAFTS.id,
					isDraft: true,
					receiveDate: Date.UTC(2024, 2, 29, 17, 43, 11)
				})
			]
		});

		it('should return the most recent message', () => {
			const message = getConversationMostRecentMessage(conversation);
			expect(message?.id).toEqual('40');
		});

		it('should return the most recent draft', () => {
			const message = getConversationMostRecentMessage(conversation, { type: 'draft' });
			expect(message?.id).toEqual('40');
		});

		it('should return the most recent sent message', () => {
			const message = getConversationMostRecentMessage(conversation, { type: 'sent' });
			expect(message?.id).toEqual('20');
		});

		it('should return the most recent received message', () => {
			const message = getConversationMostRecentMessage(conversation, { type: 'received' });
			expect(message?.id).toEqual('30');
		});
	});
});

describe('getParentFolderId', () => {
	test('if the parameter is falsy null is returned', () => {
		expect(
			getParentFolderId(
				// Testing the case with a falsy parameter
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				null
			)
		).toBeNull();
		expect(
			getParentFolderId(
				// Testing the case with a falsy parameter
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				undefined
			)
		).toBeNull();
		expect(
			getParentFolderId(
				// Testing the case with a falsy parameter
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				false
			)
		).toBeNull();
	});

	test('if the parameter is a message with the parent set to 12345 then 12345 is returned', () => {
		populateFoldersStore();
		const msg = generateMessage({ folderId: '12345' });
		expect(getParentFolderId(msg)).toBe('12345');
	});

	test('if the parameter is a message of a shared account folder the shared folder id is returned', () => {
		populateFoldersStore();
		const sharedAccountIdentity = getMocksContext().identities.sendAs[0].identity;
		const sharedAccountInbox = getFolder(`${sharedAccountIdentity.id}:${FOLDERS.INBOX}`);
		const msg = generateMessage({ folderId: sharedAccountInbox?.id });
		expect(getParentFolderId(msg)).toBe(sharedAccountInbox?.id);
	});

	test('if the parameter is a message of a linked folder the folder id is returned', () => {
		populateFoldersStore();
		const links = getLinksArray(FOLDER_VIEW.message);
		const linkFolder = links?.[0];
		const msg = generateMessage({ folderId: linkFolder.id });
		expect(getParentFolderId(msg)).toBe(linkFolder.id);
	});

	test('if the parameter is a message with a parent which is not a user account folder, shared account folder, linked folder then null is returned', () => {
		populateFoldersStore();
		const msg = generateMessage({ folderId: 'supercalifragilisticexpialidocious:42' });
		expect(getParentFolderId(msg)).toBeNull();
	});
});
