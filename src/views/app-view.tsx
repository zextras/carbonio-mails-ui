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

const LazyFolderView = lazy(
	() => import(/* webpackChunkName: "folder-panel-view" */ './app/folder-panel')
);

const AppView: FC = () => {
	const { path } = useRouteMatch();
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

	const isColumnView = true;
	const hidePreview = true;

	const border = useMemo(() => (isColumnView ? BORDERS.EAST : BORDERS.SOUTH), [isColumnView]);
	return (
		<LayoutSelector
			isColumnView={isColumnView}
			hidePreview={hidePreview}
			containerRef={containerRef}
		>
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
		</LayoutSelector>
	);
};

export default AppView;
