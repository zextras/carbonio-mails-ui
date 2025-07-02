/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { ModalManager } from '@zextras/carbonio-design-system';
import { Route, Routes } from 'react-router-dom';

import { ConversationPreviewPanelContainer } from 'views/app/detail-panel/conversation-preview-panel-container';
import { EmlPreviewPanelContainer } from 'views/app/detail-panel/eml-preview-panel-container';
import { MessagePreviewPanelContainer } from 'views/app/detail-panel/message-preview-panel-container';

export default function FocusModeMailView(): React.JSX.Element {
	return (
		<ModalManager>
			<Routes>
				<Route
					path={`folder/:folderId/conversation/:conversationId`}
					element={<ConversationPreviewPanelContainer />}
				/>
				<Route path={`eml/:messageId/:part`} element={<EmlPreviewPanelContainer />} />
				<Route
					path={`folder/:folderId/message/:messageId`}
					element={<MessagePreviewPanelContainer />}
				/>
			</Routes>
		</ModalManager>
	);
}
