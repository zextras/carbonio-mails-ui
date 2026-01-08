/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useEffect } from 'react';

import { useNavigate, useParams } from 'react-router-dom';

import { MessagePreview } from './message-preview';
import { API_REQUEST_STATUS, MAILS_ROUTE } from '../../../../constants';
import { isFocusModeMailView } from '../../../../helpers/external-tabs';
import { useCompleteMessageOrFetch } from '../../../../store/emails/hooks/hooks';
import type {
	DetailPanelRoutesParams,
	DetailPanelMessageRouteParams
} from '../../../../types/routes';

export const MessagePreviewContainer = (): React.JSX.Element => {
	const navigate = useNavigate();

	const { folderId, messageId } =
		useParams<DetailPanelRoutesParams>() as DetailPanelMessageRouteParams;

	const { message, messageStatus } = useCompleteMessageOrFetch({
		messageId
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
		<MessagePreview
			message={message}
			folderId={folderId}
			isMessageLoaded={messageStatus === API_REQUEST_STATUS.fulfilled}
		/>
	);
};
