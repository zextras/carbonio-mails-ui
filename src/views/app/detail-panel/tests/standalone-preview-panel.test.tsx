/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { screen } from '@testing-library/react';
import { useParams } from 'react-router-dom';

import { FOLDERS } from '../../../../carbonio-ui-commons/constants/folders';
import { setupTest } from '../../../../carbonio-ui-commons/test/test-setup';
import { API_REQUEST_STATUS } from '../../../../constants';
import {
	useCompleteConversationOrFetch,
	useCompleteMessageOrFetch
} from '../../../../store/emails/hooks/hooks';
import { updateMessageStatus } from '../../../../store/emails/store';
import { useExtraWindow } from '../../extra-windows/use-extra-window';
import { StandalonePreviewPanel } from '../standalone-preview-panel';

jest.mock('../../../../store/emails/hooks/hooks');
jest.mock('../../extra-windows/use-extra-window');
jest.mock('react-router-dom', () => ({
	...jest.requireActual('react-router-dom'),
	useParams: jest.fn()
}));

describe('StandalonePreviewPanel', () => {
	const mockUseCompleteMessageOrFetch = useCompleteMessageOrFetch as jest.Mock;
	const mockUseCompleteConversationOrFetch = useCompleteConversationOrFetch as jest.Mock;
	const mockUseExtraWindow = useExtraWindow as jest.Mock;
	afterEach(() => {
		jest.clearAllMocks();
	});

	it('renders message preview when type is message', () => {
		(useParams as jest.Mock).mockReturnValue({
			folderId: '1',
			type: 'message',
			itemId: '1'
		});
		const message = { isComplete: true, read: true, subject: 'Test Subject', id: '1' };
		updateMessageStatus('1', API_REQUEST_STATUS.fulfilled);
		mockUseCompleteMessageOrFetch.mockReturnValue({ message });
		mockUseExtraWindow.mockReturnValue({ isInsideExtraWindow: false });
		setupTest(<StandalonePreviewPanel />);
		expect(screen.getByTestId('MailPreview-1')).toBeInTheDocument();
	});

	it('renders conversation preview when type is conversation', () => {
		(useParams as jest.Mock).mockReturnValue({
			folderId: FOLDERS.TRASH,
			type: 'conversation',
			itemId: '1'
		});
		const conversation = {
			conversation: {
				messageIds: ['1']
			},
			conversationStatus: API_REQUEST_STATUS.fulfilled
		};
		mockUseCompleteConversationOrFetch.mockReturnValue(conversation);
		mockUseExtraWindow.mockReturnValue({ isInsideExtraWindow: false });
		setupTest(<StandalonePreviewPanel />);
		expect(screen.getByTestId('ConversationMessagePreview-1')).toBeInTheDocument();
	});

	it('renders error message when type is unknown', () => {
		(useParams as jest.Mock).mockReturnValue({
			folderId: FOLDERS.TRASH,
			type: 'invalid',
			itemId: '1'
		});

		setupTest(<StandalonePreviewPanel />);
		expect(screen.getByText('Unknown type invalid')).toBeInTheDocument();
	});
});
