/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { Route, Routes, useParams } from 'react-router-dom';

import { ConversationPreviewPanelContainer } from './conversation-preview-panel-container';
import { MessagePreviewPanel } from './message-preview-panel';

export function StandalonePreviewPanel(): React.JSX.Element {
	const { folderId, type, itemId } = useParams<{
		folderId: string;
		type: string;
		itemId: string;
	}>();
	if (type === 'message') return <MessagePreviewPanel folderId={folderId} messageId={itemId} />;
	if (type === 'conversation') return <ConversationPreviewPanelContainer />;
	return <span>{`Unknown type ${type}`}</span>;
}

export default function StandalonePreviewPanelWrapper(): React.JSX.Element {
	return (
		<Routes>
			<Route path="folder/:folderId/:type?/:itemId?">
				<StandalonePreviewPanel />
			</Route>
		</Routes>
	);
}
