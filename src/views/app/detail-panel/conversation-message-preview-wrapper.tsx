/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { ConversationMessagePreview } from './conversation-message-preview';
import { useCompleteMessageOrFetch } from '../../../store/emails/hooks/hooks';

export const ConversationMessagePreviewWrapper = ({
	convMessageId,
	isExpanded,
	isInsideExtraWindow,
	isAlone
}: {
	convMessageId: string;
	isExpanded: boolean;
	isInsideExtraWindow: boolean;
	isAlone: boolean;
}): React.JSX.Element => {
	const { message } = useCompleteMessageOrFetch(convMessageId);
	return message ? (
		<ConversationMessagePreview
			key={message.id}
			message={message}
			isExpanded={isExpanded}
			isAlone={isAlone}
			isInsideExtraWindow={isInsideExtraWindow}
		/>
	) : (
		<></>
	);
};
