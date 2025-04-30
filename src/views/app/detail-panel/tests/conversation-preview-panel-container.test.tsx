/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { act } from '@testing-library/react';
import * as shell from '@zextras/carbonio-shell-ui';

import { setupTest } from '../../../../carbonio-ui-commons/test/test-setup';
import { populateConversationInEmailStore } from '../../../../tests/generators/generateConversation';
import { ConversationPreviewPanelContainer } from '../conversation-preview-panel-container';

describe('ConversationPreviewPanelContainer', () => {
	const defaultTitle = 'test title';

	beforeEach(() => {
		document.title = defaultTitle;
	});

	it('should not set the window title if the focus mode is disabled', async () => {
		jest.mocked(shell).IS_FOCUS_MODE = false;
		const { conversation: mockedConversation, messages: mockedMessages } = await act(() =>
			populateConversationInEmailStore()
		);

		setupTest(<ConversationPreviewPanelContainer />, {
			initialEntries: [`/folder/${mockedMessages[0].parent}/conversation/${mockedConversation.id}`],
			path: '/folder/:folderId/conversation/:conversationId'
		});

		expect(document.title).toEqual(defaultTitle);
	});

	it('should set the window title to the message subject if the focus mode is enabled', async () => {
		jest.mocked(shell).IS_FOCUS_MODE = true;
		const { conversation: mockedConversation, messages: mockedMessages } = await act(() =>
			populateConversationInEmailStore()
		);

		setupTest(<ConversationPreviewPanelContainer />, {
			initialEntries: [`/folder/${mockedMessages[0].parent}/conversation/${mockedConversation.id}`],
			path: '/folder/:folderId/conversation/:conversationId'
		});

		expect(document.title).toEqual(mockedConversation.subject);
	});
});
