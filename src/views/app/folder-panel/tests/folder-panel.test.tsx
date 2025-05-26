/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';
import { screen } from '@testing-library/react';
import { useParams } from 'react-router-dom';

import { FOLDERS, setupTest } from '@zextras/carbonio-ui-commons';
import { useIsMessageView } from '../../../search/search-view-hooks';
import FolderPanel from '../../folder-panel';

jest.mock('../../../search/search-view-hooks', () => ({ useIsMessageView: jest.fn() }));
jest.mock('react-router-dom', () => ({
	...jest.requireActual('react-router-dom'),
	useParams: jest.fn()
}));
jest.mock('../messages/message-list', () => ({
	MessageList: jest.fn(() => <div data-testid="message-list" />)
}));

jest.mock('../conversations/conversation-list', () => ({
	ConversationList: jest.fn(() => <div data-testid="conversation-list" />)
}));

jest.mock('../../../search/shimmer-list', () => jest.fn(() => <div data-testid="shimmer-list" />));

describe('FolderPanel', () => {
	it('renders MessageList when isMessageView is true', () => {
		(useIsMessageView as jest.Mock).mockReturnValue(true);
		(useParams as jest.Mock).mockReturnValue({
			folderId: FOLDERS.INBOX
		});
		setupTest(<FolderPanel />);
		expect(screen.getByTestId('message-list')).toBeInTheDocument();
	});

	it('renders MessageList when folder is DRAFTS and isMessageView is false', () => {
		(useIsMessageView as jest.Mock).mockReturnValue(false);
		(useParams as jest.Mock).mockReturnValue({
			folderId: FOLDERS.DRAFTS
		});
		setupTest(<FolderPanel />);
		expect(screen.getByTestId('message-list')).toBeInTheDocument();
	});

	it('renders MessageList when folder is TRASH', () => {
		(useIsMessageView as jest.Mock).mockReturnValue(false);
		(useParams as jest.Mock).mockReturnValue({
			folderId: FOLDERS.TRASH
		});
		setupTest(<FolderPanel />);
		expect(screen.getByTestId('message-list')).toBeInTheDocument();
	});

	it('shared account, renders MessageList when folder is DRAFTS and Visualization option is By Conversation', () => {
		(useIsMessageView as jest.Mock).mockReturnValue(false); // conversation view
		(useParams as jest.Mock).mockReturnValue({
			folderId: `d935aa03-16b3-4493-b480-86fd09b45a38:${FOLDERS.DRAFTS}`
		});
		setupTest(<FolderPanel />);
		expect(screen.getByTestId('message-list')).toBeInTheDocument();
	});

	it(' shared account renders MessageList when folder is TRASH and Visualization option is By Conversation', () => {
		(useIsMessageView as jest.Mock).mockReturnValue(false); // conversation view
		(useParams as jest.Mock).mockReturnValue({
			folderId: `d935aa03-16b3-4493-b480-86fd09b45a38:${FOLDERS.TRASH}`
		});
		setupTest(<FolderPanel />);
		expect(screen.getByTestId('message-list')).toBeInTheDocument();
	});

	it('renders ConversationList when isMessageView is false and folder is not DRAFTS or TRASH', () => {
		(useIsMessageView as jest.Mock).mockReturnValue(false);
		(useParams as jest.Mock).mockReturnValue({
			folderId: FOLDERS.SENT
		});
		setupTest(<FolderPanel />);

		expect(screen.getByTestId('conversation-list')).toBeInTheDocument();
	});
});
