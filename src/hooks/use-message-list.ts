/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useEffect, useMemo } from 'react';

import { useUserSettings } from '@zextras/carbonio-shell-ui';
import { filter, sortBy } from 'lodash';
import { useParams } from 'react-router-dom';

import { useAppDispatch, useAppSelector } from './redux';
import { getFolder } from '../carbonio-ui-commons/store/zustand/folder/hooks';
import { parseMessageSortingOptions } from '../helpers/sorting';
import { search } from '../store/actions';
import { selectFolderMsgSearchStatus, selectMessagesArray } from '../store/messages-slice';
import type { MailMessage } from '../types';

type RouteParams = {
	folderId: string;
};

export const useMessageList = (): Array<MailMessage> => {
	const { folderId } = <RouteParams>useParams();
	const dispatch = useAppDispatch();
	const { prefs } = useUserSettings();
	const { sortOrder } = parseMessageSortingOptions(folderId, prefs.zimbraPrefSortOrder as string);

	const folderMsgStatus = useAppSelector(selectFolderMsgSearchStatus(folderId));
	const messages = useAppSelector(selectMessagesArray);
	const folder = getFolder(folderId);

	const filteredMessages = useMemo(
		() =>
			folder
				? filter(messages, [
						'parent',
						'rid' in folder && folder?.rid ? `${folder.zid}:${folder.rid}` : folder.id
				  ])
				: [],
		[folder, messages]
	);

	const sortedMessages = useMemo(() => sortBy(filteredMessages, 'sortIndex'), [filteredMessages]);

	useEffect(() => {
		if (folderMsgStatus !== 'complete' && folderMsgStatus !== 'pending') {
			dispatch(search({ folderId, limit: 101, sortBy: sortOrder, types: 'message' }));
		}
	}, [dispatch, folderId, folderMsgStatus, sortOrder]);

	return sortedMessages;
};
