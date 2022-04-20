/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { find, isEqual, orderBy, reduce, some } from 'lodash';
import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { replaceHistory, useTags, useUserSettings } from '@zextras/carbonio-shell-ui';
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
	const [tagsOnFirstLoad, setTagsOnFirstLoad] = useState(useTags());
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

	const tags = useTags();
	const reload = useMemo(() => !isEqual(tagsOnFirstLoad, tags), [tagsOnFirstLoad, tags]);
	useEffect(() => {
		if ((folderStatus !== 'complete' && folderStatus !== 'pending') || reload) {
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			dispatch(search({ folderId, limit: 101, sortBy: sorting, types: 'conversation' })).then(
				() => {
					setTagsOnFirstLoad(tags);
				}
			);
		}
	}, [dispatch, folderId, folderStatus, reload, sorting, tags]);

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
