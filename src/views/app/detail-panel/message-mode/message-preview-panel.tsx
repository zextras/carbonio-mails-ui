/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC } from 'react';

import { IncompleteMessage, MailMessage } from '../../../../types';
import { DetailPanelContainer } from '../../../parts/detail-panel-container';
import { MessagePanelBody } from '../../../parts/message-panel-body';
import { DetailPanelHeader } from '../header/detail-panel-header';

export const MessagePreviewPanel: FC<{
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
