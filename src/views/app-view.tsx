/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, Suspense, lazy, useEffect, useMemo, useState, useRef } from 'react';

import { Spinner, setAppContext, useUserSettings } from '@zextras/carbonio-shell-ui';
import { includes } from 'lodash';
import moment from 'moment';

import { FolderView } from './folder-view';
import { LayoutSelector } from './layout-selector';
import { FOLDERS } from '../carbonio-ui-commons/constants/folders';
import { useUpdateView } from '../carbonio-ui-commons/hooks/use-update-view';
import { getFolderIdParts } from '../helpers/folders';
import { useAppSelector } from '../hooks/redux';
import { selectCurrentFolder } from '../store/conversations-slice';

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
	const [catalog, setCatalog] = useState();
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
		fetch('/services/catalog/services')
			.then((res) => res.json())
			.then((res) => {
				if (res.items) {
					setCatalog(res.items);
				}
			});
	}, []);

	useEffect(() => {
		setAppContext({ isMessageView, count, setCount, catalog });
	}, [catalog, count, isMessageView]);

	return (
		<LayoutSelector
			folderView={<FolderView containerRef={containerRef} />}
			detailPanel={<DetailPanel />}
			containerRef={containerRef}
		/>
	);
};

export default AppView;
