/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { Suspense, lazy, useRef } from 'react';

import { useUpdateView } from '@zextras/carbonio-ui-commons';

import { Spinner } from 'assets/spinner';
import { FolderView } from 'views/folder-view';
import { LayoutSelector } from 'views/layout-selector';

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
