/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { Container } from '@zextras/carbonio-design-system';
import { useAppContext } from '@zextras/carbonio-shell-ui';
import { Route, Routes } from 'react-router-dom';

import { AppContext } from 'app-utils/app-context-initializer';
import { ConversationPreviewPanelContainer } from 'views/app/detail-panel/conversation-preview-panel-container';
import { MessagePreviewPanelContainer } from 'views/app/detail-panel/message-preview-panel-container';
import { SelectionInteractive } from 'views/app/detail-panel/selection-interactive';

// Route parameter types for the detail panel.
// Defined here for easy access by children components.
// React Router DOM doesn't provide built-in type safety for route params,
// so this serves as a workaround to ensure type consistency.
// Better approaches are very welcome
export type DetailPanelRouteParams = {
	folderId: string;
	itemId: string;
};

const DetailPanel = (): React.JSX.Element => {
	const { multipleSelectionCount } = useAppContext<AppContext>();
	return (
		<Container width="fill" data-testid="detail-panel-test-id" style={{ overflowY: 'auto' }}>
			<Routes>
				<Route
					path={`folder/:folderId`}
					element={<SelectionInteractive count={multipleSelectionCount} />}
				/>
				<Route
					path={`folder/:folderId/conversation/:itemId`}
					element={<ConversationPreviewPanelContainer />}
				/>
				<Route
					path={`folder/:folderId/message/:itemId`}
					element={<MessagePreviewPanelContainer />}
				/>
			</Routes>
		</Container>
	);
};

export default DetailPanel;
