/* eslint-disable no-param-reassign */
/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { MutableRefObject, useEffect, useRef, useState } from 'react';

import { useNotify, useRefresh } from '@zextras/carbonio-shell-ui';
import { filter, find, forEach, isEmpty, map, sortBy } from 'lodash';
import { StoreApi, UseBoundStore } from 'zustand';

import { useFolderStore } from '../../../carbonio-ui-commons/store/zustand/folder';
import { Tag } from '../../../carbonio-ui-commons/types/tags';
import { folderWorker } from '../../../carbonio-ui-commons/worker';
import {
	mapToNormalizedConversation,
	normalizeConversations
} from '../../../normalizations/normalize-conversation';
import { normalizeMailMessageFromSoap } from '../../../normalizations/normalize-message';
import {
	deleteConversationsFromConversationSlice,
	deleteConversationsFromSearch,
	deleteMessagesFromMessagesSlice,
	deleteMessagesFromSearch,
	prependConversationsToConversationIndexSlice,
	prependMessagesToMessagesSlice,
	updateConversationsOnly,
	updateMessagesOnly
} from '../../../store/zustand/emails/store';
import {
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

function processCreatedNotifications(notify: SoapNotify): void {
	const { c: createdConversations, m: createdMessages } = notify.created || {};

	if (createdConversations && createdMessages) {
		const conversations = map(createdConversations, (conversation) =>
			mapToNormalizedConversation({ conversation, messages: createdMessages })
		);
		prependConversationsToConversationIndexSlice(conversations);
	}

	if (createdMessages) {
		const messages = map(createdMessages, (message) => normalizeMailMessageFromSoap(message));
		prependMessagesToMessagesSlice(messages);
		// dispatch(handleCreatedMessagesInConversation({ m: createdMessages }));
	}
}

function processModifiedNotifications(notify: SoapNotify): void {
	if (notify.modified?.c) {
		updateConversationsOnly(normalizeConversations(notify.modified.c));
	}

	if (notify.modified?.m) {
		const messages = map(notify.modified.m, (message) => normalizeMailMessageFromSoap(message));
		updateMessagesOnly(messages);

		const toUpdate = filter(messages, 'parent');
		if (!isEmpty(toUpdate)) {
			// dispatch(handleModifiedMessagesInConversation(toUpdate));
		}

		const conversationToUpdate = filter(messages, 'conversation');
		if (!isEmpty(conversationToUpdate)) {
			// const msgsReference = reduce(
			// conversationToUpdate,
			// (acc, msg) => {
			// const existingMessage = messagesState?.[msg?.id];
			// (existingMessage) {
			// 		acc.push({
			// 			id: existingMessage.id,
			// 			parent: existingMessage.parent,
			// 			date: existingMessage.date
			// 			// conversation: msg.conversation
			// 		});
			// 	}
			// 	return acc;
			// },
			// [] as Array<ConvMessage>
			// );
			// dispatch(handleAddMessagesInConversation(msgsReference));
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
	setSeq: (arg: number) => void;
	processedNotify: MutableRefObject<number>;
};

function processNotifications({
	notifyList,
	seq,
	setSeq,
	processedNotify
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
			processCreatedNotifications(notify);
		}

		if (notify.modified) {
			processModifiedNotifications(notify);
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
	const [initialized, setInitialized] = useState(false);
	const currentFolder = '2';
	// const currentFolder = useAppSelector(selectCurrentFolder);
	const processedNotify = useRef<number>(-1);

	const refresh = useRefresh();
	useEffect(() => {
		if (!isEmpty(refresh) && !initialized) {
			setInitialized(true);
		}
	}, [initialized, refresh]);

	useEffect(() => {
		forEach(notifyList, (notify) => {
			// TODO: CO-1725: is it still necessary to dispatch this action?
			if (find(notify?.modified?.m, ['l', currentFolder])) {
				// handle modified messages in the current folder
				// is it still necessary to dispatch this action?
				// dispatch(setSearchedInFolder({ [currentFolder]: 'incomplete' }));
			}
		});
	}, [currentFolder, notifyList]);

	useEffect(() => {
		if (initialized && notifyList.length > 0) {
			processNotifications({ notifyList, seq, setSeq, processedNotify });
		}
	}, [initialized, notifyList, seq]);
};
