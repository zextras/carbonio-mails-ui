/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { useEffect, useState } from 'react';

import { useParams } from 'react-router-dom';

import { MessagePreviewPanel } from './message-preview-panel';
import { getMsgSoapApi } from '../../../api/get-msg-soap-api';
import { normalizeMailMessageFromSoap } from '../../../normalizations/normalize-message';
import { MailMessage } from '../../../types';

export const EmlPreviewPanelContainer = (): React.JSX.Element => {
	const [message, setMessage] = useState<MailMessage>();

	const { folderId, messageId, part } = useParams() as {
		folderId: string;
		messageId: string;
		part: string;
	};

	useEffect(() => {
		if (message) {
			return;
		}
		getMsgSoapApi({ msgId: messageId, part }).then((response) => {
			if (!response || 'Fault' in response) {
				return;
			}
			setMessage(normalizeMailMessageFromSoap(response.m[0], true) as MailMessage);
		});
	}, [message, messageId, part]);

	return (
		<MessagePreviewPanel
			message={message}
			folderId={folderId}
			isMessageLoaded={message !== undefined}
		/>
	);
};
