/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/* eslint-disable no-param-reassign */
import { useFolder } from '@zextras/carbonio-ui-commons';
import produce from 'immer';
import { pick } from 'lodash';
import { StoreApi, UseBoundStore } from 'zustand';

import { API_REQUEST_STATUS } from 'constants/index';
import { MAIL_HEADER_FIELDS } from 'normalizations/normalize-message';
import { MESSAGE_INDEX_SLICE_INITIAL_STATE } from 'store/emails/slices/messages/messages-slice';
import { POPULATED_ITEMS_SLICE_INITIAL_STATE } from 'store/emails/slices/populated-items/populated-items-slice';
import { IncompleteMessage, MailMessage } from 'types/messages';
import { EmailsStoreState, MessageIndexSliceState, SearchRequestStatus } from 'types/search';

function setMessagesInEmailStore(
	messages: Array<MailMessage | IncompleteMessage>,
	useEmailsStore: UseBoundStore<StoreApi<EmailsStoreState>>,
	more?: boolean
): void {
	useEmailsStore.setState(
		produce((store: EmailsStoreState) => {
			store.messageIndexSlice.messageListIndex = messages.map((message) => message.id);
			store.messageIndexSlice.status = API_REQUEST_STATUS.fulfilled;
			store.messageIndexSlice.offset = 0;
			store.messageIndexSlice.more = !!more;

			store.populatedItemsSlice.messages = messages.reduce(
				(acc, message) => {
					acc[message.id] = message;
					return acc;
				},
				{} as Record<string, MailMessage | IncompleteMessage>
			);
		})
	);
}

// a message of a list has no headers (_attrs), so these fields come with their default values,
// and only the sender and the first recipient (recip: 2) among its participants
const COMPLETE_MESSAGE_FIELDS: ReadonlyArray<keyof IncompleteMessage> = [
	...MAIL_HEADER_FIELDS,
	'isReadReceiptRequested',
	'html',
	'participants'
];

/**
 * Returns the index of a list searched again, keeping the items added while the search was in progress
 * that it may not return, compared with the items the list had when it was searched (`searchedListIndex`):
 * - the ones notified meanwhile, which are added at the top of the list;
 * - the ones of the pages loaded by scrolling meanwhile, which are appended after the searched ones.
 */
export function getRefreshedListIndex(
	currentListIndex: Array<string>,
	refreshedIds: Array<string>,
	searchedListIndex: Array<string>
): { listIndex: Array<string>; keepsLaterPages: boolean } {
	const searchedIds = new Set(searchedListIndex);
	const refreshedIdsSet = new Set(refreshedIds);
	const isAddedMeanwhile = (id: string): boolean =>
		!searchedIds.has(id) && !refreshedIdsSet.has(id);
	const firstSearchedPosition = currentListIndex.findIndex((id) => searchedIds.has(id));
	const lastSearchedPosition = currentListIndex.findLastIndex((id) => searchedIds.has(id));
	// without searched items left (e.g. the list was empty) no page can have been loaded by scrolling
	const notifiedIds = (
		firstSearchedPosition === -1
			? currentListIndex
			: currentListIndex.slice(0, firstSearchedPosition)
	).filter(isAddedMeanwhile);
	const laterPagesIds =
		lastSearchedPosition === -1
			? []
			: currentListIndex.slice(lastSearchedPosition + 1).filter(isAddedMeanwhile);
	return {
		listIndex: [...notifiedIds, ...refreshedIds, ...laterPagesIds],
		keepsLaterPages: laterPagesIds.length > 0
	};
}

// the messages of a list leave out what is loaded only when a message is opened (e.g. the body and the
// headers), so they are merged into the stored ones, which stay complete and keep what the open message shows
export function mergeListMessages(
	populatedMessages: Record<string, MailMessage | IncompleteMessage>,
	messages: Array<MailMessage | IncompleteMessage>
): void {
	messages.forEach((message) => {
		const existingMessage = populatedMessages[message.id];
		if (!existingMessage) {
			populatedMessages[message.id] = message;
			return;
		}
		populatedMessages[message.id] = existingMessage.isComplete
			? {
					...existingMessage,
					...message,
					...pick(existingMessage, COMPLETE_MESSAGE_FIELDS),
					isComplete: true
				}
			: { ...existingMessage, ...message };
	});
}

function refreshMessagesInEmailStore(
	messages: Array<MailMessage | IncompleteMessage>,
	more: boolean,
	searchedListIndex: Array<string>,
	useEmailsStore: UseBoundStore<StoreApi<EmailsStoreState>>
): void {
	useEmailsStore.setState(
		produce(({ messageIndexSlice, populatedItemsSlice }: EmailsStoreState) => {
			const refreshedIndex = getRefreshedListIndex(
				messageIndexSlice.messageListIndex,
				messages.map((message) => message.id),
				searchedListIndex
			);
			messageIndexSlice.messageListIndex = refreshedIndex.listIndex;
			messageIndexSlice.status = API_REQUEST_STATUS.fulfilled;
			messageIndexSlice.offset = 0;
			messageIndexSlice.more = refreshedIndex.keepsLaterPages ? messageIndexSlice.more : more;
			mergeListMessages(populatedItemsSlice.messages, messages);
		})
	);
}

function useMessagesIdsByFolder(
	folderId: string,
	useEmailsStore: UseBoundStore<StoreApi<EmailsStoreState>>
): Array<string> {
	const { populatedItemsSlice, messageIndexSlice } = useEmailsStore();
	const folder = useFolder(folderId);
	if (!folder) return [];

	const { messageListIndex } = messageIndexSlice;

	const wantedFolder = 'rid' in folder && folder?.rid ? `${folder.zid}:${folder.rid}` : folder.id;

	return messageListIndex.filter(
		(messageId) => populatedItemsSlice.messages[messageId]?.parent === wantedFolder
	);
}

function updateMessagesResultsLoadingStatus(
	status: SearchRequestStatus,
	useEmailsStore: UseBoundStore<StoreApi<EmailsStoreState>>
): void {
	useEmailsStore.setState(
		produce((state: MessageIndexSliceState) => {
			state.messageIndexSlice.status = status;
		})
	);
}

function resetMessagesAndPopulatedItems(
	useEmailsStore: UseBoundStore<StoreApi<EmailsStoreState>>
): void {
	useEmailsStore.setState(
		produce((state: EmailsStoreState) => {
			state.messageIndexSlice = MESSAGE_INDEX_SLICE_INITIAL_STATE;
			state.populatedItemsSlice = POPULATED_ITEMS_SLICE_INITIAL_STATE;
		})
	);
}

function appendMessagesToMessagesSlice(
	messages: Array<MailMessage | IncompleteMessage>,
	offset: number,
	more: boolean,
	useEmailsStore: UseBoundStore<StoreApi<EmailsStoreState>>
): void {
	const newMessageIds = messages.map((message) => message.id);
	useEmailsStore.setState(
		produce((state: EmailsStoreState) => {
			const uniqueMessageIds = new Set(state.messageIndexSlice.messageListIndex);
			newMessageIds.forEach((messageId) => {
				uniqueMessageIds.add(messageId);
			});
			state.messageIndexSlice.messageListIndex = Array.from(uniqueMessageIds);
			state.messageIndexSlice.offset = offset;
			state.messageIndexSlice.more = more;
			state.populatedItemsSlice.messages = messages.reduce((acc, msg) => {
				acc[msg.id] = msg;
				return acc;
			}, state.populatedItemsSlice.messages);
		})
	);
}

export const messageIndexSliceUtils = {
	setMessagesInEmailStore,
	refreshMessagesInEmailStore,
	updateMessagesResultsLoadingStatus,
	resetMessagesAndPopulatedItems,
	appendMessagesToMessagesSlice,
	useMessagesIdsByFolder
};
