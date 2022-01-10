/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { IconButton, Row, SnackbarManagerContext, Tooltip, useModal } from '@zextras/zapp-ui';
import React, { useContext, useMemo } from 'react';
import { map } from 'lodash';
import styled from 'styled-components';
import { useReplaceHistoryCallback, FOLDERS } from '@zextras/zapp-shell';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import {
	deleteMsg,
	editDraft,
	forwardMsg,
	moveMsgToTrash,
	replyAllMsg,
	replyMsg,
	setMsgFlag,
	setMsgRead
} from './message-actions';

const ButtonBar = styled(Row)`
	position: absolute;
	right: 8px;
	top: 8px;
`;

export default function MailHoverBar({ messageId, read, flag, folderId, showReplyAll }) {
	const dispatch = useDispatch();
	const [t] = useTranslation();
	const createSnackbar = useContext(SnackbarManagerContext);
	const createModal = useModal();
	const replaceHistory = useReplaceHistoryCallback();
	const ids = useMemo(() => [messageId], [messageId]);

	const actions = useMemo(() => {
		switch (folderId) {
			case FOLDERS.TRASH:
			case FOLDERS.SPAM:
				return [
					deleteMsg(ids, t, dispatch, createSnackbar, createModal),
					setMsgRead(ids, read, t, dispatch),
					// archiveMsg(),
					setMsgFlag(ids, flag, t, dispatch)
				];
			case FOLDERS.SENT:
				return [
					moveMsgToTrash(ids, t, dispatch, createSnackbar, folderId, replaceHistory),
					// archiveMsg(),
					forwardMsg(messageId, folderId, t, replaceHistory),
					setMsgFlag(ids, flag, t, dispatch)
				];
			case FOLDERS.DRAFTS:
				return [
					moveMsgToTrash(ids, t, dispatch, createSnackbar, folderId, replaceHistory),
					editDraft(messageId, folderId, t, replaceHistory),
					// archiveMsg(),
					setMsgFlag(ids, flag, t, dispatch)
				];
			// TODO: discuss about Outbox and Archive folder-panel
			case FOLDERS.INBOX:
			default:
				return showReplyAll
					? [
							setMsgRead(ids, read, t, dispatch),
							replyMsg(messageId, folderId, t, replaceHistory),
							//	showReplyAll && replyAllMsg(messageId, folderId, t, replaceHistory),
							replyAllMsg(messageId, folderId, t, replaceHistory),
							setMsgFlag(ids, flag, t, dispatch),
							forwardMsg(messageId, folderId, t, replaceHistory),
							// archiveMsg(),
							moveMsgToTrash(ids, t, dispatch, createSnackbar, folderId, replaceHistory)
					  ]
					: [
							setMsgRead(ids, read, t, dispatch),
							replyMsg(messageId, folderId, t, replaceHistory),
							setMsgFlag(ids, flag, t, dispatch),
							forwardMsg(messageId, folderId, t, replaceHistory),
							// archiveMsg(),
							moveMsgToTrash(ids, t, dispatch, createSnackbar, folderId, replaceHistory)
					  ];
		}
	}, [
		folderId,
		ids,
		t,
		dispatch,
		createSnackbar,
		createModal,
		read,
		flag,
		messageId,
		replaceHistory,
		showReplyAll
	]);

	return (
		<ButtonBar orientation="horizontal">
			{map(actions, (action) => (
				<Tooltip key={`${messageId}-${action.icon}`} label={action.label}>
					<IconButton
						size="medium"
						icon={action.icon}
						onClick={(ev) => {
							ev.preventDefault();
							action.click();
						}}
					/>
				</Tooltip>
			))}
		</ButtonBar>
	);
}
