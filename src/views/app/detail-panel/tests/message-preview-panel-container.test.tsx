/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import * as shell from '@zextras/carbonio-shell-ui';

import { setupTest } from '../../../../carbonio-ui-commons/test/test-setup';
import { populateMessagesInEmailStore } from '../../../../tests/generators/generateMessage';
import { MessagePreviewPanelContainer } from '../message-preview-panel-container';

describe('MessagePreviewPanelContainer', () => {
	const defaultTitle = 'test title';

	beforeEach(() => {
		document.title = defaultTitle;
	});

	it('should not set the window title if the focus mode is disabled', () => {
		jest.mocked(shell).IS_FOCUS_MODE = false;
		const mockedMessage = populateMessagesInEmailStore()[0];

		setupTest(<MessagePreviewPanelContainer />, {
			initialEntries: [`/folder/${mockedMessage.parent}/message/${mockedMessage.id}`],
			path: '/folder/:folderId/message/:messageId'
		});

		expect(document.title).toEqual(defaultTitle);
	});

	it('should set the window title to the message subject if the focus mode is enabled', () => {
		jest.mocked(shell).IS_FOCUS_MODE = true;
		const mockedMessage = populateMessagesInEmailStore()[0];

		setupTest(<MessagePreviewPanelContainer />, {
			initialEntries: [`/folder/${mockedMessage.parent}/message/${mockedMessage.id}`],
			path: '/folder/:folderId/message/:messageId'
		});

		expect(document.title).toEqual(mockedMessage.subject);
	});
});
