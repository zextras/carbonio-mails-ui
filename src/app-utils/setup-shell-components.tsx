/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { Suspense, lazy } from 'react';

import { ModalManager } from '@zextras/carbonio-design-system';
import {
	Spinner,
	addRoute,
	addSearchView,
	addBoardView,
	addSettingsView,
	t
} from '@zextras/carbonio-shell-ui';

import { advancedAccountAPI } from '../api/advanced-account';
import type { SidebarProps } from '../carbonio-ui-commons/types/sidebar';
import { MAILS_ROUTE } from '../constants';
import { StoreProvider } from '../store/redux';
import { ExtraWindowsManager } from '../views/app/extra-windows/extra-window-manager';
import { getSettingsSubSections } from '../views/settings/subsections';

const LazyAppView = lazy(
	() => import(/* webpackChunkName: "mails-folder-panel-view" */ '../views/app-view')
);

const LazyEditView = lazy(
	() =>
		import(
			/* webpackChunkName: "mails-edit-view" */ '../views/app/detail-panel/edit/edit-view-controller'
		)
);

const LazySettingsView = lazy(
	() => import(/* webpackChunkName: "mail-setting-view" */ '../views/settings/settings-view')
);

const LazySearchView = lazy(
	() => import(/* webpackChunkName: "mail-search-view" */ '../views/search/search-view')
);

const LazySidebarView = lazy(
	() => import(/* webpackChunkName: "mail-sidebar-view" */ '../views/sidebar/sidebar')
);

const AppView = (): React.JSX.Element => (
	<Suspense fallback={<Spinner />}>
		<StoreProvider>
			<ModalManager>
				<ExtraWindowsManager>
					<LazyAppView />
				</ExtraWindowsManager>
			</ModalManager>
		</StoreProvider>
	</Suspense>
);

const EditView = (): React.JSX.Element => (
	<Suspense fallback={<Spinner />}>
		<StoreProvider>
			<LazyEditView />
		</StoreProvider>
	</Suspense>
);

const SettingsView = (): React.JSX.Element => (
	<Suspense fallback={<Spinner />}>
		<StoreProvider>
			<ModalManager>
				<LazySettingsView />
			</ModalManager>
		</StoreProvider>
	</Suspense>
);

const SearchView = (props: any): React.JSX.Element => (
	<Suspense fallback={<Spinner />}>
		<StoreProvider>
			<ExtraWindowsManager>
				<ModalManager>
					<LazySearchView {...props} />
				</ModalManager>
			</ExtraWindowsManager>
		</StoreProvider>
	</Suspense>
);

const SidebarView = (props: SidebarProps): React.JSX.Element => (
	<Suspense fallback={<Spinner />}>
		<StoreProvider>
			<ModalManager>
				<LazySidebarView {...props} />
			</ModalManager>
		</StoreProvider>
	</Suspense>
);

export const setupShellComponents = async (): Promise<void> => {
	const label = t('label.app_name', 'Mails');
	addRoute({
		route: MAILS_ROUTE,
		position: 100,
		visible: true,
		label,
		primaryBar: 'MailModOutline',
		secondaryBar: SidebarView,
		appView: AppView
	});
	addSearchView({
		route: MAILS_ROUTE,
		component: SearchView,
		label
	});
	addBoardView({
		route: MAILS_ROUTE,
		component: EditView
	});
	const { backupSelfUndeleteAllowed } = await advancedAccountAPI();
	addSettingsView({
		route: MAILS_ROUTE,
		label,
		subSections: getSettingsSubSections(backupSelfUndeleteAllowed),
		component: SettingsView
	});
};
