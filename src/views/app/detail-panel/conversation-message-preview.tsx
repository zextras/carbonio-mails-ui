/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { Padding } from '@zextras/carbonio-design-system';

import { MailMessage } from 'types/messages';
import MailPreview from 'views/app/detail-panel/preview/mail-preview';

export type ConversationMessagePreviewProps = {
	message: MailMessage;
	isExpanded: boolean;
	isAlone: boolean;
};

export const ConversationMessagePreview = ({
	message,
	isExpanded,
	isAlone
}: ConversationMessagePreviewProps): React.JSX.Element => (
	<Padding bottom="medium" width="100%" data-testid={`ConversationMessagePreview-${message.id}`}>
		<MailPreview message={message} expanded={isExpanded} isAlone={isAlone} isMessageView={false} />
	</Padding>
);
