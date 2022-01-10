/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { Suspense, lazy, useState, useEffect, useCallback } from 'react';
import { Redirect, Switch, Route, useRouteMatch } from 'react-router-dom';
import { setAppContext, Spinner } from '@zextras/zapp-shell';
import { Container } from '@zextras/zapp-ui';

const LazyFolderView = lazy(() =>
	import(/* webpackChunkName: "folder-panel-view" */ './app/folder-panel')
);

const LazyDetailPanel = lazy(() =>
	import(/* webpackChunkName: "folder-panel-view" */ './app/detail-panel')
);

const AppView = () => {
	const { path } = useRouteMatch();
	const [count, setCount] = useState(0);
	const [isMessageView, setIsMessageView] = useState(false);

	const toggleView = useCallback(() => {
		setIsMessageView(!isMessageView);
	}, [isMessageView]);

	useEffect(() => {
		setAppContext({ isMessageView, setIsMessageView, toggleView, count, setCount });
	}, [count, isMessageView, toggleView]);

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
