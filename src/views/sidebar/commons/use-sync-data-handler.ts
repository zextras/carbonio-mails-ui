/* eslint-disable no-param-reassign */
/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { MutableRefObject, useEffect, useRef, useState } from 'react';

import { SoapNotify } from '@zextras/carbonio-shell-ui';
import {
	folderWorker,
	tagsWorker,
	useFolderStore,
	useTagStore
} from '@zextras/carbonio-ui-commons';
import { useInfoRefresh, useSync } from '@zextras/carbonio-ui-soap-lib';
import { flatten, forEach, isEmpty, map, sortBy } from 'lodash';
import { NavigateFunction, useNavigate } from 'react-router-dom';

import { publishQuotaChangedEvent } from 'event-bus/publish-event';
import {
	mapToNormalizedConversation,
	normalizePartialConversations
} from 'normalizations/normalize-conversation';
import {
	normalizeMailMessageFromSoap,
	normalizePartialIncompleteMessageFromSoapNotify
} from 'normalizations/normalize-message';
import {
	handleNotifyConversationsCreated,
	handleNotifyConversationsModified,
	handleNotifyDeleted,
	handleNotifyMessagesCreated,
	handleNotifyMessagesModified,
	updateMessages
} from 'store/emails/store';
import { triggerNotification } from 'store/emails/sync-data-handler/trigger-notification';
import { IncompleteMessage } from 'types/messages';
import { SoapConversation } from 'types/soap/soap-conversation';
import { SoapIncompleteMessage } from 'types/soap/soap-mail-message';
import {
	HandleFoldersNotifyProps,
	HandleTagsNotifyProps,
	SoapPartialConversation,
	SoapPartialIncompleteMessage
} from 'views/sidebar/commons/types';

export function extractConvMessage(
	createdConversations: Array<{ m?: Array<SoapIncompleteMessage> }>
): Array<IncompleteMessage> {
	return flatten(createdConversations.map((conversation) => conversation.m || [])).map((message) =>
		normalizeMailMessageFromSoap({ m: message, html: true })
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

function processCreatedNotifications(notify: SoapNotify, navigate: NavigateFunction): void {
	const { c: createdConversations, m: createdMessages } = notify.created || {};
	const { m: modifiedMessages } = notify.modified || {};
	const newConversations = (createdConversations ?? []) as Array<SoapConversation>;
	const newMessages = (createdMessages ?? []) as Array<SoapIncompleteMessage>;
	const changedMessages = (modifiedMessages ?? []) as Array<SoapIncompleteMessage>;
	const allReceivedMessages = [...changedMessages, ...newMessages];
	// in case of created, we have SoapConversation
	if (createdConversations && createdMessages) {
		const conversationsWithMessageIds = map(newConversations, (conversation) =>
			mapToNormalizedConversation({ conversation, messages: allReceivedMessages })
		);
		handleNotifyConversationsCreated(conversationsWithMessageIds);
		const normalizedMessages = allReceivedMessages.map((message) =>
			normalizeMailMessageFromSoap({ m: message, html: true })
		);
		updateMessages(normalizedMessages);
	}

	if (newMessages) {
		const messages = map(newMessages, (message) =>
			normalizeMailMessageFromSoap({ m: message, html: true })
		);
		handleNotifyMessagesCreated(messages);
		triggerNotification(messages, navigate);
		const totalSize = newMessages.reduce((sum, message) => sum + (message.s ?? 0), 0);
		publishQuotaChangedEvent(totalSize);
	}
}

function processModifiedNotifications(notify: SoapNotify): void {
	const modifiedConversations = notify.modified?.c as Array<SoapPartialConversation>;
	if (modifiedConversations) {
		const updatedConversations = normalizePartialConversations(modifiedConversations);
		handleNotifyConversationsModified(updatedConversations);

		const convMessages = extractConvMessage(modifiedConversations);
		updateMessages(convMessages);
	}

	const modifiedMessages = notify.modified?.m as Array<SoapPartialIncompleteMessage>;
	if (modifiedMessages) {
		const messages = map(modifiedMessages, (message) =>
			normalizePartialIncompleteMessageFromSoapNotify(message)
		);
		handleNotifyMessagesModified(messages);
	}
}

type ProcessNotificationsProps = {
	notifyList: SoapNotify[];
	seq: number;
	setSeq: (arg: number) => void;
	processedNotify: MutableRefObject<number>;
	navigate: NavigateFunction;
};

function processNotifications({
	notifyList,
	seq,
	setSeq,
	processedNotify,
	navigate
}: ProcessNotificationsProps): void {
	forEach(sortBy(notifyList, 'seq'), (notify) => {
		/*
		 * After a period of inactivity from the client, the server will reset the sequence number to 1.
		 * In this case, if the client stored sequence number is greater than 1, the client must reset its sequence
		 * number to 1 as well, to avoid missing any update.
		 *
		 * TODO probably the check on the "seq" state is redundant. We keep it at the moment, to avoid
		 *  possible regressions, but we should remove it in the future
		 */
		const isSequenceReset = processedNotify.current > 1 && notify.seq === 1;
		if (
			(processedNotify.current >= notify.seq && !isSequenceReset) ||
			isEmpty(notify) ||
			(notify.seq <= seq && !(seq > 1 && notify.seq === 1))
		) {
			return;
		}

		processedNotify.current = notify.seq;
		handleFoldersNotify({ notifyList, notify, worker: folderWorker, store: useFolderStore });
		handleTagsNotify({ notify, worker: tagsWorker, store: useTagStore });

		if (notify.created) {
			processCreatedNotifications(notify, navigate);
		}

		if (notify.modified) {
			processModifiedNotifications(notify);
		}

		const deletedIds = notify.deleted;
		if (deletedIds.length > 0) {
			handleNotifyDeleted(deletedIds);
		}

		setSeq(notify.seq);
	});
}

export const useSyncDataHandler = (): void => {
	const notifyList = useSync();
	const navigate = useNavigate();
	const [seq, setSeq] = useState(-1);
	const [initialized, setInitialized] = useState(false);
	const processedNotify = useRef<number>(-1);
	const refresh = useInfoRefresh();
	useEffect(() => {
		if (!isEmpty(refresh) && !initialized) {
			setInitialized(true);
		}
	}, [initialized, refresh]);

	useEffect(() => {
		if (initialized && notifyList.length > 0) {
			processNotifications({ notifyList, seq, setSeq, processedNotify, navigate });
		}
	}, [initialized, navigate, notifyList, seq]);
};
