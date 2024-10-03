/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { useParams } from 'react-router-dom';

import { MessagePreviewPanel } from './message-preview-panel';

export const MessagePreviewPanelContainer = (): React.JSX.Element => {
	const { folderId, messageId } = useParams<{
		folderId: string;
		messageId: string;
	}>();

	return <MessagePreviewPanel messageId={messageId} folderId={folderId} />;
};
