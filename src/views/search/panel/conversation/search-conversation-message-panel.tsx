/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { Padding } from '@zextras/carbonio-design-system';

import { useCompleteMessageOrFetch } from '../../../../store/emails/hooks/hooks';
import MailPreview from '../../../app/detail-panel/preview/mail-preview';

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
	const { message } = useCompleteMessageOrFetch(convMessageId);

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
