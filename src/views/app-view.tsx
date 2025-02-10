/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { Suspense, lazy, useEffect, useMemo, useState, useRef } from 'react';

import { setAppContext, useUserSettings } from '@zextras/carbonio-shell-ui';
import { includes } from 'lodash';
import moment from 'moment';
import { useParams } from 'react-router-dom';

import { FolderView } from './folder-view';
import { LayoutSelector } from './layout-selector';
import { Spinner } from '../assets/spinner';
import { FOLDERS } from '../carbonio-ui-commons/constants/folders';
import { useUpdateView } from '../carbonio-ui-commons/hooks/use-update-view';
import { getFolderIdParts } from '../helpers/folders';

const LazyDetailPanel = lazy(
	() => import(/* webpackChunkName: "folder-panel-view" */ './app/detail-panel')
);

const DetailPanel = (): React.JSX.Element => (
	<Suspense fallback={<Spinner />}>
		<LazyDetailPanel />
	</Suspense>
);

const AppView = (): React.JSX.Element => {
	const [count, setCount] = useState(0);
	const { zimbraPrefGroupMailBy, zimbraPrefLocale } = useUserSettings().prefs;
	const { folderId } = useParams<{ folderId: string }>();
	const containerRef = useRef<HTMLDivElement>(null);
	useUpdateView();

	const isMessageView = useMemo(
		() =>
			(zimbraPrefGroupMailBy && zimbraPrefGroupMailBy === 'message') ||
			includes([FOLDERS.DRAFTS, FOLDERS.TRASH], getFolderIdParts(folderId).id),
		[folderId, zimbraPrefGroupMailBy]
	);

	if (zimbraPrefLocale) {
		moment.locale(zimbraPrefLocale as string);
	}

	useEffect(() => {
		setAppContext({
			isMessageView,
			count,
			setCount
		});
	}, [count, isMessageView]);

	return (
		<LayoutSelector
			folderView={<FolderView containerRef={containerRef} />}
			detailPanel={<DetailPanel />}
			containerRef={containerRef}
		/>
	);
};

export default AppView;
