/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC } from 'react';

import { Container } from '@zextras/carbonio-design-system';
import { useAppContext } from '@zextras/carbonio-shell-ui';
import { Route, Routes } from 'react-router-dom';

import { ConversationPreview } from './conversation-mode/conversation-preview';
import { MessagePreviewContainer } from './message-mode/message-preview-container';
import { SelectionInteractive } from './selection-interactive';
import { AppContext } from '../../../app-utils/app-context-initializer';

const DetailPanel: FC = () => {
	const { multipleSelectionCount } = useAppContext<AppContext>();
	return (
		<Container width="fill" data-testid="third-panel" style={{ overflowY: 'auto' }}>
			<Routes>
				<Route
					path={`folder/:folderId`}
					element={<SelectionInteractive count={multipleSelectionCount} />}
				/>
				<Route
					path={`folder/:folderId/conversation/:conversationId`}
					element={<ConversationPreview />}
				/>
				<Route path={`folder/:folderId/message/:messageId`} element={<MessagePreviewContainer />} />
			</Routes>
		</Container>
	);
};

export default DetailPanel;
