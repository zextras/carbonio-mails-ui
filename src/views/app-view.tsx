/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { Suspense, lazy, useRef } from 'react';

import { FolderView } from './folder-view';
import { LayoutSelector } from './layout-selector';
import { Spinner } from '../assets/spinner';
import { useUpdateView } from '../carbonio-ui-commons/hooks/use-update-view';

const LazyDetailPanel = lazy(
	() => import(/* webpackChunkName: "folder-panel-view" */ './app/detail-panel')
);

const DetailPanel = (): React.JSX.Element => (
	<Suspense fallback={<Spinner />}>
		<LazyDetailPanel />
	</Suspense>
);

const AppView = (): React.JSX.Element => {
	const containerRef = useRef<HTMLDivElement>(null);
	useUpdateView();

	return (
		<LayoutSelector
			folderView={<FolderView containerRef={containerRef} />}
			detailPanel={<DetailPanel />}
			containerRef={containerRef}
		/>
	);
};

export default AppView;
