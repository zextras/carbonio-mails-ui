/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, Suspense, lazy, useEffect, useMemo, useState, useRef } from 'react';

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

import { LayoutSelector } from './layout-selector';
import { ResizableContainer } from './resizable-container';
import {
	BORDERS,
	LOCAL_STORAGE_LAYOUT,
	LOCAL_STORAGE_VIEW_SIZES,
	MAILS_VIEW_LAYOUTS
} from '../constants';
import { getFolderIdParts } from '../helpers/folders';
import { useAppSelector } from '../hooks/redux';
import { selectCurrentFolder } from '../store/conversations-slice';

type FolderViewProps = {
	containerRef: React.RefObject<HTMLDivElement>;
	listLayout: MailsListLayout;
};

const LazyFolderView = lazy(
	() => import(/* webpackChunkName: "folder-panel-view" */ './app/folder-panel')
);

const LazyDetailPanel = lazy(
	() => import(/* webpackChunkName: "folder-panel-view" */ './app/detail-panel')
);

const DetailPanel = (): React.JSX.Element => (
	<Suspense fallback={<Spinner />}>
		<LazyDetailPanel />
	</Suspense>
);

export type MailsListLayout = (typeof MAILS_VIEW_LAYOUTS)[keyof typeof MAILS_VIEW_LAYOUTS];

const FolderView = ({ listLayout, containerRef }: FolderViewProps): React.JSX.Element => {
	const { path } = useRouteMatch();
	const border = useMemo(
		() => (listLayout === MAILS_VIEW_LAYOUTS.VERTICAL ? BORDERS.EAST : BORDERS.SOUTH),
		[listLayout]
	);

	return (
		<ResizableContainer
			border={border}
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

	const [listLayout] = useLocalStorage<MailsListLayout>(
		LOCAL_STORAGE_LAYOUT,
		MAILS_VIEW_LAYOUTS.VERTICAL
	);

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
		<LayoutSelector
			listLayout={listLayout}
			folderView={<FolderView listLayout={listLayout} containerRef={containerRef} />}
			detailPanel={<DetailPanel />}
			containerRef={containerRef}
		/>
	);
};

export default AppView;
