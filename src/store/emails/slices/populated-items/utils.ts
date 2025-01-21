/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/* eslint-disable no-param-reassign */

import { ErrorSoapBodyResponse } from '@zextras/carbonio-shell-ui';
import produce from 'immer';
import { filter, forEach, includes, merge } from 'lodash';
import { UseBoundStore, StoreApi } from 'zustand';

import { RemoveAttachmentsResponse } from '../../../../api/delete-all-attachments-soap-api';
import { FOLDERS } from '../../../../carbonio-ui-commons/constants/folders';
import { useFolder } from '../../../../carbonio-ui-commons/store/zustand/folder';
import { CONVACTIONS } from '../../../../commons/utilities';
import { normalizeMailMessageFromSoap } from '../../../../normalizations/normalize-message';
import {
	MailMessage,
	IncompleteMessage,
	EmailsStoreState,
	NormalizedConversation,
	SearchRequestStatus,
	type ConvActionResponse,
	MsgActionParameters,
	ConvActionParameters
} from '../../../../types';

function useConversationMessages(
	conversationId: string,
	useEmailsStore: UseBoundStore<StoreApi<EmailsStoreState>>
): Array<MailMessage | IncompleteMessage> {
	const messages: Array<MailMessage | IncompleteMessage> = [];
	useEmailsStore(({ populatedItemsSlice }: EmailsStoreState) =>
		populatedItemsSlice.conversations[conversationId].messages.forEach((message) => {
			if (populatedItemsSlice.messages[message.id])
				messages.push(populatedItemsSlice.messages[message.id]);
		})
	);
	return messages;
}

function updateConversations(
	updatedConversations: Array<NormalizedConversation>,
	useEmailsStore: UseBoundStore<StoreApi<EmailsStoreState>>
): void {
	useEmailsStore.setState(
		produce(({ populatedItemsSlice }: EmailsStoreState) => {
			updatedConversations.forEach((conversation) => {
				if (populatedItemsSlice.conversations[conversation.id]) {
					populatedItemsSlice.conversations[conversation.id] = {
						...merge(populatedItemsSlice.conversations[conversation.id], conversation),
						tags: conversation.tags
					};
				} else {
					populatedItemsSlice.conversations[conversation.id] = conversation;
				}
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
				populatedItemsSlice.messages[message.id] = {
					...merge(existingMessage, message),
					participants: message.participants
				};
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
	return useEmailsStore(({ populatedItemsSlice }: EmailsStoreState) =>
		ids
			.map((id) => populatedItemsSlice.messages[id])
			.filter((message): message is IncompleteMessage | MailMessage => !!message)
	);
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
	return wantedMessageIds
		.map((id) => populatedItemsSlice.messages[id])
		.filter((message): message is IncompleteMessage | MailMessage => !!message);
}

function useConversationsByIds(
	ids: Array<string>,
	useEmailsStore: UseBoundStore<StoreApi<EmailsStoreState>>
): Array<NormalizedConversation> {
	return useEmailsStore(({ populatedItemsSlice }: EmailsStoreState) =>
		filter(populatedItemsSlice.conversations, (conversation) => includes(ids, conversation.id))
	);
}

export function deleteMessagesFromConversation(ids: Array<string>, state: EmailsStoreState): void {
	forEach(state.populatedItemsSlice.conversations, (conversation) => {
		state.populatedItemsSlice.conversations[conversation.id].messages = filter(
			conversation.messages,
			(message) => !ids.includes(message.id)
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
					const normalizeMsg = normalizeMailMessageFromSoap(response.m[0], true);
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
							populatedItemsSlice.conversations[id].flagged = true;
						}
						if (convActionParams.operation === CONVACTIONS.UNFLAG) {
							populatedItemsSlice.conversations[id].flagged = false;
						}
						if (convActionParams.operation === CONVACTIONS.MARK_READ) {
							populatedItemsSlice.conversations[id].read = true;
						}
						if (convActionParams.operation === CONVACTIONS.MARK_UNREAD) {
							populatedItemsSlice.conversations[id].read = false;
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
	useMessagesByIds,
	useConversationsByIds,
	deleteMessagesFromConversation,
	useMessagesByFolder,
	handleDeleteAttachments,
	handleConvActionResponse,
	optimisticallyHandleConvActions
};
