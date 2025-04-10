/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { Padding } from '@zextras/carbonio-design-system';

import MailPreview from './preview/mail-preview';
import { MailMessage } from '../../../types';

export type ConversationMessagePreviewProps = {
	message: MailMessage;
	isExpanded: boolean;
	isAlone: boolean;
	isInsideExtraWindow: boolean;
};

export const ConversationMessagePreview = ({
	message,
	isExpanded,
	isAlone,
	isInsideExtraWindow
}: ConversationMessagePreviewProps): React.JSX.Element => (
	<Padding bottom="medium" width="100%" data-testid={`ConversationMessagePreview-${message.id}`}>
		<MailPreview
			message={message}
			expanded={isExpanded}
			isAlone={isAlone}
			isMessageView={false}
			isInsideExtraWindow={isInsideExtraWindow}
		/>
	</Padding>
);
