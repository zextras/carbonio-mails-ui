/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useEffect, useMemo } from 'react';

import { useUserSettings } from '@zextras/carbonio-shell-ui';
import { reduce, some, sortBy } from 'lodash';
import { useParams } from 'react-router-dom';

import { useAppDispatch, useAppSelector } from './redux';
import { getFolder } from '../carbonio-ui-commons/store/zustand/folder/hooks';
import { LIST_LIMIT } from '../constants';
import { parseMessageSortingOptions } from '../helpers/sorting';
import { search } from '../store/actions';
import {
	selectConversationsArray,
	selectConversationsSearchRequestStatus
} from '../store/conversations-slice';
import type { Conversation } from '../types';

type RouteParams = {
	folderId: string;
};

export const useConversationListItems = (): Array<Conversation> => {
	const { folderId } = <RouteParams>useParams();
	const dispatch = useAppDispatch();
	const { prefs } = useUserSettings();
	const { sortOrder } = parseMessageSortingOptions(folderId, prefs.zimbraPrefSortOrder as string);
	const searchRequestStatus = useAppSelector(selectConversationsSearchRequestStatus);
	const conversations = useAppSelector(selectConversationsArray);
	const folder = getFolder(folderId);

	const filteredConversations = useMemo(
		() =>
			folder
				? reduce(
						conversations,
						(acc, v) =>
							some(v.messages, [
								'parent',
								'rid' in folder && folder?.rid ? `${folder.zid}:${folder.rid}` : folder.id
							])
								? [...acc, v]
								: acc,
						[] as Array<Conversation>
				  )
				: [],
		[folder, conversations]
	);

	const sortedConversations = useMemo(
		() => sortBy(filteredConversations, 'sortIndex'),
		[filteredConversations]
	);
	// this useEffect is used to trigger the search action when the folder is changed
	useEffect(() => {
		if (searchRequestStatus !== null) return;
		dispatch(
			search({
				folderId,
				limit: LIST_LIMIT.INITIAL_LIMIT,
				sortBy: sortOrder,
				types: 'conversation'
			})
		);
	}, [dispatch, folderId, searchRequestStatus, sortOrder]);

	return sortedConversations;
};
