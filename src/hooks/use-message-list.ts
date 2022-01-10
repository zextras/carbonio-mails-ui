/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { find, reduce, some, uniqBy } from 'lodash';
import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { fetchConversations } from '../store/actions';
import { selectConversationsArray, selectFolderSearchStatus } from '../store/conversations-slice';
import { Conversation } from '../types/conversation';
import { StateType } from '../types/state';
import { selectFolders } from '../store/folders-slice';
import { selectMessages } from '../store/messages-slice';

type RouteParams = {
	folderId: string;
};

export const useMessageList = (): Array<Conversation> => {
	const [isLoading, setIsLoading] = useState(false);
	const { folderId } = <RouteParams>useParams();
	const folderStatus = useSelector((state) => selectFolderSearchStatus(<StateType>state, folderId));
	const conversations = useSelector(selectConversationsArray);

	const dispatch = useDispatch();
	const allFolders = useSelector(selectFolders);

	useEffect(() => {
		if (folderStatus !== 'complete' && !isLoading) {
			setIsLoading(true);
			// todo: to fix this error the dispatcher in shell must be fixed
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			dispatch(fetchConversations({ folderId, limit: 101 })).then(() => {
				setIsLoading(false);
			});
		}
	}, [dispatch, folderId, folderStatus, isLoading]);
	const messages = useSelector(selectMessages);

	return useMemo(() => {
		let currentFolderId = folderId;
		const currentFolder = allFolders[folderId];
		if (!!currentFolder && currentFolder.rid) {
			currentFolderId = `${currentFolder.zid}:${currentFolder.rid}`;
		}

		const reducedConversations = reduce(
			conversations,
			(acc2, v2) => (some(v2.messages, ['parent', currentFolderId]) ? [...acc2, v2] : acc2),
			[] as Array<Conversation>
		);

		const messageList = reduce(
			reducedConversations,
			(accumulator, item) => [
				...accumulator,
				...uniqBy(
					reduce(
						item.messages,
						// eslint-disable-next-line @typescript-eslint/ban-ts-comment
						// @ts-ignore
						(acc, v) => {
							const msg = find(messages, ['id', v.id]);
							if (msg) {
								if (folderId === msg.parent) {
									return [...acc, { ...msg, convId: item.id }];
								}
							}
							return acc;
						},
						[]
					),
					'id'
				)
			],
			[]
		);

		return messageList;
	}, [folderId, allFolders, conversations, messages]);
};
