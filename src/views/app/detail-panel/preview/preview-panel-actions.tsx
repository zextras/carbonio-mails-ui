/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useContext, useMemo } from 'react';
import {
	Container,
	Dropdown,
	IconButton,
	Padding,
	SnackbarManagerContext
} from '@zextras/carbonio-design-system';
import { map } from 'lodash';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { FOLDERS, useAppContext, useUserAccount } from '@zextras/carbonio-shell-ui';
import {
	moveConversationToTrash,
	printConversation,
	setConversationsFlag,
	setConversationsRead
} from '../../../../ui-actions/conversation-actions';
import { replyAllMsg, replyMsg, setMsgRead } from '../../../../ui-actions/message-actions';
import { useSelection } from '../../../../hooks/useSelection';
import { Conversation, MailMessage } from '../../../../types';

type PreviewPanelActionsType = {
	item: Conversation;
	folderId: string;
	isMessageView: boolean;
	conversation: Conversation;
};
const PreviewPanelActions: FC<PreviewPanelActionsType> = ({
	item,
	folderId,
	isMessageView,
	conversation
}) => {
	const [t] = useTranslation();
	const createSnackbar = useContext(SnackbarManagerContext);
	const dispatch = useDispatch();
	const account = useUserAccount();

	const { setCount } = useAppContext();
	const { deselectAll } = useSelection(folderId, setCount);

	const ids = useMemo(() => [item?.id], [item?.id]);

	const primaryActions = useMemo(() => {
		switch (folderId) {
			case FOLDERS.SENT:
				return [
					moveConversationToTrash({ ids, t, dispatch, createSnackbar, deselectAll, folderId })
				];
			case FOLDERS.TRASH:
			case FOLDERS.SPAM:
				return [
					// TODO: deleteConversation
				];
			case FOLDERS.INBOX:
			default:
				return [
					replyMsg({ id: item?.messages?.[0]?.id ?? item?.id, folderId, t }),
					moveConversationToTrash({ ids, t, dispatch, createSnackbar, deselectAll, folderId })
					// archiveMsg
					// editTagsMsg
				];
		}
	}, [createSnackbar, dispatch, folderId, ids, item, deselectAll, t]);

	const secondaryActions = useMemo(() => {
		switch (folderId) {
			case FOLDERS.SENT:
				// return [setConversationsFlag(ids, item.flagged, t, dispatch)];
				return [setConversationsFlag({ ids, value: item?.flagged, t, dispatch })];
			case FOLDERS.TRASH:
			case FOLDERS.SPAM:
				return [
					isMessageView
						? setMsgRead({ ids, value: item?.read, t, dispatch, folderId })
						: setConversationsRead({
								ids,
								value: conversation.read,
								t,
								dispatch,
								folderId,
								shouldReplaceHistory: true,
								deselectAll
						  }),
					setConversationsFlag({ ids, value: item?.flagged, t, dispatch })
					// setConversationsSpam(ids, true, t, dispatch)
				];
			case FOLDERS.INBOX:
			default:
				return [
					replyAllMsg({ id: item?.messages?.[0]?.id ?? item?.id, folderId, t }),
					isMessageView
						? setMsgRead({ ids, value: item?.read, t, dispatch, folderId })
						: setConversationsRead({
								ids,
								value: conversation.read,
								t,
								dispatch,
								folderId,
								shouldReplaceHistory: false,
								deselectAll
						  }),
					setConversationsFlag({ ids, value: item?.flagged, t, dispatch }),
					printConversation(t, conversation, account)
					// setConversationsSpam(ids, false, t, dispatch)
					// archiveMsg
					// editTagsMsg
				];
		}
	}, [
		folderId,
		ids,
		item?.flagged,
		item?.read,
		item?.messages,
		item?.id,
		t,
		dispatch,
		isMessageView,
		conversation,
		deselectAll,
		account
	]);

	return (
		<Container
			orientation="horizontal"
			mainAlignment="flex-end"
			crossAlignment="center"
			height="auto"
			padding={{ horizontal: 'large', vertical: 'small' }}
			background="gray5"
		>
			{map(primaryActions, (action) => (
				<Padding left="extrasmall" key={action.label}>
					<IconButton
						key={action.id}
						size="medium"
						icon={action.icon}
						onClick={(ev: React.MouseEvent<HTMLElement>): void => {
							if (ev) ev.preventDefault();
							action.click();
						}}
					/>
				</Padding>
			))}

			<Padding left="extrasmall">
				<Dropdown
					placement="right-end"
					items={map(secondaryActions, (action) => ({
						id: action.label,
						icon: action.icon,
						label: action.label,
						click: (ev: React.MouseEvent<HTMLElement>): void => {
							if (ev) ev.preventDefault();
							action.click();
						}
					}))}
				>
					<IconButton size="medium" icon="MoreVertical" onClick={(): null => null} />
				</Dropdown>
			</Padding>
		</Container>
	);
};

export default PreviewPanelActions;
