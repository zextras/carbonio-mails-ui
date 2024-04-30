/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { SyntheticEvent } from 'react';

import { ACTION_TYPES, addBoard, registerActions, t } from '@zextras/carbonio-shell-ui';
import { some } from 'lodash';

import { ParticipantRole } from '../carbonio-ui-commons/constants/participants';
import { EditViewActions, MAILS_ROUTE, MAIL_APP_ID } from '../constants';
import { mailToSharedFunction } from '../integrations/shared-functions';

export const registerShellActions = (): void => {
	registerActions(
		{
			// TODO-SHELL: update the action type definition
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			action: (contacts: any) => ({
				id: 'mail-to',
				label: t('label.send_mail', 'Send Mail'),
				icon: 'MailModOutline',
				onClick: (e: SyntheticEvent<HTMLElement, Event> | KeyboardEvent): void => {
					e?.preventDefault?.();
					const participant =
						!!contacts[0].email && Object.keys(contacts[0].email).length !== 0
							? [
									{
										type: ParticipantRole.TO,
										address: contacts[0].email.email.mail,
										fullName: `${contacts[0].firstName} ${contacts[0].middleName}`.trim()
									}
								]
							: [];
					mailToSharedFunction(participant);
				},
				disabled: some(contacts, (contact) => !contact.address)
			}),
			id: 'mail-to',
			type: 'contact-list'
		},
		{
			action: () => ({
				id: 'new-email',
				label: t('label.new_email', 'New E-mail'),
				icon: 'MailModOutline',
				onClick: (e: SyntheticEvent<HTMLElement, Event> | KeyboardEvent): void => {
					e?.preventDefault?.();
					addBoard({
						url: `${MAILS_ROUTE}/edit?action=${EditViewActions.NEW}`,
						title: t('label.new_email', 'New E-mail')
						// TODO provide the context filled with the current folder id
					});
				},
				disabled: false,
				group: MAIL_APP_ID,
				primary: true
			}),
			id: 'new-email',
			type: ACTION_TYPES.NEW
		}
	);
};
