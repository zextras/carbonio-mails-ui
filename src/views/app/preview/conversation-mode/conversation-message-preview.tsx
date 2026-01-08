/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { Padding } from '@zextras/carbonio-design-system';
import { useNavigate, useParams } from 'react-router-dom';

import { Spinner } from '../../../../assets/spinner';
import { API_REQUEST_STATUS, MAILS_ROUTE } from '../../../../constants';
import { useCompleteMessageOrFetch } from '../../../../store/emails/hooks/hooks';
import MailPreview from '../preview/mail-preview';

export const ConversationMessagePreview = ({
	convMessageId,
	isExpanded,
	isAlone
}: {
	convMessageId: string;
	isExpanded: boolean;
	isAlone: boolean;
}): React.JSX.Element => {
	const { message, messageStatus } = useCompleteMessageOrFetch({
		messageId: convMessageId
	});
	const navigate = useNavigate();

	const { folderId } = useParams();

	if (messageStatus === API_REQUEST_STATUS.error) {
		navigate(`/${MAILS_ROUTE}/folder/${folderId}`, { replace: true });
	}
	return message ? (
		<Padding bottom="medium" width="100%" data-testid={`ConversationMessagePreview-${message.id}`}>
			<MailPreview
				message={message}
				expanded={isExpanded}
				isAlone={isAlone}
				isMessageView={false}
			/>
		</Padding>
	) : (
		<Spinner />
	);
};
