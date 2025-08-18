/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { useEffect, useState } from 'react';

import { useParams } from 'react-router-dom';

import { getMsgSoapApi } from 'api/get-msg-soap-api';
import { isFocusModeMailView } from 'helpers/external-tabs';
import { normalizeMailMessageFromSoap } from 'normalizations/normalize-message';
import { MailMessage } from 'types/index.d';
import { MessagePreviewPanel } from 'views/app/detail-panel/message-preview-panel';

export const EmlPreviewPanelContainer = (): React.JSX.Element => {
	const [message, setMessage] = useState<MailMessage>();

	const { folderId, itemId, part } = useParams() as {
		folderId: string;
		itemId: string;
		part: string;
	};

	useEffect(() => {
		if (message) {
			return;
		}
		getMsgSoapApi({ msgId: itemId, part }).then((response) => {
			if (!response || 'Fault' in response) {
				return;
			}
			setMessage(normalizeMailMessageFromSoap(response.m[0], true) as MailMessage);
		});
	}, [itemId, message, part]);

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
