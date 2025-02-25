/* eslint-disable no-param-reassign */
/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { MutableRefObject, useEffect, useRef, useState } from 'react';

import { SoapNotify, useNotify, useRefresh } from '@zextras/carbonio-shell-ui';
import { flatten, forEach, isEmpty, map, sortBy } from 'lodash';

import { HandleFoldersNotifyProps, HandleTagsNotifyProps } from './types';
import { useFolderStore } from '../../../carbonio-ui-commons/store/zustand/folder';
import { useTagStore } from '../../../carbonio-ui-commons/store/zustand/tags';
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
import { IncompleteMessage, SoapConversation, SoapIncompleteMessage } from '../../../types';

export function extractConvMessage(
	createdConversations: Array<SoapConversation>
): Array<IncompleteMessage> {
	return flatten(createdConversations.map((conversation) => conversation.m || [])).map((message) =>
		normalizeMailMessageFromSoap(message)
	);
}

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
			notify?.deleted ||
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
	const newConversations = createdConversations as Array<SoapConversation>;
	const newMessages = createdMessages as Array<SoapIncompleteMessage>;
	// in case of created, we have SoapConversation
	if (createdConversations && createdMessages) {
		const conversations = map(newConversations, (conversation) =>
			mapToNormalizedConversation({ conversation, messages: newMessages })
		);
		handleNotifyConversationsCreated(conversations);
		const convMessages = extractConvMessage(newConversations);
		updateMessages(convMessages);
	}

	if (newMessages) {
		const messages = map(newMessages, (message) => normalizeMailMessageFromSoap(message));
		handleNotifyMessagesCreated(messages);
	}
}

function processModifiedNotifications(notify: SoapNotify): void {
	// TODO: check me, at runtime we do not receive a SoapConversation
	const modifiedConversations = notify.modified?.c as Array<SoapConversation>;
	if (modifiedConversations) {
		const updatedConversations = normalizeConversations(modifiedConversations);
		handleNotifyConversationsModified(updatedConversations);

		const convMessages = extractConvMessage(modifiedConversations);
		updateMessages(convMessages);
	}

	const modifiedMessages = notify.modified?.m as Array<SoapIncompleteMessage>;
	if (modifiedMessages) {
		const messages = map(modifiedMessages, (message) => normalizeMailMessageFromSoap(message));
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

		const deletedIds = notify.deleted;
		if (deletedIds) {
			const idsToDelete = deletedIds;
			handleNotifyDeleted(idsToDelete);
		}

		setSeq(notify.seq);
	});
}

export const useSyncDataHandler = (): void => {
	const notifyList = useNotify() as unknown as Array<SoapNotify>;
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
