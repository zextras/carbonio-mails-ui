/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { ModalManager } from '@zextras/carbonio-design-system';
import { Route, Routes } from 'react-router-dom';

import { ConversationPreviewPanelContainer } from './conversation-preview-panel-container';
import { EmlPreviewPanelContainer } from './eml-preview-panel-container';
import { MessagePreviewPanelContainer } from './message-preview-panel-container';

export default function StandalonePreviewPanel(): React.JSX.Element {
	return (
		<ModalManager>
			<Routes>
				<Route
					path={`folder/:folderId/conversation/:conversationId`}
					element={<ConversationPreviewPanelContainer />}
				/>
				<Route
					path={`folder/:folderId/message/:messageId/:part`}
					element={<EmlPreviewPanelContainer />}
				/>
				<Route
					path={`folder/:folderId/message/:messageId`}
					element={<MessagePreviewPanelContainer />}
				/>
			</Routes>
		</ModalManager>
	);
}
