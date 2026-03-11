/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import {
	getNotificationManager,
	getUserSettings,
	IS_FOCUS_MODE,
	NotificationConfig,
	t
} from '@zextras/carbonio-shell-ui';
import { FOLDERS } from '@zextras/carbonio-ui-commons';
import { filter, find, reject, reverse, sortBy } from 'lodash';
import { NavigateFunction } from 'react-router-dom';

import { MAILS_ROUTE } from 'constants/index';
import { IncompleteMessage, MailMessage } from 'types/messages';

export const triggerNotification = (
	messages: Array<IncompleteMessage | MailMessage>,
	navigate: NavigateFunction
): void => {
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

	if (
		!messagesToNotify?.length ||
		!(isAudioEnabled || isShowNotificationEnabled) ||
		IS_FOCUS_MODE
	) {
		return;
	}

	const notificationConfig: NotificationConfig[] = messagesToNotify.map((msg) => ({
		title: msg.subject,
		message: msg.fragment ?? t('notification.no_content', 'Message without content') ?? '',
		playSound: isAudioEnabled === 'TRUE',
		showPopup: isShowNotificationEnabled === 'TRUE',
		onClick: (): void => {
			window.focus();
			navigate(`/${MAILS_ROUTE}/folder/${msg.parent}/message/${msg.id}`, { replace: true });
		}
	}));

	getNotificationManager().multipleNotify(notificationConfig);
};
