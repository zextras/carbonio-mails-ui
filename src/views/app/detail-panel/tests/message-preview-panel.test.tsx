/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { render, screen } from '@testing-library/react';

import { setupTest } from '../../../../carbonio-ui-commons/test/test-setup';
import { API_REQUEST_STATUS } from '../../../../constants';
import { useCompleteMessageOrFetch } from '../../../../store/emails/hooks/hooks';
import { updateMessageStatus } from '../../../../store/emails/store';
import { useExtraWindow } from '../../extra-windows/use-extra-window';
import { MessagePreviewPanel } from '../message-preview-panel';

jest.mock('../../../../store/emails/hooks/hooks');
jest.mock('../../extra-windows/use-extra-window');

describe('MessagePreviewPanel', () => {
	const mockUseCompleteMessageOrFetch = useCompleteMessageOrFetch as jest.Mock;
	const mockUseExtraWindow = useExtraWindow as jest.Mock;

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('renders spinner when message is loading', () => {
		updateMessageStatus('1', API_REQUEST_STATUS.pending);
		mockUseCompleteMessageOrFetch.mockReturnValue({ message: null });
		mockUseExtraWindow.mockReturnValue({ isInsideExtraWindow: false });

		setupTest(<MessagePreviewPanel folderId="1" messageId="1" />);

		expect(screen.getByTestId('spinner')).toBeInTheDocument();
	});

	it('renders message preview when message is complete', () => {
		// eslint-disable-next-line sonarjs/no-duplicate-string
		const message = { isComplete: true, read: true, subject: 'Test Subject' };
		updateMessageStatus('1', API_REQUEST_STATUS.fulfilled);
		mockUseCompleteMessageOrFetch.mockReturnValue({ message });
		mockUseExtraWindow.mockReturnValue({ isInsideExtraWindow: false });

		setupTest(<MessagePreviewPanel folderId="1" messageId="1" />);

		expect(screen.getByText('Test Subject')).toBeInTheDocument();
	});

	it('renders null when message is not complete', () => {
		const message = { isComplete: false };
		updateMessageStatus('1', API_REQUEST_STATUS.fulfilled);
		mockUseCompleteMessageOrFetch.mockReturnValue({ message });
		mockUseExtraWindow.mockReturnValue({ isInsideExtraWindow: false });

		const { container } = render(<MessagePreviewPanel folderId="1" messageId="1" />);

		expect(container).toBeEmptyDOMElement();
	});
});
