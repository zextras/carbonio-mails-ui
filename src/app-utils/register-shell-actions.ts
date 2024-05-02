/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { SyntheticEvent } from 'react';

import { ACTION_TYPES, addBoard, registerActions, t } from '@zextras/carbonio-shell-ui';
import { isArray, some } from 'lodash';

import { ParticipantRole } from '../carbonio-ui-commons/constants/participants';
import { EditViewActions, MAILS_ROUTE, MAIL_APP_ID } from '../constants';
import { mailToSharedFunction } from '../integrations/shared-functions';

type MailToActionType = {
	id: string;
	label: string;
	icon: string;
	onClick: (e: SyntheticEvent<HTMLElement, Event> | KeyboardEvent) => void;
	disabled: boolean;
};

export const mailToActionOnClick = (
	e: SyntheticEvent<HTMLElement, Event> | KeyboardEvent,
	contacts: unknown
): void => {
	e?.preventDefault?.();
	const participant =
		isArray(contacts) &&
		'email' in contacts[0] &&
		!!contacts[0].email &&
		Object.keys(contacts[0].email).length !== 0
			? [
					{
						type: ParticipantRole.TO,
						address: contacts[0].email.email.mail,
						fullName: `${contacts[0].firstName} ${contacts[0].middleName}`.trim()
					}
				]
			: [];
	mailToSharedFunction(participant);
};

export const mailToAction = (contacts: unknown): MailToActionType => ({
	id: 'mail-to',
	label: t('label.send_mail', 'Send Mail'),
	icon: 'MailModOutline',
	onClick: (e) => mailToActionOnClick(e, contacts),
	disabled: isArray(contacts) && some(contacts, (contact) => !contact.address)
});

type NewEmailActionType = {
	id: string;
	label: string;
	icon: string;
	onClick: (e: SyntheticEvent<HTMLElement, Event> | KeyboardEvent) => void;
	disabled: boolean;
	group: string;
	primary: boolean;
};

export const newEmailActionOnClick = (
	e: SyntheticEvent<HTMLElement, Event> | KeyboardEvent
): void => {
	e?.preventDefault?.();
	addBoard({
		url: `${MAILS_ROUTE}/edit?action=${EditViewActions.NEW}`,
		title: t('label.new_email', 'New E-mail')
		// TOFIX provide the context filled with the current folder id
	});
};

export const newEmailAction = (): NewEmailActionType => ({
	id: 'new-email',
	label: t('label.new_email', 'New E-mail'),
	icon: 'MailModOutline',
	onClick: newEmailActionOnClick,
	disabled: false,
	group: MAIL_APP_ID,
	primary: true
});

export const registerShellActions = (): void => {
	registerActions(
		{
			// TOFIX-SHELL: update the action type definition
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			action: mailToAction,
			id: 'mail-to',
			type: 'contact-list'
		},
		{
			action: newEmailAction,
			id: 'new-email',
			type: ACTION_TYPES.NEW
		}
	);
};
