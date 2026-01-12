/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { lazy, Suspense, useMemo } from 'react';

import { Navigate, Route, Routes } from 'react-router-dom';

import { Spinner } from 'assets/spinner';
import { BORDERS, MAILS_VIEW_LAYOUTS, MAILS_VIEW_SPLIT_LAYOUT_ORIENTATIONS } from 'constants/index';
import { useViewLayout } from 'hooks/use-view-layout';
import { ResizableContainer } from 'views/resizable-container';

export type MailsListLayout = (typeof MAILS_VIEW_LAYOUTS)[keyof typeof MAILS_VIEW_LAYOUTS];

export type MailsSplitLayoutOrientation =
	(typeof MAILS_VIEW_SPLIT_LAYOUT_ORIENTATIONS)[keyof typeof MAILS_VIEW_SPLIT_LAYOUT_ORIENTATIONS];

type FolderViewProps = {
	containerRef: React.RefObject<HTMLDivElement>;
};

const LazyFolderPanel = lazy(
	() => import(/* webpackChunkName: "folder-panel-view" */ './app/folder-panel')
);

export const FolderView = ({ containerRef }: FolderViewProps): React.JSX.Element => {
	const { isCurrentLayoutHorizontalSplit, isCurrentLayoutSplit } = useViewLayout();
	const border = useMemo(
		() => (isCurrentLayoutHorizontalSplit ? BORDERS.SOUTH : BORDERS.EAST),
		[isCurrentLayoutHorizontalSplit]
	);

	const resizeDisabled = useMemo(() => !isCurrentLayoutSplit, [isCurrentLayoutSplit]);

	return (
		<ResizableContainer border={border} elementToResize={containerRef} disabled={resizeDisabled}>
			<Routes>
				<Route
					path={`folder/:folderId/:type?/:itemId?`}
					element={
						<Suspense fallback={<Spinner />}>
							<LazyFolderPanel />
						</Suspense>
					}
				/>
				<Route path="/" element={<Navigate to={'folder/2'} replace />} />
			</Routes>
		</ResizableContainer>
	);
};
