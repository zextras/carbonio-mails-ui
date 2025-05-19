/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC } from 'react';

import { Container } from '@zextras/carbonio-design-system';
import { useAppContext } from '@zextras/carbonio-shell-ui';
import { Route, Routes } from 'react-router-dom';

import { MessagePreviewPanelContainer } from './detail-panel/message-preview-panel-container';
import { SelectionInteractive } from './detail-panel/selection-interactive';
import type { AppContext } from '../../types';
import { ConversationPreviewPanelContainer } from './detail-panel/conversation-preview-panel-container';

const DetailPanel: FC = () => {
	const { count } = useAppContext<AppContext>();
	return (
		<Container width="fill" data-testid="third-panel" style={{ overflowY: 'auto' }}>
			<Routes>
				<Route path={`folder/:folderId`} element={<SelectionInteractive count={count} />} />
				<Route
					path={`folder/:folderId/conversation/:conversationId`}
					element={<ConversationPreviewPanelContainer />}
				/>
				<Route
					path={`folder/:folderId/message/:messageId`}
					element={<MessagePreviewPanelContainer />}
				/>
			</Routes>
		</Container>
	);
};

export default DetailPanel;
