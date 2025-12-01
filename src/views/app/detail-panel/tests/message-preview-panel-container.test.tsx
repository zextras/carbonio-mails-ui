/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { act } from '@testing-library/react';
import * as shell from '@zextras/carbonio-shell-ui';

import { updateMessageStatus } from '../../../../store/emails/store';
import { setupTest } from '@test-setup';
import { populateMessagesInEmailStore } from '__test__/generators/generateMessage';
import { MessagePreviewPanelContainer } from 'views/app/detail-panel/message-preview-panel-container';

describe('MessagePreviewPanelContainer', () => {
	const defaultTitle = 'test title';

	beforeEach(() => {
		document.title = defaultTitle;
	});

	it('should close the tab if message has an error', async () => {
		const mockedMessage = populateMessagesInEmailStore()[0];
		await act(() => updateMessageStatus(mockedMessage.id, 'error'));

		window.close = vi.fn();
		vi.mocked(shell).IS_FOCUS_MODE = true;
		const closeWindowSpy = vi.spyOn(window, 'close');
		setupTest(<MessagePreviewPanelContainer />, {
			initialEntries: [`/folder/${mockedMessage.parent}/message/${mockedMessage.id}`],
			path: '/folder/:folderId/message/:messageId'
		});

		expect(closeWindowSpy).toHaveBeenCalled();
	});

	it('should not set the window title if the focus mode is disabled', () => {
		vi.mocked(shell).IS_FOCUS_MODE = false;
		const mockedMessage = populateMessagesInEmailStore()[0];

		setupTest(<MessagePreviewPanelContainer />, {
			initialEntries: [`/folder/${mockedMessage.parent}/message/${mockedMessage.id}`],
			path: '/folder/:folderId/message/:messageId'
		});

		expect(document.title).toEqual(defaultTitle);
	});

	it('should set the window title to the message subject if the focus mode is enabled', () => {
		vi.mocked(shell).IS_FOCUS_MODE = true;
		const mockedMessage = populateMessagesInEmailStore()[0];

		setupTest(<MessagePreviewPanelContainer />, {
			initialEntries: [`/folder/${mockedMessage.parent}/message/${mockedMessage.id}`],
			path: '/folder/:folderId/message/:messageId'
		});

		expect(document.title).toEqual(mockedMessage.subject);
	});
});
