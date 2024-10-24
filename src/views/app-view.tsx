/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, Suspense, lazy, useEffect, useMemo, useState, useRef } from 'react';

import { Spinner, setAppContext, useUserSettings } from '@zextras/carbonio-shell-ui';
import { includes, isNil } from 'lodash';
import moment from 'moment';

import { FolderView } from './folder-view';
import { LayoutSelector } from './layout-selector';
import { requestServiceCatalog } from '../api/request-service-catalog';
import { FOLDERS } from '../carbonio-ui-commons/constants/folders';
import { useUpdateView } from '../carbonio-ui-commons/hooks/use-update-view';
import { getFolderIdParts } from '../helpers/folders';
import { useAppSelector } from '../hooks/redux';
import { selectCurrentFolder } from '../store/conversations-slice';
import { ServicesCatalog } from '../types';

const LazyDetailPanel = lazy(
	() => import(/* webpackChunkName: "folder-panel-view" */ './app/detail-panel')
);

const DetailPanel = (): React.JSX.Element => (
	<Suspense fallback={<Spinner />}>
		<LazyDetailPanel />
	</Suspense>
);

const AppView: FC = () => {
	const [count, setCount] = useState(0);
	const [servicesCatalog, setServicesCatalog] = useState<ServicesCatalog>();
	const { zimbraPrefGroupMailBy, zimbraPrefLocale } = useUserSettings().prefs;
	const currentFolderId = useAppSelector(selectCurrentFolder);
	const containerRef = useRef<HTMLDivElement>(null);
	useUpdateView();

	const isMessageView = useMemo(
		() =>
			(zimbraPrefGroupMailBy && zimbraPrefGroupMailBy === 'message') ||
			includes([FOLDERS.DRAFTS, FOLDERS.TRASH], getFolderIdParts(currentFolderId).id),
		[currentFolderId, zimbraPrefGroupMailBy]
	);

	if (zimbraPrefLocale) {
		moment.locale(zimbraPrefLocale as string);
	}

	useEffect(() => {
		requestServiceCatalog().then((res) => {
			if (!isNil(res)) {
				setServicesCatalog(res);
			} else {
				setServicesCatalog([]);
			}
		});
	}, []);

	useEffect(() => {
		setAppContext({ isMessageView, count, setCount, servicesCatalog });
	}, [servicesCatalog, count, isMessageView]);

	return (
		<LayoutSelector
			folderView={<FolderView containerRef={containerRef} />}
			detailPanel={<DetailPanel />}
			containerRef={containerRef}
		/>
	);
};

export default AppView;
