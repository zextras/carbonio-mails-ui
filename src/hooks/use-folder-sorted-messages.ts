/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useMemo } from 'react';

import { filter, sortBy } from 'lodash';

import { useAppSelector } from './redux';
import { getFolder } from '../carbonio-ui-commons/store/zustand/folder';
import { selectMessagesArray } from '../store/messages-slice';
import type { MailMessage } from '../types';

export const useFolderSortedMessages = (folderId: string): Array<MailMessage> => {
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

	return useMemo(() => sortBy(filteredMessages, 'sortIndex'), [filteredMessages]);
};
