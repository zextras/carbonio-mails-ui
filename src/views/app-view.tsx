/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, Suspense, lazy, useEffect, useMemo, useState, useRef } from 'react';

import { FOLDERS, Spinner, setAppContext, useUserSettings } from '@zextras/carbonio-shell-ui';
import { includes } from 'lodash';
import moment from 'moment';
import { Redirect, Route, Switch, useRouteMatch } from 'react-router-dom';

import { LayoutSelector } from './layout-selector';
import { ResizableContainer } from './resizable-container';
import { BORDERS, LOCAL_STORAGE_VIEW_SIZES } from '../constants';
import { getFolderIdParts } from '../helpers/folders';
import { useAppSelector } from '../hooks/redux';
import { selectCurrentFolder } from '../store/conversations-slice';

type FolderViewProps = {
	containerRef: React.RefObject<HTMLDivElement>;
	isColumnView: boolean;
	hidePreview: boolean;
};

type DetailPanelProps = {
	hidePreview: boolean;
};

const LazyFolderView = lazy(
	() => import(/* webpackChunkName: "folder-panel-view" */ './app/folder-panel')
);

const LazyDetailPanel = lazy(
	() => import(/* webpackChunkName: "folder-panel-view" */ './app/detail-panel')
);

const DetailPanel = ({ hidePreview }: DetailPanelProps): React.JSX.Element | null =>
	!hidePreview ? (
		<Suspense fallback={<Spinner />}>
			<LazyDetailPanel />
		</Suspense>
	) : null;

const FolderView = ({
	isColumnView,
	hidePreview,
	containerRef
}: FolderViewProps): React.JSX.Element => {
	const { path } = useRouteMatch();
	const border = useMemo(() => (isColumnView ? BORDERS.EAST : BORDERS.SOUTH), [isColumnView]);

	return (
		<ResizableContainer
			border={border}
			disabled={hidePreview}
			elementToResize={containerRef}
			localStorageKey={LOCAL_STORAGE_VIEW_SIZES}
			keepSyncedWithStorage
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
const AppView: FC = () => {
	const [count, setCount] = useState(0);
	const { zimbraPrefGroupMailBy, zimbraPrefLocale } = useUserSettings().prefs;
	const currentFolderId = useAppSelector(selectCurrentFolder);
	const containerRef = useRef<HTMLDivElement>(null);

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
		setAppContext({ isMessageView, count, setCount });
	}, [count, isMessageView]);

	const isColumnView = false;
	const hidePreview = false;

	return (
		<LayoutSelector
			isColumnView={isColumnView}
			hidePreview={hidePreview}
			folderView={
				<FolderView
					isColumnView={isColumnView}
					hidePreview={hidePreview}
					containerRef={containerRef}
				/>
			}
			detailPanel={<DetailPanel hidePreview={hidePreview} />}
			containerRef={containerRef}
		/>
	);
};

export default AppView;
