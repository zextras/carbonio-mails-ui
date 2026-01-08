/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC } from 'react';

import { DetailPanelContainer } from '../../../../components/detail-panel/detail-panel-container';
import { MessagePanelBody } from '../../../../components/detail-panel/message-panel-body';
import { IncompleteMessage, MailMessage } from '../../../../types';
import { DetailPanelHeader } from '../header/detail-panel-header';

export const MessagePreview: FC<{
	folderId: string;
	message: MailMessage | IncompleteMessage | undefined;
	isMessageLoaded: boolean;
	isEml?: boolean;
}> = ({ folderId, message, isMessageLoaded, isEml }) => (
	<DetailPanelContainer>
		<DetailPanelHeader
			folderId={folderId}
			itemType={'message'}
			isRead={message?.read}
			subject={message?.subject}
		/>
		<MessagePanelBody isMessageFetched={isMessageLoaded} isEml={isEml} message={message} />
	</DetailPanelContainer>
);
