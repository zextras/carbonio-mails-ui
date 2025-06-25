/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { Spinner } from 'assets/spinner';
import { useCompleteMessageOrFetch } from 'store/emails/hooks/hooks';
import { ConversationMessagePreview } from 'views/app/detail-panel/conversation-message-preview';

export const ConversationMessagePreviewWrapper = ({
	convMessageId,
	isExpanded,
	isAlone
}: {
	convMessageId: string;
	isExpanded: boolean;
	isAlone: boolean;
}): React.JSX.Element => {
	const { message } = useCompleteMessageOrFetch(convMessageId);
	return message ? (
		<ConversationMessagePreview
			key={message.id}
			message={message}
			isExpanded={isExpanded}
			isAlone={isAlone}
		/>
	) : (
		<Spinner />
	);
};
