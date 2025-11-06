/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { act, screen } from '@testing-library/react';

import { setupTest } from '@test-setup';
import { generateMessage } from '__test__/generators/generateMessage';
import { API_REQUEST_STATUS } from 'constants/index';
import { useCompleteMessageOrFetch } from 'store/emails/hooks/use-complete-message-or-fetch';
import { updateMessageStatus } from 'store/emails/store';
import { MessagePreviewPanel } from 'views/app/detail-panel/message-preview-panel';

jest.mock('store/emails/hooks/use-complete-message-or-fetch');

describe('MessagePreviewPanel', () => {
	const mockUseCompleteMessageOrFetch = useCompleteMessageOrFetch as jest.Mock;

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('renders spinner when message is loading', () => {
		updateMessageStatus('1', API_REQUEST_STATUS.pending);
		mockUseCompleteMessageOrFetch.mockReturnValue({ message: null });

		setupTest(<MessagePreviewPanel folderId="1" message={undefined} isMessageLoaded={false} />);

		expect(screen.getByTestId('spinner')).toBeInTheDocument();
	});

	it('renders text when message is loading', () => {
		updateMessageStatus('1', API_REQUEST_STATUS.pending);
		mockUseCompleteMessageOrFetch.mockReturnValue({ message: null });

		setupTest(<MessagePreviewPanel folderId="1" message={undefined} isMessageLoaded={false} />);

		expect(screen.getByText(/Loading message, please wait.../i)).toBeVisible();
	});

	it('renders message preview when message is complete', async () => {
		const message = generateMessage();
		await act(async () => {
			updateMessageStatus('1', API_REQUEST_STATUS.fulfilled);
		});
		mockUseCompleteMessageOrFetch.mockReturnValue({ message });

		setupTest(<MessagePreviewPanel folderId="1" message={message} isMessageLoaded />);

		expect(screen.getByText(message.subject)).toBeInTheDocument();
	});
});
