/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useEffect, useState } from 'react';

import {
	FOLDERS,
	getTags,
	updatePrimaryBadge,
	useNotify,
	useRefresh
} from '@zextras/carbonio-shell-ui';
import { filter, find, forEach, isEmpty, keyBy, map, reduce, sortBy } from 'lodash';

import { useFolder } from '../../carbonio-ui-commons/store/zustand/folder';
import { MAILS_ROUTE } from '../../constants';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { normalizeConversation } from '../../normalizations/normalize-conversation';
import { normalizeMailMessageFromSoap } from '../../normalizations/normalize-message';
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
} from '../../store/conversations-slice';
import {
	handleCreatedMessages,
	handleDeletedMessages,
	handleModifiedMessages,
	selectMessages
} from '../../store/messages-slice';
import {
	handleAddMessagesInSearchConversation,
	handleCreatedMessagesInSearchConversation,
	handleDeletedMessagesInSearchConversation,
	handleDeletedSearchMessages,
	handleModifiedMessagesInSearchConversation,
	handleNotifyCreatedSearchConversations,
	handleNotifyDeletedSearchConversations,
	handleNotifyModifiedSearchConversations
} from '../../store/searches-slice';
import type { Conversation } from '../../types';

const InboxBadgeUpdater = (): null => {
	const inbox = useFolder(FOLDERS.INBOX);
	useEffect(() => {
		if (inbox)
			updatePrimaryBadge(
				{
					show: !!inbox.u,
					count: inbox.u,
					showCount: true
				},
				MAILS_ROUTE
			);
	}, [inbox]);
	return null;
};

const tags = getTags();

export const SyncDataHandler: FC = () => {
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
						if (notify.created) {
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
							}
							if (notify.modified.m) {
								const messages = map(notify.modified.m, (obj) => normalizeMailMessageFromSoap(obj));
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
									// eslint-disable-next-line @typescript-eslint/ban-ts-comment
									// @ts-ignore
									dispatch(handleAddMessagesInSearchConversation(msgsReference));
								}
							}
						}
						if (notify.deleted) {
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
