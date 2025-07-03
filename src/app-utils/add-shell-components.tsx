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
	SecondaryBarComponentProps,
	upsertApp
} from '@zextras/carbonio-shell-ui';

import { advancedAccountApi } from 'api/advanced-account-api';
import { checkIsSmimeEnabled } from 'api/check-is-smime-enable-api';
import { Spinner } from 'assets/spinner';
import {
	CERTIFICATES_ROUTE,
	MAILS_ROUTE,
	MAIL_APP_ID,
	MAILS_BOARD_VIEW_ID,
	FOCUS_MODE_MAIL_VIEW_ROUTE
} from 'constants/index';
import { useSmimeFeatureStore } from 'store/certificates/store';
import { getSettingsSubSections } from 'views/settings/subsections';

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

const LazyCertificatsView = lazy(
	() =>
		import(
			/* webpackChunkName: "mail-certificates-view" */ '../views/settings/certificates/certificates-view'
		)
);

const LazySidebarView = lazy(
	() => import(/* webpackChunkName: "mail-sidebar-view" */ '../views/sidebar/sidebar')
);

const LazyFocusModeMailView = lazy(
	() =>
		import(
			/* webpackChunkName: "mail-sidebar-view" */ '../views/app/detail-panel/focus-mode-mail-view'
		)
);

const AppView = (): React.JSX.Element => (
	<Suspense fallback={<Spinner />}>
		<ModalManager>
			<LazyAppView />
		</ModalManager>
	</Suspense>
);

const EditView = (): React.JSX.Element => (
	<Suspense fallback={<Spinner />}>
		<ModalManager>
			<LazyEditView />
		</ModalManager>
	</Suspense>
);

const SettingsView = (): React.JSX.Element => (
	<Suspense fallback={<Spinner />}>
		<ModalManager>
			<LazySettingsView />
		</ModalManager>
	</Suspense>
);

const CertificatesView = (): React.JSX.Element => (
	<Suspense fallback={<Spinner />}>
		<ModalManager>
			<LazyCertificatsView />
		</ModalManager>
	</Suspense>
);

const SidebarView = (props: SecondaryBarComponentProps): React.JSX.Element => (
	<Suspense fallback={<Spinner />}>
		<ModalManager>
			<LazySidebarView {...props} />
		</ModalManager>
	</Suspense>
);

const FocusModeMailView = (): React.JSX.Element => (
	<Suspense fallback={<Spinner />}>
		<ModalManager>
			<LazyFocusModeMailView />
		</ModalManager>
	</Suspense>
);

export const addComponentsToShell = async (isCarbonioCE: boolean | undefined): Promise<void> => {
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

	addRoute({
		route: FOCUS_MODE_MAIL_VIEW_ROUTE,
		visible: false,
		label: 'Msg',
		appView: FocusModeMailView,
		focusMode: true
	});

	addBoardView({
		id: MAILS_BOARD_VIEW_ID,
		component: EditView
	});
	const { backupSelfUndeleteAllowed } = await advancedAccountApi();

	if (!isCarbonioCE) {
		checkIsSmimeEnabled().then((res) => {
			if ('data' in res) {
				useSmimeFeatureStore.getState().updateIsSmimeEnabled(true);
				addSettingsView({
					icon: 'AwardOutline',
					route: CERTIFICATES_ROUTE,
					label: t('settings.smime_certificates', 'S/MIME Certificates'),
					component: CertificatesView
				});
			} else {
				useSmimeFeatureStore.getState().updateIsSmimeEnabled(false);
			}
		});
	}

	addSettingsView({
		route: MAILS_ROUTE,
		label,
		subSections: getSettingsSubSections(backupSelfUndeleteAllowed),
		component: SettingsView
	});

	upsertApp({
		name: MAIL_APP_ID,
		display: label
	});
};
