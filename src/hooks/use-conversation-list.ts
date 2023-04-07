/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { getFolder } from '@zextras/carbonio-shell-ui';
import { orderBy, reduce, some } from 'lodash';
import { useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { search } from '../store/actions';
import { selectConversationsArray, selectFolderSearchStatus } from '../store/conversations-slice';
import { Conversation, StateType } from '../types';
import { useAppDispatch, useAppSelector } from './redux';

type RouteParams = {
	folderId: string;
};

export const useConversationListItems = (): Array<Conversation> => {
	const { folderId } = <RouteParams>useParams();
	const dispatch = useAppDispatch();
	const folderStatus = useAppSelector((state) =>
		selectFolderSearchStatus(<StateType>state, folderId)
	);
	const conversations = useAppSelector(selectConversationsArray);
	const folder = getFolder(folderId);

	/* NOTE: Need to comment out when need to sort as per the configured sort order */
	// const { zimbraPrefSortOrder } = useUserSettings()?.prefs as Record<string, string>;
	// const sorting = useMemo(
	// 	() =>
	// 		(find(zimbraPrefSortOrder?.split(','), (f) => f.split(':')?.[0] === folderId)?.split(
	// 			':'
	// 		)?.[1] as 'dateAsc' | 'dateDesc' | undefined) ?? 'dateDesc',
	// 	[folderId, zimbraPrefSortOrder]
	// );

	// const sortedConversations = useMemo(
	// 	() => orderBy(conversations, 'date', sorting === 'dateDesc' ? 'desc' : 'asc'),
	// 	[conversations, sorting]
	// );

	const filteredConversations = useMemo(
		() =>
			folder
				? reduce(
						conversations,
						(acc, v) =>
							some(v.messages, ['parent', folder?.rid ? `${folder.zid}:${folder.rid}` : folder.id])
								? [...acc, v]
								: acc,
						[] as Array<Conversation>
				  )
				: [],
		[folder, conversations]
	);

	const sortedConversations = useMemo(
		() => orderBy(filteredConversations, 'date', 'desc'),
		[filteredConversations]
	);

	useEffect(() => {
		if (folderStatus !== 'complete' && folderStatus !== 'pending') {
			dispatch(search({ folderId, limit: 101, sortBy: 'dateDesc', types: 'conversation' }));
		}
	}, [dispatch, folderId, folderStatus]);

	return sortedConversations;
};
