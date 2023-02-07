/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { lazy, useEffect, Suspense } from 'react';
import {
	Spinner,
	addRoute,
	addSettingsView,
	addSearchView,
	addBoardView,
	registerActions,
	registerFunctions,
	ACTION_TYPES,
	addBoard,
	t
} from '@zextras/carbonio-shell-ui';
import { some } from 'lodash';
import { SyncDataHandler } from './views/sidebar/sync-data-handler';
import {
	mailToSharedFunction,
	openComposerSharedFunction,
	openPrefilledComposerSharedFunction
} from './integrations/shared-functions';
import { MAILS_ROUTE, MAIL_APP_ID } from './constants';
import { getSettingsSubSections } from './views/settings/subsections';
import { StoreProvider } from './store/redux';
import { ParticipantRole } from './carbonio-ui-commons/constants/participants';

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
		<StoreProvider>
			<LazyAppView />
		</StoreProvider>
	</Suspense>
);
const EditView = () => (
	<Suspense fallback={<Spinner />}>
		<StoreProvider>
			<LazyEditView />
		</StoreProvider>
	</Suspense>
);
const SettingsView = () => (
	<Suspense fallback={<Spinner />}>
		<StoreProvider>
			<LazySettingsView />
		</StoreProvider>
	</Suspense>
);

const SearchView = (props) => (
	<Suspense fallback={<Spinner />}>
		<StoreProvider>
			<LazySearchView {...props} />
		</StoreProvider>
	</Suspense>
);

const SidebarView = (props) => (
	<Suspense fallback={<Spinner />}>
		<StoreProvider>
			<LazySidebarView {...props} />
		</StoreProvider>
	</Suspense>
);

const App = () => {
	useEffect(() => {
		addRoute({
			route: MAILS_ROUTE,
			position: 1,
			visible: true,
			label: t('label.app_name', 'Mails'),
			primaryBar: 'MailModOutline',
			secondaryBar: SidebarView,
			appView: AppView
		});
		addSettingsView({
			route: MAILS_ROUTE,
			label: t('label.app_name', 'Mails'),
			subSections: getSettingsSubSections(t),
			component: SettingsView
		});
		addSearchView({
			route: MAILS_ROUTE,
			component: SearchView
		});
		addBoardView({
			route: MAILS_ROUTE,
			component: EditView
		});
	}, []);

	useEffect(() => {
		registerActions(
			{
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
			},
			{
				action: () => ({
					id: 'new-email',
					label: t('label.new_email', 'New E-mail'),
					icon: 'MailModOutline',
					click: (ev) => {
						ev?.preventDefault?.();
						addBoard({
							url: `${MAILS_ROUTE}/new?action=new`,
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
	}, []);

	return (
		<StoreProvider>
			<SyncDataHandler />
		</StoreProvider>
	);
};

export default App;
