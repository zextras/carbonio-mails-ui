/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, Suspense, lazy, useEffect, useMemo, useState, useRef } from 'react';

import { Container } from '@zextras/carbonio-design-system';
import { FOLDERS, Spinner, setAppContext, useUserSettings } from '@zextras/carbonio-shell-ui';
import { includes } from 'lodash';
import moment from 'moment';
import { Redirect, Route, Switch, useRouteMatch } from 'react-router-dom';

import { getFolderIdParts } from '../helpers/folders';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { resetConversationSlice, selectCurrentFolder } from '../store/conversations-slice';
import { resetMessageSlice } from '../store/messages-slice';

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

	const isMessageView = useMemo(
		() =>
			(zimbraPrefGroupMailBy && zimbraPrefGroupMailBy === 'message') ||
			includes([FOLDERS.DRAFTS, FOLDERS.TRASH], getFolderIdParts(currentFolderId).id),
		[currentFolderId, zimbraPrefGroupMailBy]
	);

	if (zimbraPrefLocale) {
		moment.locale(zimbraPrefLocale as string);
	}

	const dispatch = useAppDispatch();

	useEffect(() => {
		const lastApp = localStorage.getItem('lastApp');
		if ( lastApp == "search" || lastApp == "" ) {
			dispatch(resetConversationSlice());
			dispatch(resetMessageSlice());
			localStorage.setItem('lastApp','mail');
		}
		setAppContext({ isMessageView, count, setCount });
	}, [path, count, isMessageView,dispatch]);

	return (
		<Container orientation="horizontal" mainAlignment="flex-start">
			<Container width="40%"
				id="appContainer"
				style={{
					overflow: 'auto',
					resize: 'horizontal'
				}}
			>
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
