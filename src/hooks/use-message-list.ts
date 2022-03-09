/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { filter } from 'lodash';
import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { search } from '../store/actions';
import { MailMessage } from '../types/mail-message';
import { StateType } from '../types/state';
import { selectFolderMsgSearchStatus, selectMessagesArray } from '../store/messages-slice';

type RouteParams = {
	folderId: string;
};

export const useMessageList = (): Array<Partial<MailMessage>> => {
	const [isLoading, setIsLoading] = useState(false);
	const { folderId } = <RouteParams>useParams();
	const folderMsgStatus = useSelector((state) =>
		selectFolderMsgSearchStatus(<StateType>state, folderId)
	);
	const messages = useSelector(selectMessagesArray);

	const dispatch = useDispatch();

	useEffect(() => {
		if (folderMsgStatus !== 'complete' && !isLoading) {
			setIsLoading(true);
			// todo: to fix this error the dispatcher in shell must be fixed
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			dispatch(search({ folderId, limit: 101, types: 'message' })).then(() => {
				setIsLoading(false);
			});
		}
	}, [dispatch, folderId, folderMsgStatus, isLoading]);

	const currentList = useMemo(() => filter(messages, ['parent', folderId]), [folderId, messages]);

	return currentList;
};
