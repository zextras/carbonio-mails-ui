/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { lazy, Suspense, useMemo } from 'react';

import { Spinner } from '@zextras/carbonio-shell-ui';
import { Redirect, Route, Switch, useRouteMatch } from 'react-router-dom';

import { ResizableContainer } from './resizable-container';
import {
	BORDERS,
	LOCAL_STORAGE_VIEW_SIZES,
	MAILS_VIEW_LAYOUTS,
	MAILS_VIEW_SPLIT_LAYOUT_ORIENTATIONS
} from '../constants';

export type MailsListLayout = (typeof MAILS_VIEW_LAYOUTS)[keyof typeof MAILS_VIEW_LAYOUTS];

export type MailsSplitLayoutOrientation =
	(typeof MAILS_VIEW_SPLIT_LAYOUT_ORIENTATIONS)[keyof typeof MAILS_VIEW_SPLIT_LAYOUT_ORIENTATIONS];

type FolderViewProps = {
	containerRef: React.RefObject<HTMLDivElement>;
	listLayout: MailsListLayout;
	splitLayoutOrientation: MailsSplitLayoutOrientation;
};

const LazyFolderView = lazy(
	() => import(/* webpackChunkName: "folder-panel-view" */ './app/folder-panel')
);

export const FolderView = ({
	listLayout,
	splitLayoutOrientation,
	containerRef
}: FolderViewProps): React.JSX.Element => {
	const { path } = useRouteMatch();
	const border = useMemo(
		() =>
			splitLayoutOrientation === MAILS_VIEW_SPLIT_LAYOUT_ORIENTATIONS.VERTICAL
				? BORDERS.EAST
				: BORDERS.SOUTH,
		[splitLayoutOrientation]
	);

	const resizeDisabled = useMemo(() => listLayout !== MAILS_VIEW_LAYOUTS.SPLIT, [listLayout]);

	return (
		<ResizableContainer
			border={border}
			elementToResize={containerRef}
			localStorageKey={LOCAL_STORAGE_VIEW_SIZES}
			keepSyncedWithStorage
			disabled={resizeDisabled}
		>
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
