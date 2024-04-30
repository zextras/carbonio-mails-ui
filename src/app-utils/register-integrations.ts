/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { SyntheticEvent } from 'react';

import {
	ACTION_TYPES,
	addBoard,
	registerActions,
	registerFunctions
} from '@zextras/carbonio-shell-ui';
import { t } from 'i18next';
import { some } from 'lodash';

import { ParticipantRole } from '../carbonio-ui-commons/constants/participants';
import { EditViewActions, MAILS_ROUTE, MAIL_APP_ID } from '../constants';
import {
	mailToSharedFunction,
	openComposerSharedFunction,
	openPrefilledComposerSharedFunction
} from '../integrations/shared-functions';

export const registerIntegrations = (): void => {
	registerActions(
		{
			// TODO-SHELL: update the action type definition
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			action: (contacts: any) => ({
				id: 'mail-to',
				label: 'Send Mail',
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
	registerFunctions(
		{
			id: 'compose',
			// TODO-SHELL: fix the function type definition
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			fn: openComposerSharedFunction
		},
		{
			id: 'composePrefillMessage',
			fn: openPrefilledComposerSharedFunction
		}
	);
};
