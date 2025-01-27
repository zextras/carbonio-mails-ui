/* eslint-disable no-param-reassign */
/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { MutableRefObject, useEffect, useRef, useState } from 'react';

import { useNotify, useRefresh } from '@zextras/carbonio-shell-ui';
import { flatten, forEach, isEmpty, map, sortBy } from 'lodash';
import { StoreApi, UseBoundStore } from 'zustand';

import { useFolderStore } from '../../../carbonio-ui-commons/store/zustand/folder';
import { useTagStore } from '../../../carbonio-ui-commons/store/zustand/tags';
import { Tag, TagState } from '../../../carbonio-ui-commons/types/tags';
import { folderWorker, tagsWorker } from '../../../carbonio-ui-commons/worker';
import {
	mapToNormalizedConversation,
	normalizeConversations
} from '../../../normalizations/normalize-conversation';
import { normalizeMailMessageFromSoap } from '../../../normalizations/normalize-message';
import {
	handleNotifyConversationsCreated,
	handleNotifyMessagesCreated,
	handleNotifyConversationsModified,
	handleNotifyMessagesModified,
	handleNotifyDeleted,
	updateMessages
} from '../../../store/emails/store';
import {
	FolderState,
	IncompleteMessage,
	SoapConversation,
	SoapFolder,
	SoapIncompleteMessage,
	SoapLink
} from '../../../types';

export function extractConvMessage(
	createdConversations: Array<SoapConversation>
): Array<IncompleteMessage> {
	const soapMessages = flatten(map(createdConversations, (conversation) => conversation.m));
	return soapMessages?.length > 0
		? map(soapMessages, (message) => normalizeMailMessageFromSoap(message))
		: [];
}

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

type HandleTagsNotifyProps = {
	notify: SoapNotify;
	worker: Worker;
	store: UseBoundStore<StoreApi<TagState>>;
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

function handleTagsNotify({ notify, worker, store }: HandleTagsNotifyProps): void {
	worker.postMessage({
		op: 'notify',
		notify,
		state: store.getState().tags
	});
}

function processCreatedNotifications(notify: SoapNotify): void {
	const { c: createdConversations, m: createdMessages } = notify.created || {};

	if (createdConversations && createdMessages) {
		const conversations = map(createdConversations, (conversation) =>
			mapToNormalizedConversation({ conversation, messages: createdMessages })
		);
		handleNotifyConversationsCreated(conversations);
		const convMessages = extractConvMessage(createdConversations);
		updateMessages(convMessages);
	}

	if (createdMessages) {
		const messages = map(createdMessages, (message) => normalizeMailMessageFromSoap(message));
		handleNotifyMessagesCreated(messages);
	}
}

function processModifiedNotifications(notify: SoapNotify): void {
	if (notify.modified?.c) {
		const updatedConversations = normalizeConversations(notify.modified.c);
		handleNotifyConversationsModified(updatedConversations);

		const convMessages = extractConvMessage(notify.modified.c);
		updateMessages(convMessages);
	}

	if (notify.modified?.m) {
		const messages = map(notify.modified.m, (message) => normalizeMailMessageFromSoap(message));
		handleNotifyMessagesModified(messages);
	}
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
		handleTagsNotify({ notify, worker: tagsWorker, store: useTagStore });

		if (notify.created) {
			processCreatedNotifications(notify);
		}

		if (notify.modified) {
			processModifiedNotifications(notify);
		}

		if (notify.deleted) {
			handleNotifyDeleted(notify.deleted);
		}

		setSeq(notify.seq);
	});
}

export const useSyncDataHandler = (): void => {
	const notifyList = useNotify() as Array<SoapNotify>;
	const [seq, setSeq] = useState(-1);
	const [initialized, setInitialized] = useState(false);
	const processedNotify = useRef<number>(-1);

	const refresh = useRefresh();
	useEffect(() => {
		if (!isEmpty(refresh) && !initialized) {
			setInitialized(true);
		}
	}, [initialized, refresh]);

	useEffect(() => {
		if (initialized && notifyList.length > 0) {
			processNotifications({ notifyList, seq, setSeq, processedNotify });
		}
	}, [initialized, notifyList, seq]);
};
