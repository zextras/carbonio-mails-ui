/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen } from '@testing-library/react';

import { setupTest } from '../../../../carbonio-ui-commons/test/test-setup';
import { API_REQUEST_STATUS } from '../../../../constants';
import { useCompleteMessageOrFetch } from '../../../../store/emails/hooks/hooks';
import { updateMessageStatus } from '../../../../store/emails/store';
import { generateMessage } from '../../../../tests/generators/generateMessage';
import { MessagePreviewPanel } from '../message-preview-panel';

jest.mock('../../../../store/emails/hooks/hooks');

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

	it('renders message preview when message is complete', () => {
		const message = generateMessage();
		updateMessageStatus('1', API_REQUEST_STATUS.fulfilled);
		mockUseCompleteMessageOrFetch.mockReturnValue({ message });

		setupTest(<MessagePreviewPanel folderId="1" message={message} isMessageLoaded />);

		expect(screen.getByText(message.subject)).toBeInTheDocument();
	});
});
