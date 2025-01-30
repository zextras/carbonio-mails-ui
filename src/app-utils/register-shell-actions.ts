/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { SyntheticEvent } from 'react';

import { Action, ACTION_TYPES, NewAction, registerActions, t } from '@zextras/carbonio-shell-ui';
import { isArray, isString, some } from 'lodash';

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

interface MailToReceiversActionType extends Action {
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

export type Receiver = {
	email: string;
	name: string;
	carbonCopy?: boolean;
};

type MailDescription = {
	subject: string;
	receivers: Receiver[];
};

function isMailDescription(mailDescription: unknown): mailDescription is MailDescription {
	return (
		typeof mailDescription === 'object' &&
		mailDescription !== null &&
		'subject' in mailDescription &&
		'receivers' in mailDescription &&
		isArray(mailDescription.receivers) &&
		mailDescription.receivers.every(
			(receiver) =>
				typeof receiver === 'object' &&
				receiver !== null &&
				'email' in receiver &&
				'name' in receiver
		) &&
		isString(mailDescription.subject)
	);
}

export const mailToReceiversActionOnClick = (
	e: SyntheticEvent<HTMLElement, Event> | KeyboardEvent,
	mailDescription: unknown
): void => {
	e?.preventDefault?.();
	if (isMailDescription(mailDescription)) {
		const participants = mailDescription.receivers.map((receiver) => ({
			type: receiver.carbonCopy ? ParticipantRole.CARBON_COPY : ParticipantRole.TO,
			address: receiver.email,
			fullName: receiver.name
		}));

		mailToSharedFunction(participants, mailDescription.subject);
	}
};

export const mailToReceiversAction = (mailDescription: unknown): MailToReceiversActionType => ({
	id: 'mail-to',
	label: t('label.send_mail', 'Send Mail'),
	icon: 'MailModOutline',
	execute: (e) => mailToReceiversActionOnClick(e, mailDescription),
	disabled: false
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
	registerActions<MailToReceiversActionType>({
		action: mailToReceiversAction,
		id: 'mail-to-receivers',
		type: 'contact-list'
	});
};
