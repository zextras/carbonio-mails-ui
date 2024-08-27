/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { Padding } from '@zextras/carbonio-design-system';

import { useMessageActions } from '../../../../hooks/use-message-actions';
import { useMessageById } from '../../../../store/zustand/search/store';
import MailPreview from '../../../app/detail-panel/preview/mail-preview';

export type SearchConversationMessagePreviewProps = {
	convMessageId: string;
	isExpanded: boolean;
	isAlone: boolean;
	isInsideExtraWindow: boolean;
};

export const SearchConversationMessagePanel = ({
	convMessageId,
	isExpanded,
	isAlone,
	isInsideExtraWindow
}: SearchConversationMessagePreviewProps): React.JSX.Element => {
	const message = useMessageById(convMessageId);
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
