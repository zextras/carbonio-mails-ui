/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { lazy, useEffect, Suspense } from 'react';

import { ModalManager } from '@zextras/carbonio-design-system';
import {
	Spinner,
	addRoute,
	addSearchView,
	addBoardView,
	registerActions,
	registerFunctions,
	ACTION_TYPES,
	addBoard,
	t
} from '@zextras/carbonio-shell-ui';
import { some } from 'lodash';

import { FOLDER_VIEW } from './carbonio-ui-commons/constants';
import { ParticipantRole } from './carbonio-ui-commons/constants/participants';
import { useFoldersController } from './carbonio-ui-commons/hooks/use-folders-controller';
import { MAILS_ROUTE, MAIL_APP_ID, EditViewActions } from './constants';
import { advancedSupportedAPI } from './integrations/advanced';
import {
	mailToSharedFunction,
	openComposerSharedFunction,
	openPrefilledComposerSharedFunction
} from './integrations/shared-functions';
import { StoreProvider } from './store/redux';
import { ExtraWindowsManager } from './views/app/extra-windows/extra-window-manager';
import { SyncDataHandler } from './views/sidebar/sync-data-handler';

const LazyAppView = lazy(
	() => import(/* webpackChunkName: "mails-folder-panel-view" */ './views/app-view')
);

const LazyEditView = lazy(
	() =>
		import(
			/* webpackChunkName: "mails-edit-view" */ './views/app/detail-panel/edit/edit-view-controller'
		)
);

const LazySettingsView = lazy(
	() => import(/* webpackChunkName: "mail-setting-view" */ './views/settings/settings-view')
);
const LazySearchView = lazy(
	() => import(/* webpackChunkName: "mail-search-view" */ './views/search/search-view')
);
const LazySidebarView = lazy(
	() => import(/* webpackChunkName: "mail-sidebar-view" */ './views/sidebar/sidebar')
);

const AppView = () => (
	<Suspense fallback={<Spinner />}>
		<StoreProvider>
			<ExtraWindowsManager>
				<LazyAppView />
			</ExtraWindowsManager>
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
			<ModalManager>
				<LazySettingsView />
			</ModalManager>
		</StoreProvider>
	</Suspense>
);

const SearchView = (props) => (
	<Suspense fallback={<Spinner />}>
		<StoreProvider>
			<ExtraWindowsManager>
				<LazySearchView {...props} />
			</ExtraWindowsManager>
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
			position: 100,
			visible: true,
			label: t('label.app_name', 'Mails'),
			primaryBar: 'MailModOutline',
			secondaryBar: SidebarView,
			appView: AppView
		});
		addSearchView({
			route: MAILS_ROUTE,
			component: SearchView,
			label: t('label.app_name', 'Mails')
		});
		addBoardView({
			route: MAILS_ROUTE,
			component: EditView
		});
	}, []);

	useEffect(() => {
		// Check if advanced is installed
		advancedSupportedAPI();
	}, []);
	useEffect(() => {
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
	}, []);
	useFoldersController(FOLDER_VIEW.message);
	return (
		<StoreProvider>
			<SyncDataHandler />
		</StoreProvider>
	);
};

export default App;
