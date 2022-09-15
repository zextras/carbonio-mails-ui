/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import {
	IconButton,
	Row,
	SnackbarManagerContext,
	Tooltip,
	useModal
} from '@zextras/carbonio-design-system';
import React, { useContext, useMemo } from 'react';
import { map } from 'lodash';
import styled from 'styled-components';
import { FOLDERS } from '@zextras/carbonio-shell-ui';
import { useDispatch } from 'react-redux';
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
	const createSnackbar = useContext(SnackbarManagerContext);
	const createModal = useModal();
	const ids = useMemo(() => [messageId], [messageId]);

	const actions = useMemo(() => {
		switch (folderId) {
			case FOLDERS.TRASH:
			case FOLDERS.SPAM:
				return [
					deleteMsg({ ids, dispatch, createSnackbar, createModal }),
					setMsgRead({ ids, value: read, dispatch }),
					// archiveMsg(),
					setMsgFlag({ ids, value: flag, dispatch })
				];
			case FOLDERS.SENT:
				return [
					moveMsgToTrash(ids, dispatch, createSnackbar, folderId),
					// archiveMsg(),
					forwardMsg({ id: messageId, folderId }),
					setMsgFlag({ ids, value: flag, dispatch })
				];
			case FOLDERS.DRAFTS:
				return [
					moveMsgToTrash(ids, dispatch, createSnackbar, folderId),
					editDraft({ id: messageId, folderId }),
					// archiveMsg(),
					setMsgFlag({ ids, value: flag, dispatch })
				];
			// TODO: discuss about Outbox and Archive folder-panel
			case FOLDERS.INBOX:
			default:
				return showReplyAll
					? [
							setMsgRead({ ids, value: read, dispatch }),
							replyMsg({ id: messageId, folderId }),
							//	showReplyAll && replyAllMsg(messageId, folderId),
							replyAllMsg({ id: messageId, folderId }),
							setMsgFlag({ ids, value: flag, dispatch }),
							forwardMsg({ id: messageId, folderId }),
							// archiveMsg(),
							moveMsgToTrash(ids, dispatch, createSnackbar, folderId)
					  ]
					: [
							setMsgRead({ ids, value: read, dispatch }),
							replyMsg({ id: messageId, folderId }),
							setMsgFlag({ ids, value: flag, dispatch }),
							forwardMsg({ id: messageId, folderId }),
							// archiveMsg(),
							moveMsgToTrash(ids, dispatch, createSnackbar, folderId)
					  ];
		}
	}, [folderId, ids, dispatch, createSnackbar, createModal, read, flag, messageId, showReplyAll]);

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
