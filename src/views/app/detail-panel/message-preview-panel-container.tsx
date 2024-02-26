/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC } from 'react';

import { useAppContext, useTags } from '@zextras/carbonio-shell-ui';
import { useParams } from 'react-router-dom';

import { MessagePreviewPanel } from './message-preview-panel';
import { useAppDispatch, useAppSelector } from '../../../hooks/redux';
import { useMessageActions } from '../../../hooks/use-message-actions';
import { useSelection } from '../../../hooks/use-selection';
import { selectMessage } from '../../../store/messages-slice';
import { AppContext, MailsStateType } from '../../../types';
import { getMsgConvActions } from '../../../ui-actions/get-msg-conv-actions';
import { useExtraWindowsManager } from '../extra-windows/extra-window-manager';

export const MessagePreviewPanelContainer: FC = () => {
	const { folderId, messageId } = useParams<{ folderId: string; messageId: string }>();
	const message = useAppSelector((state: MailsStateType) => selectMessage(state, messageId));
	const dispatch = useAppDispatch();
	const { setCount } = useAppContext<AppContext>();
	const { deselectAll } = useSelection({ currentFolderId: folderId, setCount, count: 0 });
	const tags = useTags();
	const { createWindow } = useExtraWindowsManager();
	const messageActionsForExtraWindow = useMessageActions(message, true);
	const messageActions = getMsgConvActions({
		item: message,
		dispatch,
		deselectAll,
		tags,
		createWindow,
		messageActionsForExtraWindow
	});
	return (
		<MessagePreviewPanel
			folderId={folderId}
			messageId={messageId}
			messageActions={messageActions}
		/>
	);
};
