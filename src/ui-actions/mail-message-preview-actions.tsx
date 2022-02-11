/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/* eslint-disable import/extensions */
/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable import/no-unresolved */
import React, { useContext, useMemo, FC, ReactElement } from 'react';
import {
	Row,
	Dropdown,
	IconButton,
	SnackbarManagerContext,
	useModal
} from '@zextras/carbonio-design-system';
import { includes, map } from 'lodash';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { useIntegratedComponent, useAppContext, FOLDERS } from '@zextras/carbonio-shell-ui';

import {
	deleteMsg,
	editAsNewMsg,
	editDraft,
	forwardMsg,
	moveMsgToTrash,
	redirectMsg,
	replyAllMsg,
	replyMsg,
	sendDraft,
	setMsgFlag,
	setMsgAsSpam,
	printMsg,
	showOriginalMsg,
	setMsgRead
	// @ts-ignore
} from './message-actions';
import { MailMessage } from '../types/mail-message';
import { useSelection } from '../hooks/useSelection';

type MailMsgPreviewActionsType = {
	folderId: string;
	message: MailMessage;
	timezone: string;
};
const MailMsgPreviewActions: FC<MailMsgPreviewActionsType> = ({
	message,
	folderId,
	timezone
}): ReactElement => {
	const [t] = useTranslation();
	const createSnackbar = useContext(SnackbarManagerContext);
	const dispatch = useDispatch();
	const createModal = useModal();
	const ContactInput = useIntegratedComponent('contact-input');
	const { setCount } = useAppContext();
	const { deselectAll } = useSelection(folderId, setCount);
	const systemFolders = useMemo(
		() => [FOLDERS.INBOX, FOLDERS.SENT, FOLDERS.DRAFTS, FOLDERS.TRASH, FOLDERS.SPAM],
		[]
	);
	const primaryActions = useMemo(() => {
		const arr = [];

		if (message.parent === FOLDERS.DRAFTS) {
			arr.push(
				sendDraft(message.id, message, t, dispatch),
				editDraft(message.id, folderId, t),
				moveMsgToTrash(
					[message.id],
					t,
					dispatch,
					createSnackbar,
					deselectAll,
					folderId,
					message.conversation
				)
			);
		}
		if (
			message.parent === FOLDERS.INBOX ||
			message.parent === FOLDERS.SENT ||
			!includes(systemFolders, message.parent)
		) {
			// INBOX, SENT OR CREATED_FOLDER
			arr.push(
				replyMsg(message.id, folderId, t),
				setMsgFlag([message.id], message.flagged, t, dispatch),
				moveMsgToTrash(
					[message.id],
					t,
					dispatch,
					createSnackbar,
					deselectAll,
					folderId,
					message.conversation
				)
			);
		}

		if (message.parent === FOLDERS.TRASH) {
			arr.push(
				setMsgFlag([message.id], message.flagged, t, dispatch),
				deleteMsg([message.id], t, dispatch, createSnackbar, createModal),
				setMsgAsSpam([message.id], false, t, dispatch, createSnackbar),
				printMsg(message.id, t, timezone),
				showOriginalMsg(message.id, t)
			);
		}
		if (message.parent === FOLDERS.SPAM) {
			arr.push(
				deleteMsg([message.id], t, dispatch, createSnackbar, createModal),
				setMsgAsSpam([message.id], true, t, dispatch, createSnackbar),
				printMsg(message.id, t, timezone),
				showOriginalMsg(message.id, t)
			);
		}
		return arr;
	}, [
		message,
		systemFolders,
		t,
		dispatch,
		folderId,
		createSnackbar,
		deselectAll,
		createModal,
		timezone
	]);

	const secondaryActions = useMemo(() => {
		const arr = [];
		if (message.parent === FOLDERS.DRAFTS) {
			arr.push(setMsgFlag([message.id], message.flagged, t, dispatch));
		}
		if (
			message.parent === FOLDERS.INBOX ||
			message.parent === FOLDERS.SENT ||
			!includes(systemFolders, message.parent)
		) {
			// INBOX, SENT OR CREATED_FOLDER
			arr.push(
				replyAllMsg(message.id, folderId, t),
				forwardMsg(message.id, folderId, t),
				editAsNewMsg(message.id, folderId, t),
				setMsgAsSpam([message.id], false, t, dispatch, createSnackbar),
				printMsg(message.id, t, timezone),
				showOriginalMsg(message.id, t),
				redirectMsg(message.id, t, dispatch, createSnackbar, createModal, ContactInput),
				setMsgRead([message.id], message.read, t, dispatch, folderId, deselectAll)
			);
		}
		return arr;
	}, [
		message,
		deselectAll,
		systemFolders,
		t,
		dispatch,
		folderId,
		timezone,
		createSnackbar,
		createModal,
		ContactInput
	]);
	return (
		<Row>
			{map(primaryActions, (action) => (
				<IconButton
					size="small"
					icon={action.icon}
					onClick={(ev: React.MouseEvent<HTMLButtonElement>): void => {
						if (ev) ev.preventDefault();
						action.click();
					}}
				/>
			))}
			{secondaryActions.length > 0 && (
				<Dropdown placement="right-end" items={secondaryActions}>
					<IconButton size="small" icon="MoreVertical" />
				</Dropdown>
			)}
		</Row>
	);
};

export default MailMsgPreviewActions;
