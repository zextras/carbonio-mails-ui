/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { Route, Routes, useParams } from 'react-router-dom';

import { ConversationPreviewPanelContainer } from './conversation-preview-panel-container';
import { MessagePreviewPanel } from './message-preview-panel';
import { MessagePreviewPanelContainer } from './message-preview-panel-container';

// TODO: StandalonePreviewPanelWrapper hold the logic so StandalonePreviewPanel can be removed when tests are fixed
export function StandalonePreviewPanel(): React.JSX.Element {
	const { folderId, type, itemId } = useParams<{
		folderId: string;
		type: string;
		itemId: string;
	}>();

	// FIXME: Maybe there is a better way to handle this
	// 	- Maybe Route fallback
	if (!folderId || !type || !itemId) {
		throw new Error('Missing route parameters');
	}

	if (type === 'message') return <MessagePreviewPanel folderId={folderId} messageId={itemId} />;
	if (type === 'conversation') return <ConversationPreviewPanelContainer />;
	return <span>{`Unknown type ${type}`}</span>;
}

export default function StandalonePreviewPanelWrapper(): React.JSX.Element {
	return (
		<Routes>
			<Route
				path={`folder/:folderId/conversation/:conversationId`}
				element={<ConversationPreviewPanelContainer />}
			/>
			<Route
				path={`folder/:folderId/message/:messageId`}
				element={<MessagePreviewPanelContainer />}
			/>
		</Routes>
	);
}
