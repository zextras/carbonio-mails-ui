/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { getFolder } from '@zextras/carbonio-shell-ui';
import { filter, orderBy } from 'lodash';
import { useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { search } from '../store/actions';
import { selectFolderMsgSearchStatus, selectMessagesArray } from '../store/messages-slice';
import { MailMessage } from '../types';
import { useAppDispatch, useAppSelector } from './redux';

type RouteParams = {
	folderId: string;
};

export const useMessageList = (): Array<MailMessage> => {
	const { folderId } = <RouteParams>useParams();
	const dispatch = useAppDispatch();

	const folderMsgStatus = useAppSelector(selectFolderMsgSearchStatus(folderId));
	const messages = useAppSelector(selectMessagesArray);
	const folder = getFolder(folderId);

	const filteredMessages = useMemo(
		() =>
			folder
				? filter(messages, ['parent', folder?.rid ? `${folder.zid}:${folder.rid}` : folder.id])
				: [],
		[folder, messages]
	);

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

	const sortedMessages = useMemo(
		() => orderBy(filteredMessages, 'date', 'desc'),
		[filteredMessages]
	);

	useEffect(() => {
		if (folderMsgStatus !== 'complete' && folderMsgStatus !== 'pending') {
			dispatch(search({ folderId, limit: 101, sortBy: 'dateDesc', types: 'message' }));
		}
	}, [dispatch, folderId, folderMsgStatus]);

	return sortedMessages;
};
