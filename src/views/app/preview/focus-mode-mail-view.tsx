/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { ModalManager } from '@zextras/carbonio-design-system';
import { Route, Routes } from 'react-router-dom';

import { ConversationPreview } from './conversation-mode/conversation-preview';
import { EmlPreviewPanelContainer } from './eml-preview-panel-container';
import { MessagePreviewContainer } from './message-mode/message-preview-container';

export default function FocusModeMailView(): React.JSX.Element {
	return (
		<ModalManager>
			<Routes>
				<Route
					path={`folder/:folderId/conversation/:conversationId`}
					element={<ConversationPreview />}
				/>
				<Route path={`eml/:messageId/:part`} element={<EmlPreviewPanelContainer />} />
				<Route path={`folder/:folderId/message/:messageId`} element={<MessagePreviewContainer />} />
			</Routes>
		</ModalManager>
	);
}
