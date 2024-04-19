/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useEffect } from 'react';

import {
	registerActions,
	registerFunctions,
	ACTION_TYPES,
	addBoard,
	t
} from '@zextras/carbonio-shell-ui';
import { some } from 'lodash';

import { setupShellComponents } from './app-utils/setup-shell-components';
import { FOLDER_VIEW } from './carbonio-ui-commons/constants';
import { ParticipantRole } from './carbonio-ui-commons/constants/participants';
import { useFoldersController } from './carbonio-ui-commons/hooks/use-folders-controller';
import { MAILS_ROUTE, MAIL_APP_ID, EditViewActions } from './constants';
import {
	mailToSharedFunction,
	openComposerSharedFunction,
	openPrefilledComposerSharedFunction
} from './integrations/shared-functions';
import { StoreProvider } from './store/redux';
import { SyncDataHandler } from './views/sidebar/sync-data-handler';

const registerIntegrations = () => {
	registerActions(
		{
			action: (contacts) => ({
				id: 'mail-to',
				label: 'Send Mail',
				icon: 'MailModOutline',
				onClick: (ev) => {
					ev?.preventDefault?.();
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
				onClick: (ev) => {
					ev?.preventDefault?.();
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
			fn: openComposerSharedFunction
		},
		{
			id: 'composePrefillMessage',
			fn: openPrefilledComposerSharedFunction
		}
	);
};

const App = () => {
	useEffect(() => {
		setupShellComponents();
	}, []);

	useEffect(registerIntegrations, []);

	useFoldersController(FOLDER_VIEW.message);

	return (
		<StoreProvider>
			<SyncDataHandler />
		</StoreProvider>
	);
};

export default App;
