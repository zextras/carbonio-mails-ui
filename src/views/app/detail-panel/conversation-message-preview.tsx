/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC } from 'react';

import { Padding } from '@zextras/carbonio-design-system';

import MailPreview from './preview/mail-preview';
import { useAppSelector } from '../../../hooks/redux';
import { useMessageActions } from '../../../hooks/use-message-actions';
import { selectMessage } from '../../../store/messages-slice';
import { ConvMessage, MailsStateType } from '../../../types';

export type ConversationMessagePreviewProps = {
	convMessage: ConvMessage;
	isExpanded: boolean;
	isAlone: boolean;
	isInsideExtraWindow: boolean;
};

export const ConversationMessagePreview: FC<ConversationMessagePreviewProps> = ({
	convMessage,
	isExpanded,
	isAlone,
	isInsideExtraWindow
}) => {
	const message = useAppSelector((state: MailsStateType) => selectMessage(state, convMessage.id));
	const messageActions = useMessageActions(message, isAlone);

	return (
		<Padding
			height="fit"
			bottom="medium"
			width="100%"
			data-testid={`ConversationMessagePreview-${message.id}`}
		>
			<MailPreview
				message={message}
				expanded={isExpanded}
				isAlone={isAlone}
				messageActions={messageActions}
				isMessageView={false}
				isInsideExtraWindow={isInsideExtraWindow}
			/>
		</Padding>
	);
};
