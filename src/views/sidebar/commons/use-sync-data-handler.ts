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
import { flatten, forEach, isEmpty, isNil, map, sortBy, uniqBy } from 'lodash';
import { NavigateFunction, useNavigate } from 'react-router-dom';

import { MailboxRefreshedEvent } from 'event-bus/events/mailbox-refreshed';
import { publishEvent, publishQuotaChangedEvent } from 'event-bus/publish-event';
import {
	mapToNormalizedConversation,
	normalizePartialConversations
} from 'normalizations/normalize-conversation';
import {
	normalizeMailMessageFromSoap,
	normalizeParticipantsFromSoap,
	normalizePartialIncompleteMessageFromSoapNotify
} from 'normalizations/normalize-message';
import { recordNotifiedItems } from 'store/emails/notified-items';
import {
	clearHiddenConversationsStatus,
	handleNotifyConversationsCreated,
	handleNotifyConversationsModified,
	handleNotifyDeleted,
	handleNotifyMessagesCreated,
	handleNotifyMessagesModified,
	updateMessages
} from 'store/emails/store';
import { triggerNotification } from 'store/emails/sync-data-handler/trigger-notification';
import { NormalizedConversation } from 'types/conversations';
import { IncompleteMessage } from 'types/messages';
import { SearchConversationHit } from 'types/soap/search';
import {
	HandleFoldersNotifyProps,
	HandleTagsNotifyProps,
	MailsSoapNotify,
	SoapNotifyMessage
} from 'views/sidebar/commons/types';

export function extractConvMessage(
	conversations: Array<SearchConversationHit>
): Array<IncompleteMessage> {
	return flatten(
		conversations.map((conversation) =>
			(conversation.m ?? []).map((hit) =>
				normalizeMailMessageFromSoap({
					m: {
						id: hit.id,
						l: hit.l,
						f: hit.f,
						// the hit does not repeat the id of its conversation
						cid: conversation.id,
						d: Number(hit.d),
						...(isNil(hit.s) ? {} : { s: Number(hit.s) }),
						...(isNil(hit.autoSendTime) ? {} : { autoSendTime: Number(hit.autoSendTime) })
					},
					html: true
				})
			)
		)
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

/**
 * A conversation of a notification lists only its senders (ToXML.encodeItem): add the 'To' recipients of its
 * messages created in the same notification, as a search with recip does for the conversations it returns.
 */
function addRecipientsOfCreatedMessages(
	conversation: NormalizedConversation,
	createdMessages: Array<SoapNotifyMessage>
): NormalizedConversation {
	const recipients = createdMessages
		.filter((message) => message.cid === conversation.id)
		.flatMap((message) => message.e ?? [])
		.filter((participant) => participant.t === 't')
		.map(normalizeParticipantsFromSoap);
	const participants = uniqBy(
		[...conversation.participants, ...recipients],
		(participant) => `${participant.type}:${participant.address}`
	);
	return { ...conversation, participants };
}

function processCreatedNotifications(notify: MailsSoapNotify, navigate: NavigateFunction): void {
	const { c: createdConversations, m: createdMessages } = notify.created || {};
	const newConversations = createdConversations ?? [];
	const newMessages = createdMessages ?? [];
	const allReceivedMessages = [...(notify.modified?.m ?? []), ...newMessages];
	// in case of created, we have SoapConversation
	if (createdConversations && createdMessages) {
		const conversationsWithMessageIds = map(newConversations, (conversation) =>
			addRecipientsOfCreatedMessages(
				mapToNormalizedConversation({ conversation, messages: allReceivedMessages }),
				newMessages
			)
		);
		handleNotifyConversationsCreated(conversationsWithMessageIds);
		// modified messages are partial: processModifiedNotifications updates them without defaults
		const normalizedMessages = newMessages.map((message) =>
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

function processModifiedNotifications(notify: MailsSoapNotify): void {
	const modifiedConversations = notify.modified?.c;
	if (modifiedConversations) {
		const updatedConversations = normalizePartialConversations(modifiedConversations);
		// a conversation of a notification never carries its messages (ToXML.encodeItem passes no msgs)
		handleNotifyConversationsModified(updatedConversations);
	}

	const modifiedMessages = notify.modified?.m;
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

		// the shell types the conversations and messages of a notification as unknown: the server sends
		// the summaries of ToXML.encodeItem, which MailsSoapNotify describes
		const mailsNotify = notify as MailsSoapNotify;
		// the searches in progress must not undo what is notified (see refreshSearchEmailStoreAction)
		recordNotifiedItems({
			deletedIds: notify.deleted,
			changedIds: [
				...(mailsNotify.created?.c ?? []),
				...(mailsNotify.created?.m ?? []),
				...(mailsNotify.modified?.c ?? []),
				...(mailsNotify.modified?.m ?? [])
			].map(({ id }) => id)
		});
		if (mailsNotify.created) {
			processCreatedNotifications(mailsNotify, navigate);
		}

		if (mailsNotify.modified) {
			processModifiedNotifications(mailsNotify);
		}

		const deletedIds = notify.deleted;
		if (deletedIds.length > 0) {
			handleNotifyDeleted(deletedIds);
		}

		setSeq(notify.seq);
	});
}

export const MAILBOX_REFRESH_DELAY = 1500;
// the longest a reload waits while refreshes keep arriving
export const MAILBOX_REFRESH_MAX_DELAY = 10000;

export const useSyncDataHandler = (): void => {
	const notifyList = useSync();
	const navigate = useNavigate();
	const [seq, setSeq] = useState(-1);
	const [initialized, setInitialized] = useState(false);
	const processedNotify = useRef<number>(-1);
	const refresh = useInfoRefresh();
	const previousRefresh = useRef(refresh);
	const pendingReloadSince = useRef<number>();
	useEffect(() => {
		if (!isEmpty(refresh) && !initialized) {
			setInitialized(true);
		}
	}, [initialized, refresh]);

	useEffect(() => {
		// the first refresh initializes the session, while the following ones come with a new session or
		// replace the notifications the server dropped (e.g. after a bulk import), so the whole mailbox
		// state must be reloaded
		const isMailboxRefresh =
			!isEmpty(previousRefresh.current) && !isEmpty(refresh) && refresh !== previousRefresh.current;
		previousRefresh.current = refresh;
		if (!isMailboxRefresh) {
			return undefined;
		}

		// the tags of the refresh are applied at once, so that the tags notified after it are not undone.
		// The server leaves out the tags of an account without tags
		tagsWorker.postMessage({ op: 'refresh', tags: refresh.tags ?? { tag: [] } });

		// refreshes received in a row (e.g. during a long import) reload the mailbox once,
		// or once in a while if they keep arriving
		const now = Date.now();
		pendingReloadSince.current ??= now;
		const delay = Math.min(
			MAILBOX_REFRESH_DELAY,
			Math.max(0, pendingReloadSince.current + MAILBOX_REFRESH_MAX_DELAY - now)
		);
		const timeout = setTimeout(() => {
			pendingReloadSince.current = undefined;
			// the shown conversations repeat their search on the event, the others are loaded again when shown
			clearHiddenConversationsStatus();
			publishEvent(new MailboxRefreshedEvent());
		}, delay);
		return () => {
			clearTimeout(timeout);
		};
	}, [refresh]);

	useEffect(() => {
		if (initialized && notifyList.length > 0) {
			processNotifications({ notifyList, seq, setSeq, processedNotify, navigate });
		}
	}, [initialized, navigate, notifyList, seq]);
};
