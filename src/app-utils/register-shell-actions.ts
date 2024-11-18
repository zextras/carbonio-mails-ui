/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { SyntheticEvent } from 'react';

import { Action, ACTION_TYPES, NewAction, registerActions, t } from '@zextras/carbonio-shell-ui';
import { isArray, some } from 'lodash';

import { ParticipantRole } from '../carbonio-ui-commons/constants/participants';
import { EditViewActions, MAIL_APP_ID } from '../constants';
import { mailToSharedFunction } from '../integrations/shared-functions';
import { createEditBoard } from '../views/app/detail-panel/edit/edit-view-board';

interface MailToActionType extends Action {
	id: string;
	icon: string;
	execute: (e: SyntheticEvent<HTMLElement, Event> | KeyboardEvent) => void;
	disabled: boolean;
}

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
	execute: (e) => mailToActionOnClick(e, contacts),
	disabled: isArray(contacts) && some(contacts, (contact) => !contact.address)
});

export const newEmailActionOnClick = (
	e: SyntheticEvent<HTMLElement, Event> | KeyboardEvent
): void => {
	e?.preventDefault?.();
	createEditBoard({
		action: EditViewActions.NEW,
		title: t('label.new_email', 'New E-mail')
	});
};

export const newEmailAction = (): NewAction => ({
	id: 'new-email',
	label: t('label.new_email', 'New E-mail'),
	icon: 'MailModOutline',
	execute: newEmailActionOnClick,
	disabled: false,
	group: MAIL_APP_ID,
	primary: true
});

export const registerShellActions = (): void => {
	registerActions<NewAction>({
		action: newEmailAction,
		id: 'new-email',
		type: ACTION_TYPES.NEW
	});
	registerActions<MailToActionType>({
		action: mailToAction,
		id: 'mail-to',
		type: 'contact-list'
	});
};
