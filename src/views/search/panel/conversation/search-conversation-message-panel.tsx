/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback } from 'react';

import { Padding } from '@zextras/carbonio-design-system';

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

	const messagePreviewFactory = useCallback(
		() => (
			<SearchConversationMessagePanel
				convMessageId={convMessageId}
				isExpanded={isExpanded}
				isAlone={isAlone}
				isInsideExtraWindow={isInsideExtraWindow}
			/>
		),
		[convMessageId, isAlone, isExpanded, isInsideExtraWindow]
	);

	return (
		<Padding bottom="medium" width="100%" data-testid={`ConversationMessagePreview-${message.id}`}>
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
