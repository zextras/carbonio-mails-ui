/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { orderBy, reduce, some } from 'lodash';
import { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { getFolder } from '@zextras/carbonio-shell-ui';
import { search } from '../store/actions';
import { selectConversationsArray, selectFolderSearchStatus } from '../store/conversations-slice';
import { Conversation, StateType } from '../types';

type RouteParams = {
	folderId: string;
};

export const useConversationListItems = (): Array<Conversation> => {
	const { folderId } = <RouteParams>useParams();
	const dispatch = useDispatch();
	const folderStatus = useSelector((state) => selectFolderSearchStatus(<StateType>state, folderId));
	const conversations = useSelector(selectConversationsArray);
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
			reduce(
				conversations,
				(acc, v) =>
					some(v.messages, ['parent', folder?.rid ? `${folder.zid}:${folder.rid}` : folder.id])
						? [...acc, v]
						: acc,
				[] as Array<Conversation>
			),
		[conversations, folder?.rid, folder?.zid, folder?.id]
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
