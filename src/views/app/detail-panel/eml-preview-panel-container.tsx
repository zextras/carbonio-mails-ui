/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { useEffect, useState } from 'react';

import { useParams } from 'react-router-dom';

import type { EmlRouteParams } from '../../../types/routes';
import { getMsgSoapApi } from 'api/get-msg-soap-api';
import { isFocusModeMailView } from 'helpers/external-tabs';
import { normalizeMailMessageFromSoap } from 'normalizations/normalize-message';
import { MailMessage } from 'types/index.d';
import { MessagePreviewPanel } from 'views/app/detail-panel/message-preview-panel';

export const EmlPreviewPanelContainer = (): React.JSX.Element => {
	const [message, setMessage] = useState<MailMessage>();

	const { folderId, messageId, part } = useParams<EmlRouteParams>() as EmlRouteParams;

	useEffect(() => {
		if (message) {
			return;
		}
		getMsgSoapApi({ msgId: messageId, part }).then((response) => {
			if (!response || 'Fault' in response) {
				return;
			}
			setMessage(normalizeMailMessageFromSoap({ m: response.m[0], isComplete: true }));
		});
	}, [message, messageId, part]);

	useEffect(() => {
		if (isFocusModeMailView() && message?.subject) {
			document.title = message.subject;
		}
	}, [message?.subject]);

	return (
		<MessagePreviewPanel
			message={message}
			folderId={folderId}
			isMessageLoaded={message !== undefined}
			isEml
		/>
	);
};
