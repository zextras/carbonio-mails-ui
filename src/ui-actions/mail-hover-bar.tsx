/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { IconButton, Row, Tooltip } from '@zextras/carbonio-design-system';
import { FOLDERS } from '@zextras/carbonio-shell-ui';
import { map } from 'lodash';
import React, { FC, useMemo } from 'react';
import styled from 'styled-components';
import { useAppDispatch } from '../hooks/redux';
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
	right: 0.5rem;
	top: 0.5rem;
`;

type MailHoverBarPropType = {
	messageId: string;
	read: boolean;
	flag: boolean;
	folderId: string;
	showReplyAll: boolean;
};
const MailHoverBar: FC<MailHoverBarPropType> = ({
	messageId,
	read,
	flag,
	folderId,
	showReplyAll
}) => {
	const dispatch = useAppDispatch();
	const ids = useMemo(() => [messageId], [messageId]);

	const actions = useMemo(() => {
		switch (folderId) {
			case FOLDERS.TRASH:
			case FOLDERS.SPAM:
				return [
					deleteMsg({ ids, dispatch }),
					setMsgRead({ ids, value: read, dispatch }),
					// archiveMsg(),
					setMsgFlag({ ids, value: flag, dispatch })
				];
			case FOLDERS.SENT:
				return [
					moveMsgToTrash({ ids, dispatch, folderId }),
					// archiveMsg(),
					forwardMsg({ id: messageId, folderId }),
					setMsgFlag({ ids, value: flag, dispatch })
				];
			case FOLDERS.DRAFTS:
				return [
					moveMsgToTrash({ ids, dispatch, folderId }),
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
							//	showReplyAll && replyAllMsg(messageId, folderId, t),
							replyAllMsg({ id: messageId, folderId }),
							setMsgFlag({ ids, value: flag, dispatch }),
							forwardMsg({ id: messageId, folderId }),
							// archiveMsg(),
							moveMsgToTrash({ ids, dispatch, folderId })
					  ]
					: [
							setMsgRead({ ids, value: read, dispatch }),
							replyMsg({ id: messageId, folderId }),
							setMsgFlag({ ids, value: flag, dispatch }),
							forwardMsg({ id: messageId, folderId }),
							// archiveMsg(),
							moveMsgToTrash({ ids, dispatch, folderId })
					  ];
		}
	}, [folderId, ids, dispatch, read, flag, messageId, showReplyAll]);

	return (
		<ButtonBar orientation="horizontal">
			{map(actions, (action) => (
				<Tooltip key={`${messageId}-${action.icon}`} label={action.label}>
					<IconButton
						size="medium"
						icon={action.icon}
						onClick={(ev): void => {
							ev.preventDefault();
							action.onClick(ev);
						}}
					/>
				</Tooltip>
			))}
		</ButtonBar>
	);
};
export default MailHoverBar;
