/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import {
	FOLDERS,
	getBridgedFunctions,
	getNotificationManager,
	getUserSettings
} from '@zextras/carbonio-shell-ui';
import { NotificationConfig } from '@zextras/carbonio-shell-ui/types/notification';
import {
	forEach,
	pick,
	merge,
	omit,
	reduce,
	map,
	filter,
	sortBy,
	reverse,
	find,
	reject
} from 'lodash';
import { normalizeMailMessageFromSoap } from '../../normalizations/normalize-message';
import { SoapIncompleteMessage, MsgStateType, IncompleteMessage, Payload } from '../../types';

const triggerNotification = (m: Array<SoapIncompleteMessage>): void => {
	const { t } = getBridgedFunctions();
	const { props, prefs } = getUserSettings();
	const isShowNotificationEnabled = prefs?.zimbraPrefMailToasterEnabled ?? 'TRUE';
	const isAudioEnabled = find(props, ['name', 'mailNotificationSound'])?._content ?? 'TRUE';
	const showAllNotifications = prefs?.zimbraPrefShowAllNewMailNotifications ?? 'FALSE';

	const messages = map(m, (item: SoapIncompleteMessage) => {
		let norm = normalizeMailMessageFromSoap(item, false);
		if (norm?.fragment && norm?.fragment?.length < 1) {
			norm = {
				...norm,
				fragment: t('notification.no_content', 'Message without content')
			};
		}
		if (norm?.subject?.length < 1) {
			norm = {
				...norm,
				subject: t('notification.new_message', 'New Message')
			};
		}
		return pick(norm, ['subject', 'fragment', 'date', 'parent', 'isSentByMe']);
	});
	const messagesToNotify = reverse(
		sortBy(
			filter(reject(messages, 'read'), (item) =>
				showAllNotifications === 'TRUE'
					? !(item.isSentByMe === true)
					: !(item.isSentByMe === true) && item.parent === FOLDERS.INBOX
			),
			'date'
		)
	);

	if (!messagesToNotify?.length || !(isAudioEnabled || isShowNotificationEnabled)) {
		return;
	}

	const notificationConfig: NotificationConfig[] = messagesToNotify.map((msg) => ({
		title: msg.subject,
		message: msg.fragment ?? t('notification.no_content', 'Message without content') ?? '',
		playSound: isAudioEnabled === 'TRUE',
		showPopup: isShowNotificationEnabled === 'TRUE'
	}));

	getNotificationManager().multipleNotify(notificationConfig);
};

export const handleCreatedMessagesReducer = (state: MsgStateType, { payload }: Payload): void => {
	const { m } = payload;

	const mappedMsgs = <IncompleteMessage>reduce(
		m,
		(acc, v) => {
			const msg = normalizeMailMessageFromSoap(v, false);
			return { ...acc, [msg.id]: msg };
		},
		{}
	);
	triggerNotification(m);
	state.messages = merge(state.messages, mappedMsgs);
};

export const handleModifiedMessagesReducer = (state: MsgStateType, { payload }: Payload): void => {
	forEach(payload, (msg) => {
		if (msg?.id && state?.messages?.[msg.id]) {
			state.messages[msg.id] = { ...merge(state.messages[msg.id], msg), tags: msg.tags };
		}
	});
};

export const handleDeletedMessagesReducer = (state: MsgStateType, { payload }: Payload): void => {
	forEach(payload, (id) => {
		state.messages = omit(state.messages, id);
	});
};
