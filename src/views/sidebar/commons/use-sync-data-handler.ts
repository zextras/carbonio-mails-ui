/* eslint-disable no-param-reassign */
/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { MutableRefObject, useEffect, useRef, useState } from 'react';

import { useNotify, useRefresh } from '@zextras/carbonio-shell-ui';
import { flatten, forEach, isEmpty, map, sortBy } from 'lodash';

import { HandleFoldersNotifyProps, HandleTagsNotifyProps, SoapNotify } from './types';
import { useFolderStore } from '../../../carbonio-ui-commons/store/zustand/folder';
import { useTagStore } from '../../../carbonio-ui-commons/store/zustand/tags';
import { folderWorker, tagsWorker } from '../../../carbonio-ui-commons/worker';
import { mapToNormalizedConversation } from '../../../normalizations/normalize-conversation';
import { normalizeMailMessageFromSoap } from '../../../normalizations/normalize-message';
import {
	handleNotifyDeleted,
	createOrUpdateConversations,
	createOrUpdateMessages
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
			notify?.deleted?.length > 0 ||
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

		const { created, modified } = notify;
		// TODO: what if we just collect conversation and messages (modified and created) and just call updateMessages and updateConversatioss?

		const allReceivedMessages = [] as Array<SoapIncompleteMessage>;
		const allReceivedConversations = [] as Array<SoapConversation>;
		const { c: createdConversations, m: createdMessages } = created || {};
		createdMessages && allReceivedMessages.push(...createdMessages);
		createdConversations && allReceivedConversations.push(...createdConversations);

		const { c: modifiedConversations, m: modifiedMessages } = modified || {};
		modifiedMessages && allReceivedMessages.push(...modifiedMessages);
		modifiedConversations && allReceivedConversations.push(...modifiedConversations);

		const messagesToStore = map(allReceivedMessages, (message) =>
			normalizeMailMessageFromSoap(message)
		);
		const conversationsWithMessageIdsToStore = map(allReceivedConversations, (conversation) =>
			mapToNormalizedConversation({ conversation, messages: allReceivedMessages })
		);
		conversationsWithMessageIdsToStore.length > 0 &&
			createOrUpdateConversations(conversationsWithMessageIdsToStore);
		messagesToStore.length > 0 && createOrUpdateMessages(messagesToStore);

		const deletedIds = notify.deleted;
		if (deletedIds) {
			handleNotifyDeleted(deletedIds);
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
