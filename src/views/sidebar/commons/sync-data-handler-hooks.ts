/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useEffect, useState } from 'react';

import { getTags, SoapNotify, useNotify, useRefresh } from '@zextras/carbonio-shell-ui';
import { filter, find, forEach, isEmpty, keyBy, map, reduce, sortBy } from 'lodash';
import { StoreApi, UseBoundStore } from 'zustand';

import { useFolderStore } from '../../../carbonio-ui-commons/store/zustand/folder';
import { folderWorker } from '../../../carbonio-ui-commons/worker';
import { useAppDispatch, useAppSelector } from '../../../hooks/redux';
import {
	normalizeConversation,
	normalizeConversations
} from '../../../normalizations/normalize-conversation';
import { normalizeMailMessageFromSoap } from '../../../normalizations/normalize-message';
import {
	handleAddMessagesInConversation,
	handleCreatedMessagesInConversation,
	handleDeletedMessagesInConversation,
	handleModifiedMessagesInConversation,
	handleNotifyCreatedConversations,
	handleNotifyDeletedConversations,
	handleNotifyModifiedConversations,
	selectCurrentFolder,
	setSearchedInFolder
} from '../../../store/conversations-slice';
import {
	handleCreatedMessages,
	handleDeletedMessages,
	handleModifiedMessages,
	selectMessages
} from '../../../store/messages-slice';
import {
	deleteConversations,
	deleteMessages,
	updateConversationsOnly,
	updateMessagesOnly
} from '../../../store/zustand/search/store';
import type { Conversation, FolderState } from '../../../types';

function handleFoldersNotify(
	notifyList: Array<SoapNotify>,
	notify: SoapNotify,
	worker: Worker,
	store: UseBoundStore<StoreApi<FolderState>>
): void {
	const isNotifyRelatedToFolders =
		!isEmpty(notifyList) &&
		(notify?.created?.folder ||
			notify?.modified?.folder ||
			notify.deleted ||
			notify?.created?.link ||
			notify?.modified?.link);

	if (isNotifyRelatedToFolders) {
		worker.postMessage({
			op: 'notify',
			notify,
			state: store.getState().folders
		});
	}
}

export const useSyncDataHandler = (): void => {
	const notifyList = useNotify();
	const [seq, setSeq] = useState(-1);
	const dispatch = useAppDispatch();
	const [initialized, setInitialized] = useState(false);
	const currentFolder = useAppSelector(selectCurrentFolder);
	const messagesState = useAppSelector(selectMessages);

	const refresh = useRefresh();
	useEffect(() => {
		if (!isEmpty(refresh) && !initialized) {
			setInitialized(true);
		}
	}, [dispatch, initialized, refresh]);

	useEffect(() => {
		forEach(notifyList, (notify) => {
			// this intercept all changes made from different folders towards the current one, it triggers a search request if it finds at least one item which affect currentFolder
			if (find(notify?.modified?.m, ['l', currentFolder])) {
				dispatch(setSearchedInFolder({ [currentFolder]: 'incomplete' }));
			}
		});
	}, [currentFolder, dispatch, notifyList]);
	useEffect(() => {
		if (initialized) {
			if (notifyList.length > 0) {
				forEach(sortBy(notifyList, 'seq'), (notify: any) => {
					if (!isEmpty(notify) && (notify.seq > seq || (seq > 1 && notify.seq === 1))) {
						handleFoldersNotify(notifyList, notify, folderWorker, useFolderStore);

						const tags = getTags();
						if (notify.created) {
							if (notify.created.c && notify.created.m) {
								const conversations = map(notify.created.c, (i) =>
									normalizeConversation({ c: i, m: notify.created.m, tags })
								);
								// eslint-disable-next-line @typescript-eslint/ban-ts-comment
								// @ts-ignore
								dispatch(handleNotifyCreatedConversations(conversations));
							}
							if (notify.created.m) {
								dispatch(handleCreatedMessages({ m: notify.created.m }));
								dispatch(handleCreatedMessagesInConversation({ m: notify.created.m }));
							}
						}
						if (notify.modified) {
							const soapModifiedConversations = notify.modified.c;
							if (soapModifiedConversations) {
								const conversations = map(soapModifiedConversations, (i) =>
									normalizeConversation({ c: i, tags })
								);
								// eslint-disable-next-line @typescript-eslint/ban-ts-comment
								// @ts-ignore
								dispatch(handleNotifyModifiedConversations(keyBy(conversations, 'id')));
								updateConversationsOnly(normalizeConversations(soapModifiedConversations, tags));
							}
							const soapModifiedMessages = notify.modified.m;
							if (soapModifiedMessages) {
								const messages = map(soapModifiedMessages, (obj) =>
									normalizeMailMessageFromSoap(obj)
								);
								// eslint-disable-next-line @typescript-eslint/ban-ts-comment
								// @ts-ignore
								dispatch(handleModifiedMessages(messages));
								updateMessagesOnly(messages);

								// the condition filters messages with parent property (the only ones we need to update)
								const toUpdate = filter(messages, 'parent');
								if (toUpdate?.length > 0) {
									// this function updates messages' parent in conversations. If parent never changes it does not need to be called
									// eslint-disable-next-line @typescript-eslint/ban-ts-comment
									// @ts-ignore
									dispatch(handleModifiedMessagesInConversation(toUpdate));
								}
								// the condition filters messages with conversation property (the only ones we need to add to conversation)
								const conversationToUpdate = filter(messages, 'conversation');
								if (conversationToUpdate?.length > 0) {
									const msgsReference = reduce(
										conversationToUpdate,
										(
											acc: Array<{
												id: string;
												parent: string | undefined;
												date: number | undefined;
												conversation: Conversation;
											}>,
											msg: any
										) => {
											if (messagesState?.[msg?.id]) {
												return [
													...acc,
													{
														id: messagesState?.[msg?.id].id,
														parent: messagesState?.[msg?.id].parent,
														date: messagesState?.[msg?.id].date,
														conversation: msg.conversation
													}
												];
											}
											return acc;
										},
										[]
									);
									// eslint-disable-next-line @typescript-eslint/ban-ts-comment
									// @ts-ignore
									dispatch(handleAddMessagesInConversation(msgsReference));
								}
							}
						}
						if (notify.deleted) {
							deleteConversations(notify.deleted);
							deleteMessages(notify.deleted);
							dispatch(handleNotifyDeletedConversations(notify.deleted));
							dispatch(handleDeletedMessages(notify.deleted));
							dispatch(handleDeletedMessagesInConversation(notify.deleted));
						}
						setSeq(notify.seq);
					}
				});
			}
		}
	}, [dispatch, initialized, messagesState, notifyList, seq]);
};
