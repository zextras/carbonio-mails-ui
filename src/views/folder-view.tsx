/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { lazy, Suspense, useMemo } from 'react';

import { Spinner } from '@zextras/carbonio-shell-ui';
import { Redirect, Route, Switch, useRouteMatch } from 'react-router-dom';

import { ResizableContainer } from './resizable-container';
import { BORDERS, MAILS_VIEW_LAYOUTS, MAILS_VIEW_SPLIT_LAYOUT_ORIENTATIONS } from '../constants';
import { useViewLayout } from '../hooks/use-view-layout';

export type MailsListLayout = (typeof MAILS_VIEW_LAYOUTS)[keyof typeof MAILS_VIEW_LAYOUTS];

export type MailsSplitLayoutOrientation =
	(typeof MAILS_VIEW_SPLIT_LAYOUT_ORIENTATIONS)[keyof typeof MAILS_VIEW_SPLIT_LAYOUT_ORIENTATIONS];

type FolderViewProps = {
	containerRef: React.RefObject<HTMLDivElement>;
};

const LazyFolderView = lazy(
	() => import(/* webpackChunkName: "folder-panel-view" */ './app/folder-panel')
);

export const FolderView = ({ containerRef }: FolderViewProps): React.JSX.Element => {
	const { path } = useRouteMatch();
	const { isCurrentLayoutHorizontalSplit, isCurrentLayoutSplit } = useViewLayout();
	const border = useMemo(
		() => (isCurrentLayoutHorizontalSplit ? BORDERS.SOUTH : BORDERS.EAST),
		[isCurrentLayoutHorizontalSplit]
	);

	const resizeDisabled = useMemo(() => !isCurrentLayoutSplit, [isCurrentLayoutSplit]);

	return (
		<ResizableContainer border={border} elementToResize={containerRef} disabled={resizeDisabled}>
			<Switch>
				<Route path={`${path}/folder/:folderId/:type?/:itemId?`}>
					<Suspense fallback={<Spinner />}>
						<LazyFolderView />
					</Suspense>
				</Route>
				<Redirect strict from={path} to={`${path}/folder/2`} />
			</Switch>
		</ResizableContainer>
	);
};
