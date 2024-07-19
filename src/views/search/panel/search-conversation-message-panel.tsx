/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { Padding } from '@zextras/carbonio-design-system';

import { useMessageActions } from '../../../hooks/use-message-actions';
import { useMessageById } from '../../../store/zustand/message-store/store';
import { ConvMessage } from '../../../types';
import MailPreview from '../../app/detail-panel/preview/mail-preview';

export type SearchConversationMessagePreviewProps = {
	convMessage: ConvMessage;
	isExpanded: boolean;
	isAlone: boolean;
	isInsideExtraWindow: boolean;
};

export const SearchConversationMessagePanel = ({
	convMessage,
	isExpanded,
	isAlone,
	isInsideExtraWindow
}: SearchConversationMessagePreviewProps): React.JSX.Element => {
	const message = useMessageById(convMessage.id);
	const messageActions = useMessageActions(message, isAlone);
	return (
		<Padding bottom="medium" width="100%" data-testid={`ConversationMessagePreview-${message.id}`}>
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
