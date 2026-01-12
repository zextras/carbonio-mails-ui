/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { lazy, Suspense, useRef } from 'react';

import { ThemeProvider } from '@zextras/carbonio-design-system';
import { useUpdateView } from '@zextras/carbonio-ui-commons';

import { Spinner } from '../assets/spinner';
import { themeMuiExtension } from '../theme/theme-mui';
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
		<ThemeProvider extension={themeMuiExtension}>
			<LayoutSelector
				folderView={<FolderView containerRef={containerRef} />}
				detailPanel={<DetailPanel />}
				containerRef={containerRef}
			/>
		</ThemeProvider>
	);
};

export default AppView;
