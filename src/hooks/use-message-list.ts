/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useEffect, useMemo } from 'react';

import { useUserSettings } from '@zextras/carbonio-shell-ui';
import { useParams } from 'react-router-dom';

import { getFolder } from '../carbonio-ui-commons/store/zustand/folder/hooks';
import { LIST_LIMIT } from '../constants';
import { parseMessageSortingOptions } from '../helpers/sorting';
import { search } from '../store/actions';
import { useMessages } from '../store/zustand/emails/store';

type RouteParams = {
	folderId: string;
};

export const useMessageList = (): Set<string> => {
	const { folderId } = <RouteParams>useParams();
	const { prefs: userSettings } = useUserSettings();
	const { sortOrder } = parseMessageSortingOptions(
		folderId,
		userSettings.zimbraPrefSortOrder as string
	);

	const messages = useMessages();
	const folder = getFolder(folderId);

	const filteredMessages = useMemo(() => {
		const messageSet = new Set<string>();
		if (folder) {
			const wantedFolderId =
				'rid' in folder && folder?.rid ? `${folder.zid}:${folder.rid}` : folder.id;
			messages.messageIds.forEach((id) => {
				if (id === wantedFolderId) {
					messageSet.add(id);
				}
			});
		}
		return messageSet;
	}, [folder, messages]);

	useEffect(() => {
		if (messages.status !== null) return;
		search({
			folderId,
			limit: LIST_LIMIT.INITIAL_LIMIT + 1,
			sortBy: sortOrder,
			types: 'message'
		});
	}, [folderId, messages.status, sortOrder]);

	return filteredMessages;
};
