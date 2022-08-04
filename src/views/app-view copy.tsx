/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { Suspense, lazy, useState, useEffect, useMemo, ReactElement } from 'react';
import { Redirect, Switch, Route, useRouteMatch } from 'react-router-dom';
import { FOLDERS, setAppContext, Spinner, useUserSettings } from '@zextras/carbonio-shell-ui';
import { Container } from '@zextras/carbonio-design-system';
import { useSelector } from 'react-redux';
import { includes } from 'lodash';
import { selectCurrentFolder } from '../store/conversations-slice';

const LazyFolderView = lazy(
	() => import(/* webpackChunkName: "folder-panel-view" */ './app/folder-panel')
);

const LazyDetailPanel = lazy(
	() => import(/* webpackChunkName: "folder-panel-view" */ './app/detail-panel')
);

const AppView = (): ReactElement => {
	const { path } = useRouteMatch();
	const [count, setCount] = useState(0);
	const { zimbraPrefGroupMailBy } = useUserSettings().prefs;
	const currentFolderId = useSelector(selectCurrentFolder);

	const isMessageView = useMemo(
		() =>
			zimbraPrefGroupMailBy
				? zimbraPrefGroupMailBy === 'message' ||
				  includes([FOLDERS.DRAFTS, FOLDERS.TRASH], currentFolderId)
				: undefined,
		[currentFolderId, zimbraPrefGroupMailBy]
	);

	useEffect(() => {
		setAppContext({ isMessageView, count, setCount });
	}, [count, isMessageView]);

	return (
		<Container orientation="horizontal" mainAlignment="flex-start">
			<Container width="40%">
				<Switch>
					<Route path={`${path}/folder/:folderId/:type?/:itemId?`}>
						<Suspense fallback={<Spinner />}>
							<LazyFolderView />
						</Suspense>
					</Route>
					<Redirect strict from={path} to={`${path}/folder/2`} />
				</Switch>
			</Container>
			<Suspense fallback={<Spinner />}>
				<LazyDetailPanel />
			</Suspense>
		</Container>
	);
};

export default AppView;
