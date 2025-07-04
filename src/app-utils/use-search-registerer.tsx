/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { lazy, Suspense, useEffect } from 'react';

import { ModalManager } from '@zextras/carbonio-design-system';
import type * as Search from '@zextras/carbonio-search-ui';
import { useIntegratedFunction } from '@zextras/carbonio-shell-ui';
import { useTranslation } from 'react-i18next';

import { Spinner } from 'assets/spinner';
import { MAIL_APP_ID, MAILS_ROUTE } from 'constants/index';

const LazySearchView = lazy(
	() => import(/* webpackChunkName: "mail-search-view" */ '../views/search/search-view')
);

const SearchView = (props: Search.SearchViewProps): React.JSX.Element => (
	<Suspense fallback={<Spinner />}>
		<ModalManager>
			<LazySearchView {...props} />
		</ModalManager>
	</Suspense>
);

export const useSearchRegisterer = (): void => {
	const [t] = useTranslation();
	const [addSearchView, isAddSearchViewAvailable] =
		useIntegratedFunction<typeof Search.addSearchView>('search-add-view');
	const [removeSearchView, isRemoveSearchViewAvailable] =
		useIntegratedFunction<typeof Search.removeSearchView>('search-remove-view');

	useEffect(() => {
		if (isAddSearchViewAvailable) {
			addSearchView({
				id: MAIL_APP_ID,
				app: MAIL_APP_ID,
				icon: 'MailModOutline',
				route: MAILS_ROUTE,
				component: SearchView,
				label: t('label.app_name', 'Mails'),
				position: 100
			});
		}

		return () => {
			if (isRemoveSearchViewAvailable) {
				removeSearchView(MAIL_APP_ID);
			}
		};
	}, [addSearchView, isAddSearchViewAvailable, isRemoveSearchViewAvailable, removeSearchView, t]);
};
