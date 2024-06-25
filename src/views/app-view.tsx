/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, Suspense, lazy, useEffect, useMemo, useState, useRef } from 'react';

import { Container } from '@zextras/carbonio-design-system';
import {
	FOLDERS,
	Spinner,
	setAppContext,
	useUserSettings,
	useLocalStorage
} from '@zextras/carbonio-shell-ui';
import { includes } from 'lodash';
import moment from 'moment';
import { Redirect, Route, Switch, useRouteMatch } from 'react-router-dom';

import { ResizableContainer } from './resizable-container';
import { LOCAL_STORAGE_COLUMN_SIZE } from '../constants';
import { getFolderIdParts } from '../helpers/folders';
import { useAppSelector } from '../hooks/redux';
import { SizeAndPosition } from '../hooks/use-resize';
import { selectCurrentFolder } from '../store/conversations-slice';

const LazyFolderView = lazy(
	() => import(/* webpackChunkName: "folder-panel-view" */ './app/folder-panel')
);

const LazyDetailPanel = lazy(
	() => import(/* webpackChunkName: "folder-panel-view" */ './app/detail-panel')
);

const AppView: FC = () => {
	const { path } = useRouteMatch();
	const [count, setCount] = useState(0);
	const { zimbraPrefGroupMailBy, zimbraPrefLocale } = useUserSettings().prefs;
	const currentFolderId = useAppSelector(selectCurrentFolder);
	const containerRef = useRef<HTMLDivElement>(null);

	const [lastSavedColumnWidth] = useLocalStorage<Partial<SizeAndPosition>>(
		LOCAL_STORAGE_COLUMN_SIZE,
		{}
	);

	const width = useMemo(() => {
		if (lastSavedColumnWidth) {
			return `${lastSavedColumnWidth}px`;
		}
		return '40%';
	}, [lastSavedColumnWidth]);

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

	return (
		<Container orientation="horizontal" mainAlignment="flex-start">
			<Container width={width} ref={containerRef}>
				<ResizableContainer
					elementToResize={containerRef}
					localStorageKey={LOCAL_STORAGE_COLUMN_SIZE}
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
			</Container>
			<Suspense fallback={<Spinner />}>
				<LazyDetailPanel />
			</Suspense>
		</Container>
	);
};

export default AppView;
