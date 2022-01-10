/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { store, useNotify, useRefresh } from '@zextras/zapp-shell';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { combineReducers } from '@reduxjs/toolkit';
import { isEmpty, map, keyBy, find, filter } from 'lodash';
import { useTranslation } from 'react-i18next';
import {
	handleCreatedFolders,
	handleModifiedFolders,
	handleDeletedFolders,
	folderSliceReducer,
	handleRefresh
} from '../../store/folders-slice';
import { editorSliceRecucer } from '../../store/editor-slice';
import {
	conversationsSliceReducer,
	handleNotifyCreatedConversations,
	handleNotifyModifiedConversations,
	handleNotifyDeletedConversations,
	handleModifiedMessagesInConversation,
	handleDeletedMessagesInConversation,
	setSearchedInFolder,
	selectCurrentFolder,
	handleCreatedMessagesInConversation
} from '../../store/conversations-slice';
import {
	messageSliceReducer,
	handleCreatedMessages,
	handleModifiedMessages,
	handleDeletedMessages
} from '../../store/messages-slice';
import { normalizeConversation } from '../../normalizations/normalize-conversation';
import { normalizeMailMessageFromSoap } from '../../normalizations/normalize-message';
import { extractFolders } from './utils';

export const SyncDataHandler = () => {
	const [t] = useTranslation();
	const refresh = useRefresh();
	const notify = useNotify();
	const dispatch = useDispatch();
	const [initialized, setInitialized] = useState(false);
	const currentFolder = useSelector(selectCurrentFolder);

	useEffect(() => {
		if (!isEmpty(refresh) && !initialized) {
			store.setReducer(
				combineReducers({
					folders: folderSliceReducer,
					conversations: conversationsSliceReducer,
					editors: editorSliceRecucer,
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
		// this intercept all changes made from different folders towards the current one, it triggers a search request if it finds at least one item which affect currentFolder
		if (find(notify?.modified?.m, ['l', currentFolder])) {
			dispatch(setSearchedInFolder({ [currentFolder]: 'incomplete' }));
		}
	}, [currentFolder, dispatch, notify?.modified?.m]);

	useEffect(() => {
		if (initialized) {
			if (notify.created) {
				if (notify.created.folder || notify.created.link) {
					dispatch(
						handleCreatedFolders([...(notify.created.folder ?? []), ...(notify.created.link ?? [])])
					);
				}
				if (notify.created.c && notify.created.m) {
					const conversations = map(notify.created.c, (i) =>
						normalizeConversation(i, notify.created.m)
					);
					dispatch(handleNotifyCreatedConversations(keyBy(conversations, 'id')));
				}
				if (notify.created.m) {
					dispatch(handleCreatedMessages({ m: notify.created.m, t }));
					dispatch(handleCreatedMessagesInConversation({ m: notify.created.m, t }));
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

					// the condition filters message with parent property (the only ones we need to update)
					const toUpdate = filter(messages, 'parent');
					if (toUpdate?.length > 0) {
						// this function updates messages' parent in conversations. If parent never changes it does not need to be called
						dispatch(handleModifiedMessagesInConversation(toUpdate));
					}
				}
			}
			if (notify.deleted) {
				dispatch(handleDeletedFolders(notify.deleted?.id?.split?.(',')));
				dispatch(handleNotifyDeletedConversations(notify.deleted?.id?.split?.(',')));
				dispatch(handleDeletedMessages(notify.deleted?.id?.split?.(',')));
				dispatch(handleDeletedMessagesInConversation(notify.deleted?.id?.split?.(',')));
			}
		}
	}, [dispatch, initialized, notify.created, notify.deleted, notify.modified, t]);

	return null;
};
