/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/* eslint-disable no-param-reassign */

import { ErrorSoapBodyResponse } from '@zextras/carbonio-shell-ui';
import { FOLDERS, useFolder } from '@zextras/carbonio-ui-commons';
import produce from 'immer';
import { filter, forEach, keyBy, merge } from 'lodash';
import { StoreApi, UseBoundStore } from 'zustand';

import { RemoveAttachmentsResponse } from 'api/delete-all-attachments-soap-api';
import { CONVACTIONS } from 'commons/utilities';
import { API_REQUEST_STATUS } from 'constants/index';
import { normalizeCompleteMailMessageFromSoap } from 'normalizations/normalize-message';
import { ConvActionParameters, NormalizedConversation } from 'types/conversations';
import { IncompleteMessage, MailMessage } from 'types/messages';
import { EmailsStoreState, SearchRequestStatus } from 'types/search';
import { ConvActionResponse } from 'types/soap/conv-action';
import { MsgActionParameters } from 'types/soap/msg-action';

function useConversationMessages(
	conversationId: string,
	useEmailsStore: UseBoundStore<StoreApi<EmailsStoreState>>
): Array<MailMessage | IncompleteMessage> {
	return useEmailsStore(({ populatedItemsSlice }) => {
		const conversation = populatedItemsSlice.conversations[conversationId];

		if (!conversation?.messageIds) {
			return [];
		}

		return conversation.messageIds
			.map((messageId) => populatedItemsSlice.messages[messageId])
			.filter(Boolean);
	});
}

function getConversationMessages(
	conversationId: string,
	useEmailsStore: UseBoundStore<StoreApi<EmailsStoreState>>
): Array<MailMessage | IncompleteMessage> {
	const { populatedItemsSlice } = useEmailsStore.getState();
	const conversation = populatedItemsSlice.conversations[conversationId];

	if (!conversation?.messageIds) {
		return [];
	}

	return conversation.messageIds
		.map((messageId) => populatedItemsSlice.messages[messageId])
		.filter(Boolean);
}

function getConversationMessagesParents(
	conversationId: string,
	useEmailsStore: UseBoundStore<StoreApi<EmailsStoreState>>
): Array<string> {
	const { populatedItemsSlice } = useEmailsStore.getState();
	const conversation = populatedItemsSlice.conversations[conversationId];

	if (!conversation?.messageIds) {
		return [];
	}

	return conversation.messageIds
		.map((messageId) => populatedItemsSlice.messages[messageId]?.parent)
		.filter(Boolean);
}

// TODO: check this implementation. We found out the merge was handling data incorrectly.
//  we decided to just override the data and not handle any complex logic in the store
//  Check also updateMessages method as it may have the same issues
function updateConversations(
	updatedConversations: Array<NormalizedConversation>,
	useEmailsStore: UseBoundStore<StoreApi<EmailsStoreState>>
): void {
	useEmailsStore.setState(
		produce(({ populatedItemsSlice }: EmailsStoreState) => {
			updatedConversations.forEach((conversation) => {
				populatedItemsSlice.conversations[conversation.id] = {
					...populatedItemsSlice.conversations[conversation.id],
					...conversation
				};
			});
		})
	);
}

function updateMessages(
	messages: Array<MailMessage>,
	useEmailsStore: UseBoundStore<StoreApi<EmailsStoreState>>
): void {
	useEmailsStore.setState(
		produce(({ populatedItemsSlice }: EmailsStoreState) => {
			messages.forEach((message) => {
				if (!message?.id) return;

				const existingMessage = populatedItemsSlice.messages?.[message.id] || {};

				if (message.isComplete) {
					populatedItemsSlice.messages[message.id] = message; // Replace
				} else {
					populatedItemsSlice.messages[message.id] = merge(existingMessage, message); // Merge
				}

				// Update the status if the message is complete
				if (populatedItemsSlice.messages[message.id].isComplete) {
					populatedItemsSlice.messagesStatus[message.id] = API_REQUEST_STATUS.fulfilled;
				}
			});
		})
	);
}

function updateConversationStatus(
	conversationId: string,
	status: SearchRequestStatus,
	useEmailsStore: UseBoundStore<StoreApi<EmailsStoreState>>
): void {
	useEmailsStore.setState(
		produce(({ populatedItemsSlice }: EmailsStoreState) => {
			populatedItemsSlice.conversationsStatus[conversationId] = status;
		})
	);
}

function updateMessageStatus(
	messageId: string,
	status: SearchRequestStatus,
	useEmailsStore: UseBoundStore<StoreApi<EmailsStoreState>>
): void {
	useEmailsStore.setState(
		produce(({ populatedItemsSlice }: EmailsStoreState) => {
			populatedItemsSlice.messagesStatus[messageId] = status;
		})
	);
}

function useMessagesByIds(
	ids: Array<string>,
	useEmailsStore: UseBoundStore<StoreApi<EmailsStoreState>>
): Array<IncompleteMessage | MailMessage> {
	return useEmailsStore(({ populatedItemsSlice }: EmailsStoreState) => {
		const messagesById = keyBy(populatedItemsSlice.messages, 'id');
		return ids.map((id) => messagesById[id]).filter(Boolean);
	});
}

function useMessagesByFolder(
	folderId: string,
	useEmailsStore: UseBoundStore<StoreApi<EmailsStoreState>>
): Array<MailMessage | IncompleteMessage> {
	const { populatedItemsSlice, messageIndexSlice } = useEmailsStore();
	const folder = useFolder(folderId);
	if (!folder) return [];

	const { messageListIndex } = messageIndexSlice;

	const wantedFolder = 'rid' in folder && folder?.rid ? `${folder.zid}:${folder.rid}` : folder.id;

	const wantedMessageIds = messageListIndex.filter(
		(messageId) => populatedItemsSlice.messages[messageId]?.parent === wantedFolder
	);

	return wantedMessageIds.map((id) => populatedItemsSlice.messages[id]).filter(Boolean);
}

function useConversationsByIds(
	ids: Array<string>,
	useEmailsStore: UseBoundStore<StoreApi<EmailsStoreState>>
): Array<NormalizedConversation> {
	return useEmailsStore(({ populatedItemsSlice }: EmailsStoreState) => {
		const conversationsById = keyBy(populatedItemsSlice.conversations, 'id');
		return ids.map((id) => conversationsById[id]).filter(Boolean);
	});
}

export function deleteMessagesFromConversation(ids: Array<string>, state: EmailsStoreState): void {
	forEach(state.populatedItemsSlice.conversations, (conversation) => {
		state.populatedItemsSlice.conversations[conversation.id].messageIds = filter(
			conversation.messageIds,
			(messageId) => !ids.includes(messageId)
		);
	});
}

function optimisticallyHandleMessageActions({
	ids,
	operation: op,
	useEmailsStore,
	parent,
	tagName
}: MsgActionParameters & {
	useEmailsStore: UseBoundStore<StoreApi<EmailsStoreState>>;
}): void {
	useEmailsStore.setState(
		produce(({ populatedItemsSlice }: EmailsStoreState) => {
			ids.forEach((id) => {
				const message = populatedItemsSlice.messages[id];
				if (message) {
					if (op.includes(CONVACTIONS.FLAG)) {
						message.flagged = !op.startsWith('!');
					} else if (op.includes(CONVACTIONS.MARK_READ)) {
						message.read = !op.startsWith('!');
					} else if (op === CONVACTIONS.TRASH) {
						message.parent = FOLDERS.TRASH;
					} else if (op === CONVACTIONS.DELETE) {
						delete populatedItemsSlice.messages[id];
					} else if (op === CONVACTIONS.MOVE) {
						message.parent = parent ?? FOLDERS.INBOX;
					} else if (op === CONVACTIONS.MARK_SPAM) {
						message.parent = FOLDERS.SPAM;
					} else if (op === CONVACTIONS.MARK_NOT_SPAM) {
						message.parent = FOLDERS.INBOX;
					} else if (op === CONVACTIONS.TAG && tagName) {
						message.tags = [...message.tags, tagName];
					} else if (op === CONVACTIONS.UNTAG && tagName) {
						message.tags = filter(message.tags, (tag) => tag !== tagName);
					}
				}
			});
		})
	);
}

function handleDeleteAttachments(
	response: RemoveAttachmentsResponse | ErrorSoapBodyResponse,
	useEmailsStore: UseBoundStore<StoreApi<EmailsStoreState>>
): void {
	useEmailsStore.setState(
		produce(({ populatedItemsSlice }: EmailsStoreState) => {
			if ('Fault' in response) return;
			if (!response) return;
			const messageIds = response.m?.map((m) => m.id);
			messageIds.forEach((id) => {
				const message = populatedItemsSlice.messages[id];
				if (message) {
					const normalizeMsg = normalizeCompleteMailMessageFromSoap(
						response.m[0],
						message.html ?? true
					);
					populatedItemsSlice.messages[id] = {
						...message,
						parts: normalizeMsg.parts
					};
				}
			});
		})
	);
}

function handleConvActionResponse(
	convActionParams: ConvActionParameters,
	response: ConvActionResponse | ErrorSoapBodyResponse,
	useEmailsStore: UseBoundStore<StoreApi<EmailsStoreState>>
): void {
	useEmailsStore.setState(
		produce(
			({ populatedItemsSlice, conversationIndexSlice, searchIndexSlice }: EmailsStoreState) => {
				if (!response || 'Fault' in response) {
					forEach(convActionParams.ids, (id: string) => {
						if (!populatedItemsSlice.conversations?.[id]) return;
						if (convActionParams.operation === CONVACTIONS.FLAG) {
							populatedItemsSlice.conversations[id].flagged = false;
						}
						if (convActionParams.operation === CONVACTIONS.UNFLAG) {
							populatedItemsSlice.conversations[id].flagged = true;
						}
						if (convActionParams.operation === CONVACTIONS.MARK_READ) {
							populatedItemsSlice.conversations[id].read = false;
						}
						if (convActionParams.operation === CONVACTIONS.MARK_UNREAD) {
							populatedItemsSlice.conversations[id].read = true;
						}
					});
					return;
				}
				if (!response.action) return;
				const { id, op } = response.action;
				if (op === CONVACTIONS.DELETE) {
					id.split(',').forEach((convId) => {
						delete populatedItemsSlice.conversations[convId];
						conversationIndexSlice.conversationListIndex = filter(
							conversationIndexSlice.conversationListIndex,
							(conv) => conv !== convId
						);
						searchIndexSlice.conversationListIndex = searchIndexSlice.conversationListIndex.filter(
							(conv) => conv !== convId
						);
					});
				}
			}
		)
	);
}

function optimisticallyHandleConvActions({
	ids,
	operation,
	useEmailsStore
}: MsgActionParameters & {
	useEmailsStore: UseBoundStore<StoreApi<EmailsStoreState>>;
}): void {
	useEmailsStore.setState(
		produce(({ populatedItemsSlice }: EmailsStoreState) => {
			forEach(ids, (id: string) => {
				if (populatedItemsSlice.conversations?.[id]) {
					if (operation.includes('flag')) {
						populatedItemsSlice.conversations[id].flagged = !operation.startsWith('!');
					} else if (operation.includes('read')) {
						populatedItemsSlice.conversations[id].read = !operation.startsWith('!');
					}
				}
			});
		})
	);
}

export const populatedItemsSliceUtils = {
	optimisticallyHandleMessageActions,
	updateConversations,
	updateMessageStatus,
	updateConversationStatus,
	updateMessages,
	useConversationMessages,
	getConversationMessages,
	getConversationMessagesParents,
	useMessagesByIds,
	useConversationsByIds,
	deleteMessagesFromConversation,
	useMessagesByFolder,
	handleDeleteAttachments,
	handleConvActionResponse,
	optimisticallyHandleConvActions
};
