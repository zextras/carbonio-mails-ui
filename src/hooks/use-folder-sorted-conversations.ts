/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useMemo } from 'react';

import { reduce, some, sortBy } from 'lodash';

import { useAppSelector } from './redux';
import { getFolder } from '../carbonio-ui-commons/store/zustand/folder';
import { selectConversationsArray } from '../store/conversations-slice';
import type { Conversation } from '../types';

export const useFolderSortedConversations = (folderId: string): Array<Conversation> => {
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

	return useMemo(() => sortBy(filteredConversations, 'sortIndex'), [filteredConversations]);
};
