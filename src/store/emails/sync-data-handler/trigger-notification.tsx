/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import {
	getNotificationManager,
	getUserSettings,
	replaceHistory,
	NotificationConfig,
	t
} from '@zextras/carbonio-shell-ui';
import { filter, sortBy, reverse, find, reject } from 'lodash';

import { FOLDERS } from '../../../carbonio-ui-commons/constants/folders';
import { MAILS_ROUTE } from '../../../constants';
import { IncompleteMessage, MailMessage } from '../../../types';

export const triggerNotification = (messages: Array<IncompleteMessage | MailMessage>): void => {
	const { props, prefs } = getUserSettings();
	const isShowNotificationEnabled = prefs?.zimbraPrefMailToasterEnabled ?? 'TRUE';
	const isAudioEnabled = find(props, ['name', 'mailNotificationSound'])?._content ?? 'TRUE';
	const showAllNotifications = prefs?.zimbraPrefShowAllNewMailNotifications ?? 'FALSE';

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
		showPopup: isShowNotificationEnabled === 'TRUE',
		onClick: (): void => {
			window.focus();
			replaceHistory({
				path: `/folder/${msg.parent}/message/${msg.id}`,
				route: MAILS_ROUTE
			});
		}
	}));

	getNotificationManager().multipleNotify(notificationConfig);
};
