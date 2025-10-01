/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { Padding } from '@zextras/carbonio-design-system';

import { useCompleteMessageOrFetch } from 'store/emails/hooks/hooks';
import MailPreview from 'views/app/detail-panel/preview/mail-preview';
import {API_REQUEST_STATUS, MAILS_ROUTE} from "../../../../constants";
import {useNavigate} from "react-router-dom";

export type SearchConversationMessagePreviewProps = {
	convMessageId: string;
	isExpanded: boolean;
	isAlone: boolean;
};

export const SearchConversationMessagePanel = ({
	convMessageId,
	isExpanded,
	isAlone
}: SearchConversationMessagePreviewProps): React.JSX.Element => {
    const navigate = useNavigate();
	const { message, messageStatus } = useCompleteMessageOrFetch(convMessageId);

    if (messageStatus === API_REQUEST_STATUS.error) {
        navigate('/search', { replace: true });
    }

	if (!message) return <></>;
	return (
		<Padding bottom="medium" width="100%" data-testid={`ConversationMessagePreview-${message.id}`}>
			<MailPreview
				message={message}
				expanded={isExpanded}
				isAlone={isAlone}
				isMessageView={false}
			/>
		</Padding>
	);
};
