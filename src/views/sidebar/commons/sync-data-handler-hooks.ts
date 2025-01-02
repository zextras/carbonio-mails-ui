/* eslint-disable @typescript-eslint/ban-ts-comment */
/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { useEffect, useRef, useState } from 'react';

import { useNotify, useRefresh } from '@zextras/carbonio-shell-ui';
import { filter, find, forEach, isEmpty, map, reduce, sortBy } from 'lodash';
import { StoreApi, UseBoundStore } from 'zustand';

import { useFolderStore } from '../../../carbonio-ui-commons/store/zustand/folder';
import { Tag } from '../../../carbonio-ui-commons/types/tags';
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
	handleModifiedMessagesInConversation,
	handleNotifyCreatedConversations,
	selectCurrentFolder,
	setSearchedInFolder
} from '../../../store/conversations-slice';
import { handleCreatedMessages, selectMessages } from '../../../store/messages-slice';
import {
	deleteConversationsFromConversationSlice,
	deleteConversationsFromSearch,
	deleteMessagesFromMessagesSlice,
	deleteMessagesFromSearch,
	prependMessagesToMessagesSlice,
	updateConversationsOnly,
	updateMessagesOnly
} from '../../../store/zustand/emails/store';
import {
	ConvMessage,
	FolderState,
	SoapConversation,
	SoapFolder,
	SoapIncompleteMessage,
	SoapLink
} from '../../../types';

type SoapNotify = {
	seq: number;
	created?: {
		m?: Array<SoapIncompleteMessage>;
		c?: Array<SoapConversation>;
		folder?: Array<SoapFolder>;
		link?: Array<SoapLink>;
		tag?: Array<Tag>;
	};
	modified?: {
		m?: Array<SoapIncompleteMessage>;
		c?: Array<SoapConversation>;
		folder?: Array<Partial<SoapFolder>>;
		link?: Array<Partial<SoapLink>>;
		tag?: Array<Partial<Tag>>;
		mbx: [
			{
				s: number;
			}
		];
	};
	deleted: Array<string>;
};
type HandleFoldersNotifyProps = {
	notifyList: Array<SoapNotify>;
	notify: SoapNotify;
	worker: Worker;
	store: UseBoundStore<StoreApi<FolderState>>;
};

function handleFoldersNotify({
	notifyList,
	notify,
	worker,
	store
}: HandleFoldersNotifyProps): void {
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

function processCreatedNotifications(notify: SoapNotify, dispatch: any, messagesState: any): void {
	const { c: createdConversations, m: createdMessages } = notify.created || {};

	if (createdConversations && createdMessages) {
		const conversations = map(createdConversations, (conversation) =>
			normalizeConversation({ c: conversation, m: createdMessages })
		);
		// @ts-ignore
		dispatch(handleNotifyCreatedConversations(conversations));
	}

	if (createdMessages) {
		const messages = map(createdMessages, (message) => normalizeMailMessageFromSoap(message));
		prependMessagesToMessagesSlice(messages);
		dispatch(handleCreatedMessages({ m: createdMessages }));
		dispatch(handleCreatedMessagesInConversation({ m: createdMessages }));
	}
}

function processModifiedNotifications(notify: SoapNotify, dispatch: any, messagesState: any): void {
	if (notify.modified?.c) {
		updateConversationsOnly(normalizeConversations(notify.modified.c));
	}

	if (notify.modified?.m) {
		const messages = map(notify.modified.m, (message) => normalizeMailMessageFromSoap(message));
		updateMessagesOnly(messages);

		const toUpdate = filter(messages, 'parent');
		if (!isEmpty(toUpdate)) {
			// @ts-ignore
			dispatch(handleModifiedMessagesInConversation(toUpdate));
		}

		const conversationToUpdate = filter(messages, 'conversation');
		if (!isEmpty(conversationToUpdate)) {
			const msgsReference = reduce(
				conversationToUpdate,
				(acc, msg) => {
					const existingMessage = messagesState?.[msg?.id];
					if (existingMessage) {
						acc.push({
							id: existingMessage.id,
							parent: existingMessage.parent,
							date: existingMessage.date,
							// @ts-ignore
							conversation: msg.conversation
						});
					}
					return acc;
				},
				[] as Array<ConvMessage>
			);
			// @ts-ignore
			dispatch(handleAddMessagesInConversation(msgsReference));
		}
	}
}

function processDeletedNotifications(notify: SoapNotify): void {
	deleteConversationsFromSearch(notify.deleted);
	deleteMessagesFromSearch(notify.deleted);
	deleteMessagesFromMessagesSlice(notify.deleted);
	deleteConversationsFromConversationSlice(notify.deleted);
}

type ProcessNotificationsProps = {
	notifyList: SoapNotify[];
	seq: number;
	setSeq: any;
	processedNotify: any;
	messagesState: any;
	dispatch: any;
};

function processNotifications({
	notifyList,
	seq,
	setSeq,
	processedNotify,
	dispatch,
	messagesState
}: ProcessNotificationsProps): void {
	forEach(sortBy(notifyList, 'seq'), (notify) => {
		if (
			processedNotify.current >= notify.seq ||
			isEmpty(notify) ||
			(notify.seq <= seq && !(seq > 1 && notify.seq === 1))
		) {
			return;
		}

		processedNotify.current = notify.seq;
		handleFoldersNotify({ notifyList, notify, worker: folderWorker, store: useFolderStore });

		if (notify.created) {
			processCreatedNotifications(notify, dispatch, messagesState);
		}

		if (notify.modified) {
			processModifiedNotifications(notify, dispatch, messagesState);
		}

		if (notify.deleted) {
			processDeletedNotifications(notify);
		}

		setSeq(notify.seq);
	});
}

export const useSyncDataHandler = (): void => {
	const notifyList = useNotify() as Array<SoapNotify>;
	const [seq, setSeq] = useState(-1);
	const dispatch = useAppDispatch();
	const [initialized, setInitialized] = useState(false);
	const currentFolder = useAppSelector(selectCurrentFolder);
	const messagesState = useAppSelector(selectMessages);
	const processedNotify = useRef(-1);

	const refresh = useRefresh();
	useEffect(() => {
		if (!isEmpty(refresh) && !initialized) {
			setInitialized(true);
		}
	}, [initialized, refresh]);

	useEffect(() => {
		forEach(notifyList, (notify) => {
			if (find(notify?.modified?.m, ['l', currentFolder])) {
				// handle modified messages in the current folder
				// is it still necessary to dispatch this action?
				dispatch(setSearchedInFolder({ [currentFolder]: 'incomplete' }));
			}
		});
	}, [currentFolder, dispatch, notifyList]);

	useEffect(() => {
		if (initialized && notifyList.length > 0) {
			processNotifications({ notifyList, seq, setSeq, processedNotify, messagesState, dispatch });
		}
	}, [dispatch, initialized, messagesState, notifyList, seq]);
};
