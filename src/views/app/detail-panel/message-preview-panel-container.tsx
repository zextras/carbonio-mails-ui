/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC } from 'react';

import { useParams } from 'react-router-dom';

import { MessagePreviewPanel } from './message-preview-panel';
import { useAppSelector } from '../../../hooks/redux';
import { useMessageActions } from '../../../hooks/use-message-actions';
import { selectMessage } from '../../../store/messages-slice';
import { MailsStateType } from '../../../types';

export const MessagePreviewPanelContainer: FC = () => {
	const { folderId, messageId } = useParams<{ folderId: string; messageId: string }>();
	const message = useAppSelector((state: MailsStateType) => selectMessage(state, messageId));
	const messageActions = useMessageActions(message, true);
	return (
		<MessagePreviewPanel
			folderId={folderId}
			messageId={messageId}
			messageActions={messageActions}
		/>
	);
};
