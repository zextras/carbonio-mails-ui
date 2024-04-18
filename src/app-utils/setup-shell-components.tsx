import React, { Suspense, lazy } from 'react';

import {
	Spinner,
	addRoute,
	addSearchView,
	addBoardView,
	addSettingsView,
	t
} from '@zextras/carbonio-shell-ui';
import { MAILS_ROUTE } from '../constants';
import { applyProductFlavourAPI } from '../api/apply-product-flavour';
import { getSettingsSubSections } from '../views/settings/subsections';
import { StoreProvider } from '../store/redux';
import { ExtraWindowsManager } from '../views/app/extra-windows/extra-window-manager';
import { ModalManager } from '@zextras/carbonio-design-system';

export const setupShellComponents = async () => {
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
	const productFlavor = await applyProductFlavourAPI();
	addSettingsView({
		route: MAILS_ROUTE,
		label: t('label.app_name', 'Mails'),
		subSections: getSettingsSubSections(productFlavor),
		component: SettingsView
	});
};

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

const SearchView = (props: any) => (
	<Suspense fallback={<Spinner />}>
		<StoreProvider>
			<ExtraWindowsManager>
				<LazySearchView {...props} />
			</ExtraWindowsManager>
		</StoreProvider>
	</Suspense>
);

const SidebarView = (props: any) => (
	<Suspense fallback={<Spinner />}>
		<StoreProvider>
			<LazySidebarView {...props} />
		</StoreProvider>
	</Suspense>
);

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
