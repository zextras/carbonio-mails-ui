/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { filter, head, map, reduce, some } from 'lodash';
import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { useUserSettings } from '@zextras/carbonio-shell-ui';
import { fetchConversations } from '../store/actions';
import {
	selectConversationsArray,
	selectCurrentFolder,
	selectFolderSearchStatus
} from '../store/conversations-slice';
import { Conversation } from '../types/conversation';
import { StateType } from '../types/state';
import { selectFolders } from '../store/folders-slice';

type RouteParams = {
	folderId: string;
};

export const useConversationListItems = (): Array<Conversation> => {
	const [isLoading, setIsLoading] = useState(false);
	const { folderId } = <RouteParams>useParams();
	const folderStatus = useSelector((state) => selectFolderSearchStatus(<StateType>state, folderId));
	const conversations = useSelector(selectConversationsArray);
	const dispatch = useDispatch();
	const allFolders = useSelector(selectFolders);
	const sortBy = useUserSettings()?.prefs?.zimbraPrefConversationOrder || 'dateDesc';

	useEffect(() => {
		if (folderStatus !== 'complete' && !isLoading) {
			setIsLoading(true);
			// todo: to fix this error the dispatcher in shell must be fixed
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			dispatch(fetchConversations({ folderId, limit: 101, sortBy })).then(() => {
				setIsLoading(false);
			});
		}
	}, [dispatch, folderId, folderStatus, isLoading, sortBy]);

	/*	const sortedConversation = useMemo(() => {
		const updatedConversation = map(conversations, (c) => ({
			...c,
			date:
				head(filter(c.messages, { parent: folderId }).sort((a, b) => b.date - a.date))?.date ??
				c.date
		}));

		return updatedConversation?.sort((a, b) => b.date - a.date);
	}, [conversations, folderId]); */ // TODO: reintroduce after test

	return useMemo(() => {
		let currentFolderId = folderId;
		const currentFolder = allFolders[folderId];
		if (!!currentFolder && currentFolder.rid) {
			currentFolderId = `${currentFolder.zid}:${currentFolder.rid}`;
		}
		return reduce(
			/* sortedConversation, */ // TODO: reintroduce after test
			conversations,
			(acc, v) => (some(v.messages, ['parent', currentFolderId]) ? [...acc, v] : acc),
			[] as Array<Conversation>
		);
	}, [/* sortedConversation */ conversations, folderId, allFolders]);
};
