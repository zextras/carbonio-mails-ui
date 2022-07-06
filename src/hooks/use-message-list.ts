/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { filter, orderBy } from 'lodash';
import { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { search } from '../store/actions';
import { selectFolder } from '../store/folders-slice';
import { selectFolderMsgSearchStatus, selectMessagesArray } from '../store/messages-slice';
import { MailMessage } from '../types';

type RouteParams = {
	folderId: string;
};

export const useMessageList = (): Array<Partial<MailMessage>> => {
	const { folderId } = <RouteParams>useParams();
	const dispatch = useDispatch();

	const folderMsgStatus = useSelector(selectFolderMsgSearchStatus(folderId));
	const messages = useSelector(selectMessagesArray);
	const folder = useSelector(selectFolder(folderId));

	/* NOTE: Need to comment out when need to sort as per the configured sort order */
	// const { zimbraPrefSortOrder } = useUserSettings()?.prefs as Record<string, string>;
	// const sorting = useMemo(
	// 	() =>
	// 		(find(zimbraPrefSortOrder?.split(','), (f) => f.split(':')?.[0] === folderId)?.split(
	// 			':'
	// 		)?.[1] as 'dateAsc' | 'dateDesc' | undefined) ?? 'dateDesc',
	// 	[folderId, zimbraPrefSortOrder]
	// );

	// const sortedMessages = useMemo(
	// 	() => orderBy(messages, 'date', sorting === 'dateDesc' ? 'desc' : 'asc'),
	// 	[messages, sorting]
	// );

	const sortedMessages = useMemo(() => orderBy(messages, 'date', 'desc'), [messages]);

	useEffect(() => {
		if (folderMsgStatus !== 'complete' && folderMsgStatus !== 'pending') {
			dispatch(search({ folderId, limit: 101, sortBy: 'dateDesc', types: 'message' }));
		}
	}, [dispatch, folderId, folderMsgStatus]);

	return useMemo(
		() =>
			filter(sortedMessages, ['parent', folder?.rid ? `${folder.zid}:${folder.rid}` : folder.id]),
		[folder?.id, folder?.rid, folder?.zid, sortedMessages]
	);
};
