/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import {
	FOLDERS,
	useNotify,
	useRefresh,
	updatePrimaryBadge,
	getTags
} from '@zextras/carbonio-shell-ui';
import React, { FC, useEffect, useState } from 'react';
import { isEmpty, map, keyBy, find, filter, forEach, sortBy, reduce } from 'lodash';
import {
	handleCreatedFolders,
	handleModifiedFolders,
	handleDeletedFolders,
	handleRefresh,
	selectFolder
} from '../../store/folders-slice';
import {
	handleNotifyCreatedConversations,
	handleNotifyModifiedConversations,
	handleNotifyDeletedConversations,
	handleModifiedMessagesInConversation,
	handleDeletedMessagesInConversation,
	setSearchedInFolder,
	selectCurrentFolder,
	handleCreatedMessagesInConversation,
	handleAddMessagesInConversation
} from '../../store/conversations-slice';
import {
	handleCreatedMessages,
	handleModifiedMessages,
	handleDeletedMessages,
	selectMessages
} from '../../store/messages-slice';
import { normalizeConversation } from '../../normalizations/normalize-conversation';
import { normalizeMailMessageFromSoap } from '../../normalizations/normalize-message';
import { extractFolders } from './utils';
import { MAILS_ROUTE } from '../../constants';
import {
	handleNotifyCreatedSearchConversations,
	handleNotifyDeletedSearchConversations,
	handleNotifyModifiedSearchConversations,
	handleAddMessagesInSearchConversation,
	handleCreatedMessagesInSearchConversation,
	handleDeletedMessagesInSearchConversation,
	handleModifiedMessagesInSearchConversation,
	handleDeletedSearchMessages
} from '../../store/searches-slice';
import { Conversation } from '../../types';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';

const InboxBadgeUpdater = (): null => {
	const folder = useAppSelector(selectFolder(FOLDERS.INBOX));
	useEffect(() => {
		updatePrimaryBadge(
			{
				show: folder.unreadCount > 0,
				count: folder.unreadCount,
				showCount: true
			},
			MAILS_ROUTE
		);
	}, [folder.unreadCount]);
	return null;
};

export const SyncDataHandler: FC = () => {
	const refresh = useRefresh();
	const notifyList = useNotify();
	const [seq, setSeq] = useState(-1);
	const dispatch = useAppDispatch();
	const [initialized, setInitialized] = useState(false);
	const currentFolder = useAppSelector(selectCurrentFolder);
	const messagesState = useAppSelector(selectMessages);

	useEffect(() => {
		if (!isEmpty(refresh) && !initialized) {
			// this also normalize folders so no need to normalize it later
			const extractedFolders = extractFolders([
				...(refresh?.folder?.[0]?.folder ?? []),
				...(refresh?.folder?.[0]?.link ?? [])
			]);
			dispatch(handleRefresh(extractedFolders));
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
						const tags = getTags();
						if (notify.created) {
							if (notify.created.folder || notify.created.link) {
								dispatch(
									handleCreatedFolders([
										...(notify.created.folder ?? []),
										...(notify.created.link ?? [])
									])
								);
							}
							if (notify.created.c && notify.created.m) {
								const conversations = map(notify.created.c, (i) =>
									normalizeConversation({ c: i, m: notify.created.m, tags })
								);
								// eslint-disable-next-line @typescript-eslint/ban-ts-comment
								// @ts-ignore
								dispatch(handleNotifyCreatedConversations(keyBy(conversations, 'id')));
								// eslint-disable-next-line @typescript-eslint/ban-ts-comment
								// @ts-ignore
								dispatch(handleNotifyCreatedSearchConversations(keyBy(conversations, 'id')));
							}
							if (notify.created.m) {
								dispatch(handleCreatedMessages({ m: notify.created.m }));
								dispatch(handleCreatedMessagesInConversation({ m: notify.created.m }));
								dispatch(handleCreatedMessagesInSearchConversation({ m: notify.created.m }));
							}
						}
						if (notify.modified) {
							if (notify.modified.folder || notify.modified.link) {
								dispatch(
									handleModifiedFolders([
										...(notify.modified.folder ?? []),
										...(notify.modified.link ?? [])
									])
								);
							}
							if (notify.modified.c) {
								const conversations = map(notify.modified.c, (i) =>
									normalizeConversation({ c: i, tags })
								);
								// eslint-disable-next-line @typescript-eslint/ban-ts-comment
								// @ts-ignore
								dispatch(handleNotifyModifiedConversations(keyBy(conversations, 'id')));
								// eslint-disable-next-line @typescript-eslint/ban-ts-comment
								// @ts-ignore
								dispatch(handleNotifyModifiedSearchConversations(keyBy(conversations, 'id')));
								//	dispatch(handleNotifyDeletedSearchConversations(keyBy(conversations, 'id')));
							}
							if (notify.modified.m) {
								const messages = map(notify.modified.m, (obj) =>
									normalizeMailMessageFromSoap(obj, false)
								);
								// eslint-disable-next-line @typescript-eslint/ban-ts-comment
								// @ts-ignore
								dispatch(handleModifiedMessages(messages));

								// the condition filters messages with parent property (the only ones we need to update)
								const toUpdate = filter(messages, 'parent');
								if (toUpdate?.length > 0) {
									// this function updates messages' parent in conversations. If parent never changes it does not need to be called
									// eslint-disable-next-line @typescript-eslint/ban-ts-comment
									// @ts-ignore
									dispatch(handleModifiedMessagesInConversation(toUpdate));
									// eslint-disable-next-line @typescript-eslint/ban-ts-comment
									// @ts-ignore
									dispatch(handleModifiedMessagesInSearchConversation(toUpdate));
								}
								// the condition filters messages with conversation property (the only ones we need to add to conversation)
								const conversationToUpdate = filter(messages, 'conversation');
								if (conversationToUpdate?.length > 0) {
									const msgsReference = reduce(
										conversationToUpdate,
										(
											acc: Array<{
												id: string;
												parent: string;
												date: number;
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
									// this function add messages' in conversations. If conversation never changes it does not need to be called
									// eslint-disable-next-line @typescript-eslint/ban-ts-comment
									// @ts-ignore
									dispatch(handleAddMessagesInConversation(msgsReference));
									// eslint-disable-next-line @typescript-eslint/ban-ts-comment
									// @ts-ignore
									dispatch(handleAddMessagesInSearchConversation(msgsReference));
								}
							}
						}
						if (notify.deleted) {
							dispatch(handleDeletedFolders(notify.deleted));
							dispatch(handleNotifyDeletedConversations(notify.deleted));
							dispatch(handleNotifyDeletedSearchConversations(notify.deleted));
							dispatch(handleDeletedMessages(notify.deleted));
							dispatch(handleDeletedSearchMessages(notify.deleted));
							dispatch(handleDeletedMessagesInConversation(notify.deleted));
							dispatch(handleDeletedMessagesInSearchConversation(notify.deleted));
						}
						setSeq(notify.seq);
					}
				});
			}
		}
	}, [dispatch, initialized, messagesState, notifyList, seq]);
	return <InboxBadgeUpdater />;
};
