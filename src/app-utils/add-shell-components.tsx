/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { Suspense, lazy } from 'react';

import { ModalManager } from '@zextras/carbonio-design-system';
import {
	addRoute,
	addBoardView,
	addSettingsView,
	t,
	SecondaryBarComponentProps
} from '@zextras/carbonio-shell-ui';

import { advancedAccountAPI } from '../api/advanced-account';
import { Spinner } from '../assets/spinner';
import { MAILS_BOARD_VIEW_ID, MAILS_ROUTE } from '../constants';
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
			<ModalManager>
				<LazyEditView />
			</ModalManager>
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

const SidebarView = (props: SecondaryBarComponentProps): React.JSX.Element => (
	<Suspense fallback={<Spinner />}>
		<StoreProvider>
			<ModalManager>
				<LazySidebarView {...props} />
			</ModalManager>
		</StoreProvider>
	</Suspense>
);

export const addComponentsToShell = async (): Promise<void> => {
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
	addBoardView({
		id: MAILS_BOARD_VIEW_ID,
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
