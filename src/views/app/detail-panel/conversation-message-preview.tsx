/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useCallback } from 'react';

import { Padding } from '@zextras/carbonio-design-system';

import { MessagePreviewPanel } from './message-preview-panel';
import MailPreview from './preview/mail-preview';
import { getParentFolderId } from '../../../helpers/folders';
import { useMessageById } from '../../../store/zustand/emails/store';
import { ConvMessage } from '../../../types';

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
	const message = useMessageById(convMessage.id);
	const messagePreviewFactory = useCallback(() => {
		const folderId = getParentFolderId(message.parent);
		return <MessagePreviewPanel folderId={folderId} messageId={message.id} />;
	}, [message.id, message.parent]);

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
				isMessageView={false}
				isInsideExtraWindow={isInsideExtraWindow}
				messagePreviewFactory={messagePreviewFactory}
			/>
		</Padding>
	);
};
