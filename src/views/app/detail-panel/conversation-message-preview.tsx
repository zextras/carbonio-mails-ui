/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC } from 'react';

import { Padding } from '@zextras/carbonio-design-system';

import MailPreview from './preview/mail-preview';
import { useMessageActions } from '../../../hooks/use-message-actions';
import { MailMessage } from '../../../types';

export type ConversationMessagePreviewProps = {
	message: MailMessage;
	idPrefix: string;
	isExpanded: boolean;
	isAlone: boolean;
	isInsideExtraWindow: boolean;
};

export const ConversationMessagePreview: FC<ConversationMessagePreviewProps> = ({
	idPrefix,
	message,
	isExpanded,
	isAlone,
	isInsideExtraWindow
}) => {
	const messageActions = useMessageActions(message, isAlone);
	return (
		<Padding key={`${idPrefix}-${message.id}`} bottom="medium" width="100%">
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
