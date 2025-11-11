/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useEffect } from 'react';

import { useUserSettings } from '@zextras/carbonio-shell-ui';
import { useNavigate, useParams } from 'react-router-dom';

import type { DetailPanelRoutesParams, DetailPanelMessageRouteParams } from '../../../types/routes';
import { API_REQUEST_STATUS, MAILS_ROUTE } from 'constants/index';
import { isFocusModeMailView } from 'helpers/external-tabs';
import { useCompleteMessageOrFetch } from 'store/emails/hooks/hooks';
import { MessagePreviewPanel } from 'views/app/detail-panel/message-preview-panel';

export const MessagePreviewPanelContainer = (): React.JSX.Element => {
	const navigate = useNavigate();

	const prefMarkMsgRead = useUserSettings()?.prefs?.zimbraPrefMarkMsgRead !== '-1';

	const { folderId, messageId } =
		useParams<DetailPanelRoutesParams>() as DetailPanelMessageRouteParams;

	const { message, messageStatus } = useCompleteMessageOrFetch({
		messageId,
		shouldMarkAsRead: prefMarkMsgRead
	});

	useEffect(() => {
		if (isFocusModeMailView() && message?.subject) {
			document.title = message.subject;
		}
	}, [message?.subject]);

	if (messageStatus === API_REQUEST_STATUS.error) {
		if (isFocusModeMailView()) {
			window.close();
		}
		navigate(`/${MAILS_ROUTE}/folder/${folderId}`, { replace: true });
	}

	return (
		<MessagePreviewPanel
			message={message}
			folderId={folderId}
			isMessageLoaded={messageStatus === API_REQUEST_STATUS.fulfilled}
		/>
	);
};
