/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import {
	FOLDERS,
	store,
	useNotify,
	useRefresh,
	updatePrimaryBadge
} from '@zextras/carbonio-shell-ui';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { combineReducers } from '@reduxjs/toolkit';
import { isEmpty, map, keyBy, find, filter, forEach, sortBy, reduce } from 'lodash';
import { useTranslation } from 'react-i18next';
import {
	handleCreatedFolders,
	handleModifiedFolders,
	handleDeletedFolders,
	folderSliceReducer,
	handleRefresh,
	selectFolder
} from '../../store/folders-slice';
import { editorSliceReducer } from '../../store/editor-slice';
import {
	conversationsSliceReducer,
	handleNotifyCreatedConversations,
	handleNotifyModifiedConversations,
	handleNotifyDeletedConversations,
	handleModifiedMessagesInConversation,
	handleDeletedMessagesInConversation,
	setSearchedInFolder,
	selectCurrentFolder,
	handleCreatedMessagesInConversation,
	selectConversations,
	handleAddMessagesInConversation
} from '../../store/conversations-slice';
import {
	messageSliceReducer,
	handleCreatedMessages,
	handleModifiedMessages,
	handleDeletedMessages,
	selectMessages
} from '../../store/messages-slice';
import { normalizeConversation } from '../../normalizations/normalize-conversation';
import { normalizeMailMessageFromSoap } from '../../normalizations/normalize-message';
import { extractFolders } from './utils';
import { MAILS_ROUTE } from '../../constants';

const InboxBadgeUpdater = () => {
	const folder = useSelector(selectFolder(FOLDERS.INBOX));
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

export const SyncDataHandler = () => {
	const [t] = useTranslation();
	const refresh = useRefresh();
	const notifyList = useNotify();
	const [seq, setSeq] = useState(-1);
	const dispatch = useDispatch();
	const [initialized, setInitialized] = useState(false);
	const currentFolder = useSelector(selectCurrentFolder);
	const messagesState = useSelector(selectMessages);

	useEffect(() => {
		if (!isEmpty(refresh) && !initialized) {
			store.setReducer(
				combineReducers({
					folders: folderSliceReducer,
					conversations: conversationsSliceReducer,
					editors: editorSliceReducer,
					messages: messageSliceReducer
				})
			);
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
				forEach(sortBy(notifyList, 'seq'), (notify) => {
					if (!isEmpty(notify) && (notify.seq > seq || notify.seq === '1')) {
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
									normalizeConversation(i, notify.created.m)
								);
								dispatch(handleNotifyCreatedConversations(keyBy(conversations, 'id')));
							}
							if (notify.created.m) {
								dispatch(handleCreatedMessages({ m: notify.created.m }));
								dispatch(handleCreatedMessagesInConversation({ m: notify.created.m }));
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
								const conversations = map(notify.modified.c, normalizeConversation);
								dispatch(handleNotifyModifiedConversations(keyBy(conversations, 'id')));
							}
							if (notify.modified.m) {
								const messages = map(notify.modified.m, (obj) =>
									normalizeMailMessageFromSoap(obj, false)
								);
								dispatch(handleModifiedMessages(messages));

								// the condition filters messages with parent property (the only ones we need to update)
								const toUpdate = filter(messages, 'parent');
								if (toUpdate?.length > 0) {
									// this function updates messages' parent in conversations. If parent never changes it does not need to be called
									dispatch(handleModifiedMessagesInConversation(toUpdate));
								}
								// the condition filters messages with conversation property (the only ones we need to add to conversation)
								const conversationToUpdate = filter(messages, 'conversation');
								if (conversationToUpdate?.length > 0) {
									const msgsReference = reduce(
										conversationToUpdate,
										(acc, msg) => {
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
									dispatch(handleAddMessagesInConversation(msgsReference));
								}
							}
						}
						if (notify.deleted) {
							dispatch(handleDeletedFolders(notify.deleted?.id?.split?.(',')));
							dispatch(handleNotifyDeletedConversations(notify.deleted?.id?.split?.(',')));
							dispatch(handleDeletedMessages(notify.deleted?.id?.split?.(',')));
							dispatch(handleDeletedMessagesInConversation(notify.deleted?.id?.split?.(',')));
						}
						setSeq(notify.seq);
					}
				});
			}
		}
	}, [dispatch, initialized, messagesState, notifyList, seq, t]);
	return <InboxBadgeUpdater />;
};
