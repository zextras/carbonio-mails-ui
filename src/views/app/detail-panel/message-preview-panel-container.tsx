/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC } from 'react';

import { useAppContext } from '@zextras/carbonio-shell-ui';
import { useParams } from 'react-router-dom';

import { MessagePreviewPanel } from './message-preview-panel';
import { useAppSelector } from '../../../hooks/redux';
import { useMessageActions } from '../../../hooks/use-message-actions';
import { useSelection } from '../../../hooks/use-selection';
import { selectMessage } from '../../../store/messages-slice';
import { AppContext, MailsStateType } from '../../../types';
import { useMsgConvActions } from '../../../ui-actions/use-msg-conv-actions';

export const MessagePreviewPanelContainer: FC = () => {
	const { folderId, messageId } = useParams<{ folderId: string; messageId: string }>();
	const message = useAppSelector((state: MailsStateType) => selectMessage(state, messageId));
	const { setCount } = useAppContext<AppContext>();
	const { deselectAll } = useSelection({ setCount, count: 0 });

	const messageActionsForExtraWindow = useMessageActions({
		message,
		isAlone: true,
		isForExtraWindow: true
	});
	const messageActions = useMsgConvActions({
		item: message,
		deselectAll,
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
