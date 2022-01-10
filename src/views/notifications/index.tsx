/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { FC, useEffect } from 'react';
import logo from '../../assets/carbonio_logo.png';
import sound from '../../assets/notification.mp3';

function playSound(): void {
	const audio = new Audio(sound);
	audio.play();
}
export const showNotification = (title: string, body: string, hasSound?: boolean): void => {
	// eslint-disable-next-line no-new
	new Notification(title, {
		body,
		vibrate: [200, 100, 200],
		dir: 'ltr',
		icon: logo,
		tag: 'mail-notification'
	});
	hasSound && playSound();
};

const Notifications: FC = (): null => {
	useEffect(() => {
		if (!('Notification' in window)) {
			// eslint-disable-next-line no-console
			console.warn('This browser does not support desktop notifications');
		} else {
			Notification.requestPermission();
		}
	}, []);

	return null;
};
export default Notifications;
