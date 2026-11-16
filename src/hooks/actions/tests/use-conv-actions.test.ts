/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { FOLDERS, useTagStore } from '@zextras/carbonio-ui-commons';

import { setupHook } from '@test-setup';
import { populateConversationInEmailStore } from '__test__/generators/generateConversation';
import { useConvActions } from 'hooks/actions/use-conv-actions';
import { getConversationMessages } from 'store/emails/store';
import { NormalizedConversation } from 'types/conversations';

const FOLDER_ROUTE_PATH = '/folder/:folderId/*';

describe('useConvActions', () => {
	// A conversation with its first message in one folder and the second in another
	const populateConversationIn = async (
		firstFolderId: string,
		secondFolderId: string
	): Promise<NormalizedConversation> => {
		const { conversation } = populateConversationInEmailStore({
			conversationParams: { id: '270' },
			messageGeneratorParams: [
				{ id: '269', folderId: firstFolderId },
				{ id: '268', folderId: secondFolderId }
			]
		});
		// The store is updated through a task queue
		await vi.waitFor(() => expect(getConversationMessages(conversation.id)).toHaveLength(2));
		return conversation;
	};

	// A conversation marked as spam from the Inbox: its message is in Junk, the user's reply stayed in Sent
	const populateConversationInJunkAndSent = (): Promise<NormalizedConversation> =>
		populateConversationIn(FOLDERS.SENT, FOLDERS.SPAM);

	describe('the actions on the conversation follow the folder open in the route, not the first message of the conversation', () => {
		it('should offer "Not spam" and not "Mark as spam" in Junk', async () => {
			const conversation = await populateConversationInJunkAndSent();
			const { result } = setupHook(useConvActions, {
				initialProps: [{ conversation }],
				initialEntries: [`/folder/${FOLDERS.SPAM}`],
				path: FOLDER_ROUTE_PATH
			});

			expect(result.current.markAsNotSpamDescriptor.canExecute()).toBe(true);
			expect(result.current.markAsSpamDescriptor.canExecute()).toBe(false);
		});

		it('should offer "Delete permanently" in Junk', async () => {
			const conversation = await populateConversationInJunkAndSent();
			const { result } = setupHook(useConvActions, {
				initialProps: [{ conversation }],
				initialEntries: [`/folder/${FOLDERS.SPAM}`],
				path: FOLDER_ROUTE_PATH
			});

			expect(result.current.deletePermanentlyDescriptor.canExecute()).toBe(true);
		});

		it('should not offer "Delete permanently" in Sent', async () => {
			const conversation = await populateConversationInJunkAndSent();
			const { result } = setupHook(useConvActions, {
				initialProps: [{ conversation }],
				initialEntries: [`/folder/${FOLDERS.SENT}`],
				path: FOLDER_ROUTE_PATH
			});

			expect(result.current.deletePermanentlyDescriptor.canExecute()).toBe(false);
		});

		it('should offer "Mark as spam" and not "Not spam" in Sent', async () => {
			const conversation = await populateConversationInJunkAndSent();
			const { result } = setupHook(useConvActions, {
				initialProps: [{ conversation }],
				initialEntries: [`/folder/${FOLDERS.SENT}`],
				path: FOLDER_ROUTE_PATH
			});

			expect(result.current.markAsSpamDescriptor.canExecute()).toBe(true);
			expect(result.current.markAsNotSpamDescriptor.canExecute()).toBe(false);
		});

		it.each`
			openFolder | openFolderId    | canTag
			${'Junk'}  | ${FOLDERS.SPAM} | ${false}
			${'Sent'}  | ${FOLDERS.SENT} | ${true}
		`(
			'should let the user tag the conversation: $canTag in $openFolder',
			async ({ openFolderId, canTag }) => {
				useTagStore.setState({ tags: { '1': { id: '1', name: 'work', color: 3 } } });
				const conversation = await populateConversationInJunkAndSent();
				const { result } = setupHook(useConvActions, {
					initialProps: [{ conversation }],
					initialEntries: [`/folder/${openFolderId}`],
					path: FOLDER_ROUTE_PATH
				});

				const [tagAction] = result.current.applyTagDescriptor.items;
				expect(tagAction.canExecute()).toBe(canTag);
			}
		);

		it('should offer "Restore" and not "Delete" in Trash, for a conversation also in the Inbox', async () => {
			const conversation = await populateConversationIn(FOLDERS.INBOX, FOLDERS.TRASH);
			const { result } = setupHook(useConvActions, {
				initialProps: [{ conversation }],
				initialEntries: [`/folder/${FOLDERS.TRASH}`],
				path: FOLDER_ROUTE_PATH
			});

			expect(result.current.restoreFolderDescriptor.canExecute()).toBe(true);
			expect(result.current.moveToTrashDescriptor.canExecute()).toBe(false);
		});

		it('should not offer read or unread in Drafts, for a conversation also in Sent', async () => {
			const conversation = await populateConversationIn(FOLDERS.SENT, FOLDERS.DRAFTS);
			const { result } = setupHook(useConvActions, {
				initialProps: [{ conversation }],
				initialEntries: [`/folder/${FOLDERS.DRAFTS}`],
				path: FOLDER_ROUTE_PATH
			});

			expect(result.current.setAsReadDescriptor.canExecute()).toBe(false);
			expect(result.current.setAsUnreadDescriptor.canExecute()).toBe(false);
		});
	});
});
