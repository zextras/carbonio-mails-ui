/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { find, isEqual, orderBy, reduce, some } from 'lodash';
import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { getTags, Tag, useTags, useUserSettings } from '@zextras/carbonio-shell-ui';
import { search } from '../store/actions';
import { selectConversationsArray, selectFolderSearchStatus } from '../store/conversations-slice';
import { Conversation } from '../types/conversation';
import { StateType } from '../types/state';
import { selectFolder } from '../store/folders-slice';

type RouteParams = {
	folderId: string;
};

export const useConversationListItems = (): Array<Conversation> => {
	const { folderId } = <RouteParams>useParams();
	const dispatch = useDispatch();
	const { zimbraPrefSortOrder } = useUserSettings()?.prefs as Record<string, string>;
	const folderStatus = useSelector((state) => selectFolderSearchStatus(<StateType>state, folderId));
	const conversations = useSelector(selectConversationsArray);
	const folder = useSelector(selectFolder(folderId));

	const sorting = useMemo(
		() =>
			(find(zimbraPrefSortOrder?.split(','), (f) => f.split(':')?.[0] === folderId)?.split(
				':'
			)?.[1] as 'dateAsc' | 'dateDesc' | undefined) ?? 'dateDesc',
		[folderId, zimbraPrefSortOrder]
	);

	const sortedConversations = useMemo(
		() => orderBy(conversations, 'date', sorting === 'dateDesc' ? 'desc' : 'asc'),
		[conversations, sorting]
	);

	useEffect(() => {
		if (folderStatus !== 'complete' && folderStatus !== 'pending') {
			dispatch(search({ folderId, limit: 101, sortBy: sorting, types: 'conversation' }));
		}
	}, [dispatch, folderId, folderStatus, sorting]);

	return useMemo(
		() =>
			reduce(
				sortedConversations,
				(acc, v) =>
					some(v.messages, ['parent', folder?.rid ? `${folder.zid}:${folder.rid}` : folder.id])
						? [...acc, v]
						: acc,
				[] as Array<Conversation>
			),
		[sortedConversations, folder?.rid, folder?.zid, folder?.id]
	);
};
