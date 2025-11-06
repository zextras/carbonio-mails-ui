/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { useCompleteMessageOrFetch } from '../../../store/emails/hooks/use-complete-message-or-fetch';
import { useNavigate, useParams } from 'react-router-dom';

import { API_REQUEST_STATUS, MAILS_ROUTE } from '../../../constants';
import { Spinner } from 'assets/spinner';
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
	const { message, messageStatus } = useCompleteMessageOrFetch(convMessageId);
	const navigate = useNavigate();

	const { folderId } = useParams();

	if (messageStatus === API_REQUEST_STATUS.error) {
		navigate(`/${MAILS_ROUTE}/folder/${folderId}`, { replace: true });
	}
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
