/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { reduce, some } from 'lodash';
import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
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

	useEffect(() => {
		if (folderStatus !== 'complete' && !isLoading) {
			setIsLoading(true);
			// todo: to fix this error the dispatcher in shell must be fixed
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			dispatch(fetchConversations({ folderId, limit: 101 })).then(() => {
				setIsLoading(false);
			});
		}
	}, [dispatch, folderId, folderStatus, isLoading]);

	return useMemo(() => {
		let currentFolderId = folderId;
		const currentFolder = allFolders[folderId];
		if (!!currentFolder && currentFolder.rid) {
			currentFolderId = `${currentFolder.zid}:${currentFolder.rid}`;
		}
		return reduce(
			conversations,
			(acc, v) => (some(v.messages, ['parent', currentFolderId]) ? [...acc, v] : acc),
			[] as Array<Conversation>
		);
	}, [conversations, folderId, allFolders]);
};
