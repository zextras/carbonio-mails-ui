/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { Suspense, lazy, useRef } from 'react';

import { ThemeProvider } from '@zextras/carbonio-design-system';
import { useUpdateView } from '@zextras/carbonio-ui-commons';

import { FolderRoutes } from './folder-routes';
import { Spinner } from '../../assets/spinner';
import { themeMuiExtension } from '../../theme/theme-mui';
import { LayoutSelector } from '../layout-selector';

const LazyDetailPanel = lazy(
	() => import(/* webpackChunkName: "folder-panel-view" */ './detail-panel/detail-panel')
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
				folderView={<FolderRoutes containerRef={containerRef} />}
				detailPanel={<DetailPanel />}
				containerRef={containerRef}
			/>
		</ThemeProvider>
	);
};

export default AppView;
