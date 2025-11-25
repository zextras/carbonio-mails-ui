/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen } from '@testing-library/react';
import { FOLDERS } from '@zextras/carbonio-ui-commons';
import { useParams } from 'react-router-dom';
import type { Mock } from 'vitest';

import { setupTest } from '@test-setup';
import FolderPanel from 'views/app/folder-panel';
import { useIsMessageView } from 'views/search/search-view-hooks';

vi.mock('../../../search/search-view-hooks', () => ({ useIsMessageView: vi.fn() }));
vi.mock('react-router-dom', async () => ({
	...(await vi.importActual('react-router-dom')),
	useParams: vi.fn()
}));
vi.mock('../messages/message-list', () => ({
	MessageList: vi.fn(() => <div data-testid="message-list" />)
}));

vi.mock('../conversations/conversation-list', () => ({
	ConversationList: vi.fn(() => <div data-testid="conversation-list" />)
}));

vi.mock('../../../search/shimmer-list', () => vi.fn(() => <div data-testid="shimmer-list" />));

describe('FolderPanel', () => {
	it('renders MessageList when isMessageView is true', () => {
		(useIsMessageView as Mock).mockReturnValue(true);
		(useParams as Mock).mockReturnValue({
			folderId: FOLDERS.INBOX
		});
		setupTest(<FolderPanel />);
		expect(screen.getByTestId('message-list')).toBeInTheDocument();
	});

	it('renders MessageList when folder is DRAFTS and isMessageView is false', () => {
		(useIsMessageView as Mock).mockReturnValue(false);
		(useParams as Mock).mockReturnValue({
			folderId: FOLDERS.DRAFTS
		});
		setupTest(<FolderPanel />);
		expect(screen.getByTestId('message-list')).toBeInTheDocument();
	});

	it('renders MessageList when folder is TRASH', () => {
		(useIsMessageView as Mock).mockReturnValue(false);
		(useParams as Mock).mockReturnValue({
			folderId: FOLDERS.TRASH
		});
		setupTest(<FolderPanel />);
		expect(screen.getByTestId('message-list')).toBeInTheDocument();
	});

	it('shared account, renders MessageList when folder is DRAFTS and Visualization option is By Conversation', () => {
		(useIsMessageView as Mock).mockReturnValue(false); // conversation view
		(useParams as Mock).mockReturnValue({
			folderId: `d935aa03-16b3-4493-b480-86fd09b45a38:${FOLDERS.DRAFTS}`
		});
		setupTest(<FolderPanel />);
		expect(screen.getByTestId('message-list')).toBeInTheDocument();
	});

	it(' shared account renders MessageList when folder is TRASH and Visualization option is By Conversation', () => {
		(useIsMessageView as Mock).mockReturnValue(false); // conversation view
		(useParams as Mock).mockReturnValue({
			folderId: `d935aa03-16b3-4493-b480-86fd09b45a38:${FOLDERS.TRASH}`
		});
		setupTest(<FolderPanel />);
		expect(screen.getByTestId('message-list')).toBeInTheDocument();
	});

	it('renders ConversationList when isMessageView is false and folder is not DRAFTS or TRASH', () => {
		(useIsMessageView as Mock).mockReturnValue(false);
		(useParams as Mock).mockReturnValue({
			folderId: FOLDERS.SENT
		});
		setupTest(<FolderPanel />);

		expect(screen.getByTestId('conversation-list')).toBeInTheDocument();
	});
});
