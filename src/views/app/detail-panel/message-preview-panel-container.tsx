/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { useParams } from 'react-router-dom';

import { MessagePreviewPanel } from './message-preview-panel';
import { API_REQUEST_STATUS } from '../../../constants';
import { useCompleteMessageOrFetch } from '../../../store/emails/hooks/hooks';
import { useMessageStatus } from '../../../store/emails/store';

export const MessagePreviewPanelContainer = (): React.JSX.Element => {
	const { folderId, messageId } = useParams() as {
		folderId: string;
		messageId: string;
	};

	const { message } = useCompleteMessageOrFetch(messageId);
	const messageLoadingStatus = useMessageStatus(messageId);

	return (
		<MessagePreviewPanel
			message={message}
			folderId={folderId}
			isMessageLoaded={messageLoadingStatus === API_REQUEST_STATUS.fulfilled}
		/>
	);
};
