/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { lazy, useEffect, Suspense } from 'react';
import {
	Spinner,
	registerAppData,
	registerActions,
	registerFunctions,
	getBridgedFunctions
} from '@zextras/carbonio-shell-ui';
import { some } from 'lodash';
import { SyncDataHandler } from './views/sidebar/sync-data-handler';
import { mailToSharedFunction, openComposerSharedFunction } from './integrations/shared-functions';
import Notifications from './views/notifications';
import { ParticipantRole } from './types/participant';

const LazyAppView = lazy(() =>
	import(/* webpackChunkName: "mails-folder-panel-view" */ './views/app-view')
);
const LazyEditView = lazy(() =>
	import(/* webpackChunkName: "mails-edit-view" */ './views/app/detail-panel/edit/edit-view')
);

const LazySettingsView = lazy(() =>
	import(/* webpackChunkName: "mail-setting-view" */ './views/settings/settings-view')
);
const LazySearchView = lazy(() =>
	import(/* webpackChunkName: "mail-search-view" */ './views/search/search-view')
);

const LazySidebarView = lazy(() =>
	import(/* webpackChunkName: "mail-sidebar-view" */ './views/sidebar/sidebar')
);

const AppView = () => (
	<Suspense fallback={<Spinner />}>
		<LazyAppView />
	</Suspense>
);
const EditView = () => (
	<Suspense fallback={<Spinner />}>
		<LazyEditView />
	</Suspense>
);
const SettingsView = () => (
	<Suspense fallback={<Spinner />}>
		<LazySettingsView />
	</Suspense>
);

const SearchView = (props) => (
	<Suspense fallback={<Spinner />}>
		<LazySearchView {...props} />
	</Suspense>
);

const SidebarView = (props) => (
	<Suspense fallback={<Spinner />}>
		<LazySidebarView {...props} />
	</Suspense>
);

export default function App() {
	console.log(
		'%c MAILS APP LOADED',
		'color: white; background: #8bc34a;padding: 4px 8px 2px 4px; font-family: sans-serif; border-radius: 12px; width: 100%'
	);

	useEffect(() => {
		registerAppData({
			icon: 'MailModOutline',
			views: {
				app: AppView,
				board: EditView,
				sidebar: SidebarView,
				settings: SettingsView,
				search: SearchView
			},
			context: { isMessageView: false },
			newButton: {
				primary: {
					id: 'create-mail',
					icon: 'EmailOutline',
					label: 'New Mail',
					click: () => {
						getBridgedFunctions().addBoard('/new?action=new');
					}
				},
				secondaryItems: []
			}
		});
	}, []);

	useEffect(() => {
		registerActions({
			action: (contacts) => ({
				id: 'mail-to',
				label: 'Send Mail',
				icon: 'MailModOutline',
				click: (ev) => {
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
		});
		registerFunctions({
			id: 'compose',
			fn: openComposerSharedFunction
		});
	}, []);

	return (
		<>
			<Notifications />
			<SyncDataHandler />
		</>
	);
}
