/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { screen } from '@testing-library/react';
import { useAppContext } from '@zextras/carbonio-shell-ui';

import { setupTest } from '@test-setup';
import DetailPanel from 'views/app/detail-panel';

jest.mock('views/app/detail-panel/conversation-preview-panel-container', () => ({
	ConversationPreviewPanelContainer: (): React.JSX.Element => (
		<div data-testid="conversation-preview">Conversation Preview Panel</div>
	)
}));

jest.mock('views/app/detail-panel/message-preview-panel-container', () => ({
	MessagePreviewPanelContainer: (): React.JSX.Element => (
		<div data-testid="message-preview">Message Preview Panel</div>
	)
}));

describe('DetailPanel', () => {
	const mockUseAppContext = useAppContext as jest.MockedFunction<typeof useAppContext>;

	beforeEach(() => {
		jest.clearAllMocks();
		// Default mock implementation
		mockUseAppContext.mockReturnValue({
			multipleSelectionCount: 0
		});
	});

	describe('Container rendering', () => {
		it('should render the container with correct attributes', () => {
			setupTest(<DetailPanel />, { initialEntries: ['/'] });

			const container = screen.getByTestId('detail-panel-test-id');
			expect(container).toBeInTheDocument();
			expect(container).toHaveStyle({ overflowY: 'auto' });
		});
	});

	describe('Route: /folder/:folderId', () => {
		it('should render SelectionInteractive when navigating to folder route', () => {
			mockUseAppContext.mockReturnValue({
				multipleSelectionCount: 5
			} as any);

			setupTest(<DetailPanel />, { initialEntries: ['/folder/123'] });

			expect(screen.getByTestId('selection-interactive')).toBeInTheDocument();
			expect(screen.getByText('label.mail_selected')).toBeInTheDocument();
		});
	});

	describe('Route: /folder/:folderId/conversation/:itemId', () => {
		it('should render ConversationPreviewPanelContainer for conversation route', () => {
			setupTest(<DetailPanel />, { initialEntries: ['/folder/123/conversation/456'] });
			expect(screen.getByTestId('conversation-preview')).toBeInTheDocument();
			expect(screen.getByText('Conversation Preview Panel')).toBeInTheDocument();
		});

		it('should not render SelectionInteractive or MessagePreviewPanelContainer', () => {
			setupTest(<DetailPanel />, { initialEntries: ['/folder/123/conversation/456'] });
			expect(screen.queryByTestId('selection-interactive')).not.toBeInTheDocument();
			expect(screen.queryByTestId('message-preview')).not.toBeInTheDocument();
		});
	});

	describe('Route: /folder/:folderId/message/:itemId', () => {
		it('should render MessagePreviewPanelContainer for message route', () => {
			setupTest(<DetailPanel />, { initialEntries: ['/folder/123/message/456'] });

			expect(screen.getByTestId('message-preview')).toBeInTheDocument();
			expect(screen.getByText('Message Preview Panel')).toBeInTheDocument();
		});

		it('should not render SelectionInteractive or ConversationPreviewPanelContainer', () => {
			setupTest(<DetailPanel />, { initialEntries: ['/folder/123/message/456'] });

			expect(screen.queryByTestId('selection-interactive')).not.toBeInTheDocument();
			expect(screen.queryByTestId('conversation-preview')).not.toBeInTheDocument();
		});
	});

	describe('Route navigation', () => {
		it('should render nothing for unmatched routes', () => {
			setupTest(<DetailPanel />, { initialEntries: ['/unknown/route'] });
			expect(screen.queryByTestId('selection-interactive')).not.toBeInTheDocument();
			expect(screen.queryByTestId('conversation-preview')).not.toBeInTheDocument();
			expect(screen.queryByTestId('message-preview')).not.toBeInTheDocument();
		});

		it('should handle route with shared folders and message in params', () => {
			setupTest(<DetailPanel />, {
				initialEntries: [
					'/folder/ba7b810-9dad-11d1-80b4-00c04fd430c8/message/c7d0e3b2-aecd-425d-94f1-1c03b8b25bb8:123'
				]
			});
			expect(screen.getByTestId('message-preview')).toBeInTheDocument();
		});
	});
});
